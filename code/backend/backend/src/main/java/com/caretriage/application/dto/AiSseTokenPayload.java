package com.caretriage.application.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AiSseTokenPayload(
    @JsonProperty("turn_id") String turnId,
    int sequence,
    String content
) {}
