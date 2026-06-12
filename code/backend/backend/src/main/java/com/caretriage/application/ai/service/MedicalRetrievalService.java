package com.caretriage.application.ai.service;

import com.caretriage.application.ai.model.ClinicalEvidence;
import com.caretriage.application.ai.port.ClinicalRetriever;
import com.caretriage.infrastructure.ai.config.LangChain4jConfig;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;

@Service
@RequiredArgsConstructor
@Slf4j
public class MedicalRetrievalService implements ClinicalRetriever {

    private final LangChain4jConfig langChain4jConfig;
    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore<TextSegment> embeddingStore;

    @Override
    public List<ClinicalEvidence> retrieveRelevantInfo(String patientSymptomText) {
        if (!langChain4jConfig.getRag().isEnabled()) {
            log.info("RAG is disabled in configuration. Returning empty evidence.");
            return Collections.emptyList();
        }

        if (patientSymptomText == null || patientSymptomText.trim().isEmpty()) {
            return Collections.emptyList();
        }

        log.debug("Performing clinical RAG semantic search.");

        try {
            Embedding queryEmbedding = embeddingModel.embed(patientSymptomText).content();
            LangChain4jConfig.RagProperties rag = langChain4jConfig.getRag();
            List<EmbeddingMatch<TextSegment>> matches = embeddingStore.findRelevant(
                    queryEmbedding,
                    rag.getMaxResults(),
                    rag.getMinRelevanceScore());

            if (matches == null || matches.isEmpty()) {
                log.info("No relevant clinical evidence found for the query.");
                return Collections.emptyList();
            }

            log.info("RAG search found {} candidate matches.", matches.size());

            List<ClinicalEvidence> evidenceList = new ArrayList<>();
            int accumulatedChars = 0;

            for (EmbeddingMatch<TextSegment> match : matches) {
                TextSegment segment = match.embedded();
                if (segment == null) continue;

                ClinicalEvidence evidence = toEvidence(segment, match.score());
                if (!passesGovernance(evidence, rag)) {
                    continue;
                }

                String content = evidence.content();
                if (accumulatedChars + content.length() > rag.getMaxContextCharacters()) {
                    log.info("RAG context budget limit reached ({} chars). Truncating remaining results.", accumulatedChars);
                    break;
                }

                evidenceList.add(evidence);
                accumulatedChars += content.length();
            }

            log.info("Retrieved {} governed clinical evidence segments.", evidenceList.size());
            return evidenceList;

        } catch (Exception e) {
            log.warn("RAG retrieval pipeline failed; continuing in degraded mode.");
            throw new IllegalStateException("RAG retrieval failed", e);
        }
    }

    private ClinicalEvidence toEvidence(TextSegment segment, double score) {
        String evidenceId = segment.metadata().get("chunk_id");
        if (evidenceId == null) {
            evidenceId = "doc-" + Math.abs(segment.text().hashCode());
        }
        return new ClinicalEvidence(
                evidenceId,
                segment.metadata().get("source_id"),
                segment.metadata().get("source_title"),
                segment.metadata().get("source_url"),
                segment.text(),
                score,
                segment.metadata().get("corpus_version"),
                segment.metadata().get("medical_specialty"),
                segment.metadata().get("published_at"),
                defaultIfBlank(segment.metadata().get("source_type"), "guideline"),
                defaultIfBlank(segment.metadata().get("publisher"), "CareTriage Clinical Corpus"),
                defaultIfBlank(segment.metadata().get("language"), "vi"),
                segment.metadata().get("section"),
                segment.metadata().get("integrity_hash"),
                segment.metadata().get("reviewed_at"),
                segment.metadata().get("expires_at"),
                Boolean.parseBoolean(defaultIfBlank(segment.metadata().get("phi_safe"), "false"))
        );
    }

    private boolean passesGovernance(ClinicalEvidence evidence, LangChain4jConfig.RagProperties rag) {
        if (rag.isRequirePhiSafe() && !evidence.phiSafe()) {
            return false;
        }
        if (rag.isRequireIntegrityHash()
                && (evidence.integrityHash() == null
                || !evidence.integrityHash().equals(sha256(evidence.content())))) {
            return false;
        }
        if (!isFresh(evidence, rag.getMaxEvidenceAgeDays())) {
            return false;
        }
        List<String> allowedSourceTypes = rag.getAllowedSourceTypes();
        return allowedSourceTypes == null
                || allowedSourceTypes.isEmpty()
                || allowedSourceTypes.contains(evidence.sourceType());
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private boolean isFresh(ClinicalEvidence evidence, int maxAgeDays) {
        try {
            LocalDate today = LocalDate.now();
            if (evidence.expiresAt() != null && LocalDate.parse(evidence.expiresAt()).isBefore(today)) {
                return false;
            }
            if (evidence.reviewedAt() == null) {
                return false;
            }
            return !LocalDate.parse(evidence.reviewedAt()).isBefore(today.minusDays(maxAgeDays));
        } catch (DateTimeParseException ex) {
            return false;
        }
    }

    private String sha256(String content) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(content.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }
}
