package com.caretriage.application.ai.service;

import com.caretriage.application.ai.model.TriageAiRequest;
import com.caretriage.application.ai.model.TriageClassification;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
public class LangChainTriageEngineTest {

    @Autowired
    private LangChainTriageEngine langChainTriageEngine;

    @Test
    void analyzeSymptoms_ReturnsClassification() {
        TriageAiRequest request = TriageAiRequest.builder()
                .currentMessage("Tôi bị đau đầu")
                .turnId("test-turn-id")
                .conversationHistory(Collections.emptyList())
                .build();

        TriageClassification classification = langChainTriageEngine.analyzeSymptoms(request);

        assertThat(classification).isNotNull();
        assertThat(classification.triageResult()).isNotNull();
        assertThat(classification.triageResult().getUrgencyLevel()).isEqualTo("MEDIUM");
        assertThat(classification.triageResult().getSuggestedDepartmentName()).isEqualTo("Tai Mũi Họng");
        assertThat(classification.triageResult().getSummary()).contains("giả định từ Trợ lý AI CareTriage");
    }

    @Test
    void streamAnalyzeSymptoms_EmitsExpectedEvents() {
        TriageAiRequest request = TriageAiRequest.builder()
                .currentMessage("Tôi bị sốt cao")
                .turnId("test-turn-id")
                .conversationHistory(Collections.emptyList())
                .build();

        List<Map<String, Object>> events = langChainTriageEngine.streamAnalyzeSymptoms(request)
                .collectList()
                .block();

        assertThat(events).isNotEmpty();
        
        boolean hasTokens = events.stream().anyMatch(e -> "token".equals(e.get("event")));
        assertThat(hasTokens).isTrue();

        Map<String, Object> finalEvent = events.stream()
                .filter(e -> "final".equals(e.get("event")))
                .findFirst()
                .orElse(null);
        assertThat(finalEvent).isNotNull();
        assertThat(finalEvent.get("turn_id")).isEqualTo("test-turn-id");
        assertThat((String) finalEvent.get("reply")).contains("giả định từ Trợ lý AI CareTriage");
    }
}
