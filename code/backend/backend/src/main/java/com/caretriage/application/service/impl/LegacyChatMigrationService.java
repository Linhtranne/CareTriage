package com.caretriage.application.service.impl;

import com.caretriage.application.dto.ChatMessageDTO;
import com.caretriage.domain.entity.ChatMessage;
import com.caretriage.domain.entity.ChatSession;
import com.caretriage.domain.repository.ChatMessageRepository;
import com.caretriage.domain.repository.ChatSessionRepository;
import com.caretriage.shared.exception.ResourceNotFoundException;
import com.caretriage.shared.exception.LegacyMigrationException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LegacyChatMigrationService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    @Transactional
    public void migrateSessionIfLegacy(Long sessionId) {
        String redisKey = "chat:session:" + sessionId;
        Boolean hasKey = redisTemplate.hasKey(redisKey);
        if (hasKey == null || !hasKey) {
            return;
        }

        log.info("Migrating legacy Redis messages to MySQL for session: {}", sessionId);
        ChatSession session = chatSessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("ChatSession not found"));

        List<Object> redisMsgs = redisTemplate.opsForList().range(redisKey, 0, -1);
        if (redisMsgs == null || redisMsgs.isEmpty()) {
            registerRedisDeleteAfterCommit(redisKey);
            return;
        }

        List<ChatMessage> toSave = new ArrayList<>();
        for (Object obj : redisMsgs) {
            try {
                ChatMessageDTO dto = objectMapper.convertValue(obj, ChatMessageDTO.class);
                if (dto == null || dto.getContent() == null || dto.getSenderType() == null) {
                    throw new IllegalArgumentException("Malformed Redis message: content or senderType is null");
                }
                
                Long legacyId = dto.getId();
                
                boolean exists = false;
                if (legacyId != null) {
                    exists = chatMessageRepository.existsByChatSessionIdAndLegacyRedisId(sessionId, legacyId);
                }

                if (!exists) {
                    ChatMessage msg = ChatMessage.builder()
                        .chatSession(session)
                        .content(dto.getContent())
                        .senderType(dto.getSenderType())
                        .metadata(dto.getMetadata())
                        .turnId(dto.getTurnId())
                        .legacyRedisId(legacyId)
                        .build();
                    if (dto.getCreatedAt() != null) {
                        msg.setCreatedAt(dto.getCreatedAt());
                    }
                    toSave.add(msg);
                }
            } catch (IllegalArgumentException e) {
                log.error("Migration failed for session {} due to malformed message. Rollback transaction.", sessionId, e);
                throw new LegacyMigrationException(
                    "Malformed Redis record. Migration aborted to protect data.",
                    e
                );
            }
        }

        if (!toSave.isEmpty()) {
            chatMessageRepository.saveAll(toSave);
        }

        registerRedisDeleteAfterCommit(redisKey);
    }

    private void registerRedisDeleteAfterCommit(String redisKey) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    redisTemplate.delete(redisKey);
                    log.info("Successfully deleted legacy Redis key {} after commit", redisKey);
                }
            });
        } else {
            redisTemplate.delete(redisKey);
            log.info("Deleted legacy Redis key {} (no active transaction)", redisKey);
        }
    }
}
