package com.caretriage.application.ai.model;

public record ClinicalEvidence(
    String evidenceId,
    String sourceId,
    String title,
    String sourceUrl,
    String content,
    double relevanceScore,
    String corpusVersion,
    String specialtyCode,
    String publishedAt,
    String sourceType,
    String publisher,
    String language,
    String section,
    String integrityHash,
    String reviewedAt,
    String expiresAt,
    boolean phiSafe
) {
    public ClinicalEvidence(
            String evidenceId,
            String title,
            String sourceUrl,
            String content,
            double relevanceScore,
            String corpusVersion,
            String specialtyCode,
            String publishedAt) {
        this(
                evidenceId,
                null,
                title,
                sourceUrl,
                content,
                relevanceScore,
                corpusVersion,
                specialtyCode,
                publishedAt,
                "guideline",
                "CareTriage Clinical Corpus",
                "vi",
                null,
                null,
                publishedAt,
                null,
                true);
    }
}
