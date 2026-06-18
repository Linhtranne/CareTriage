package com.caretriage.application.ai.service;

import com.caretriage.application.ai.model.TriageAiRequest;
import com.caretriage.application.ai.port.TriageAiEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TriageAiRuntimeRouterTest {

    @Mock
    private TriageAiEngine triageAiEngine;

    private TriageAiRuntimeRouter router;

    @BeforeEach
    void setUp() {
        router = new TriageAiRuntimeRouter(triageAiEngine);
    }

    @Test
    void streamAnalyzeSymptoms_RoutesToJavaEngine() {
        // Arrange
        Map<String, Object> mockEvent = new HashMap<>();
        mockEvent.put("event", "token");
        mockEvent.put("content", "Hello");
        
        when(triageAiEngine.streamAnalyzeSymptoms(any(TriageAiRequest.class)))
                .thenReturn(Flux.just(mockEvent));

        List<Map<String, String>> history = Collections.singletonList(
                Map.of("role", "user", "content", "Pain in chest")
        );

        // Act
        List<Map<String, Object>> resultList = router.streamAnalyzeSymptoms(
                1L, "turn-123", "I have chest pain", history
        ).collectList().block();

        // Assert
        assertThat(resultList).hasSize(1);
        assertThat(resultList.get(0)).containsEntry("event", "token");
        assertThat(resultList.get(0)).containsEntry("content", "Hello");

        ArgumentCaptor<TriageAiRequest> requestCaptor = ArgumentCaptor.forClass(TriageAiRequest.class);
        verify(triageAiEngine).streamAnalyzeSymptoms(requestCaptor.capture());
        
        TriageAiRequest capturedRequest = requestCaptor.getValue();
        assertThat(capturedRequest.getSessionId()).isEqualTo(1L);
        assertThat(capturedRequest.getTurnId()).isEqualTo("turn-123");
        assertThat(capturedRequest.getCurrentMessage()).isEqualTo("I have chest pain");
        assertThat(capturedRequest.getConversationHistory()).hasSize(1);
        assertThat(capturedRequest.getConversationHistory().get(0)).containsEntry("role", "user");
        assertThat(capturedRequest.getConversationHistory().get(0)).containsEntry("content", "Pain in chest");
    }
}
