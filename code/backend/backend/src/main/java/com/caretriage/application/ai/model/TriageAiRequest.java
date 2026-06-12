package com.caretriage.application.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TriageAiRequest {
    private String currentMessage;
    private List<Map<String, Object>> conversationHistory;
    private String turnId;
    private Long sessionId;
    private Map<String, Object> metadata;
}
