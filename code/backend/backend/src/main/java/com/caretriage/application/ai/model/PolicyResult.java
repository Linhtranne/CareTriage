package com.caretriage.application.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolicyResult {
    private boolean isTriggered;
    private String replyMsg;
    private TriageResultDetail triageResult;
}
