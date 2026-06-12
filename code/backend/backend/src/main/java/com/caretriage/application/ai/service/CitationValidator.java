package com.caretriage.application.ai.service;

import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class CitationValidator {

    // Matches any bracketed text containing alphanumeric, dots, hyphens, and underscores
    private static final Pattern CITATION_PATTERN = Pattern.compile("\\[([\\w\\-\\.\\_]+)\\]");

    public Set<String> findInvalidCitations(String reply, Collection<String> allowedEvidenceIds) {
        Set<String> allowedIds = allowedEvidenceIds == null
                ? Set.of()
                : new HashSet<>(allowedEvidenceIds);
        Set<String> invalidIds = new LinkedHashSet<>();

        if (reply == null || reply.isBlank()) {
            return invalidIds;
        }

        Matcher matcher = CITATION_PATTERN.matcher(reply);
        while (matcher.find()) {
            String citationId = matcher.group(1);
            boolean isRagId = citationId.contains("_chunk_") || citationId.startsWith("doc-");
            if (isRagId && !allowedIds.contains(citationId)) {
                invalidIds.add(citationId);
            }
        }
        return invalidIds;
    }

    public String validateAndCleanCitations(String reply, Collection<String> allowedEvidenceIds) {
        if (reply == null || reply.trim().isEmpty()) {
            return reply;
        }

        Set<String> allowedIds = new HashSet<>();
        if (allowedEvidenceIds != null) {
            allowedIds.addAll(allowedEvidenceIds);
        }

        Matcher matcher = CITATION_PATTERN.matcher(reply);
        StringBuilder cleaned = new StringBuilder();
        int lastEnd = 0;

        while (matcher.find()) {
            String fullMatch = matcher.group(0);
            String citationId = matcher.group(1);

            // Append the text before this match
            cleaned.append(reply, lastEnd, matcher.start());

            // Check if it is a RAG citation ID (contains _chunk_ or starts with doc-)
            boolean isRagId = citationId.contains("_chunk_") || citationId.startsWith("doc-");

            if (isRagId) {
                if (allowedIds.contains(citationId)) {
                    // Keep the valid citation
                    cleaned.append(fullMatch);
                } else {
                    // Drop the invalid/hallucinated citation (do not append it)
                    // Also clean up any leading spaces before the citation to keep text tidy
                    if (cleaned.length() > 0 && Character.isWhitespace(cleaned.charAt(cleaned.length() - 1))) {
                        cleaned.setLength(cleaned.length() - 1);
                    }
                }
            } else {
                // Keep non-RAG bracketed text (like regular text in brackets)
                cleaned.append(fullMatch);
            }

            lastEnd = matcher.end();
        }

        // Append the remaining text
        cleaned.append(reply.substring(lastEnd));

        return cleaned.toString();
    }
}
