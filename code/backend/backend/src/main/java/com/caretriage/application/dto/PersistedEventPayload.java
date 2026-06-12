package com.caretriage.application.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PersistedEventPayload(
    @JsonProperty("turn_id") String turnId,
    @JsonProperty("ai_message_id") String aiMessageId,
    @JsonProperty("ticket_status") String ticketStatus,
    @JsonProperty("ticket_id") String ticketId,
    @JsonProperty("specialty_code") String specialtyCode,
    @JsonProperty("specialty_name") String specialtyName,
    @JsonProperty("red_flag_detected") boolean redFlagDetected
) {
    public static PersistedEventPayload fromJson(String json) {
        if (json == null) {
            return null;
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String targetJson = json.trim();
            if (targetJson.startsWith("\"") && targetJson.endsWith("\"")) {
                try {
                    targetJson = mapper.readValue(targetJson, String.class);
                } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                    // Fallback to original in case it is a malformed string
                }
            }
            return mapper.readValue(targetJson, PersistedEventPayload.class);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new com.caretriage.shared.exception.ContractViolationException(
                "Invalid persisted payload JSON",
                e
            );
        }
    }
}
