package com.caretriage.application.service.impl;

import com.caretriage.application.dto.response.NotificationResponse;
import com.caretriage.domain.entity.Notification;
import com.caretriage.domain.entity.User;
import com.caretriage.domain.repository.NotificationRepository;
import com.caretriage.domain.repository.UserRepository;
import com.caretriage.application.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    public List<NotificationResponse> getRecentNotifications(Long userId, int limit) {
        // Sử dụng PageRequest để giới hạn kết quả
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, limit))
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Unauthorized to mark this notification as read");
        }
        
        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        }
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }

    @Override
    @Transactional
    public void createNotification(Long userId, String title, String message, Notification.NotificationType type, Long referenceId, String referenceType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = Notification.builder()
                .user(com.caretriage.infrastructure.persistence.mapper.UserMapper.INSTANCE.toEntity(user))
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        
        // Push realtime via WebSocket
        pushNotification(userId, saved);
    }

    private void pushNotification(Long userId, Notification notification) {
        try {
            User user = com.caretriage.infrastructure.persistence.mapper.UserMapper.INSTANCE.toDomain(notification.getUser());
            NotificationResponse response = convertToResponse(notification);
            
            // Destination theo pattern per-user của Spring STOMP: /user/{username}/queue/notifications
            // Với Spring Security, {username} thường là email/principal name
            messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/notifications", response);
            
            log.info("Pushed notification to user {}: {}", user.getEmail(), notification.getTitle());
        } catch (RuntimeException e) {
            log.error("Failed to push notification via WebSocket", e);
        }
    }

    private NotificationResponse convertToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .isRead(n.getIsRead())
                .referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType())
                .createdAt(n.getCreatedAt())
                .build();
    }
}

