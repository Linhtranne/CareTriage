package com.caretriage.application.ai.service;

import com.caretriage.application.ai.model.TriageAiRequest;
import com.caretriage.application.ai.port.TriageAiEngine;
import com.caretriage.application.service.AiClientService;
import com.caretriage.infrastructure.ai.config.LangChain4jConfig;
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
public class TriageAiRuntimeRouterTest {

    @Mock
    private LangChain4jConfig langChain4jConfig;

    @Mock
    private TriageAiEngine triageAiEngine;

    @Mock
    private AiClientService aiClientService;

    private TriageAiRuntimeRouter router;

    @BeforeEach
    void setUp() {
        router = new TriageAiRuntimeRouter(langChain4jConfig, triageAiEngine, aiClientService);
    }

    @Test
    void streamAnalyzeSymptoms_WithJavaRuntime_RoutesToJavaEngine() {
        // Arrange
        when(langChain4jConfig.getRuntime()).thenReturn("java");
        
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

    @Test
    void streamAnalyzeSymptoms_WithPythonRuntime_RoutesToPythonPrimary() {
        // Arrange
        when(langChain4jConfig.getRuntime()).thenReturn("python");

        Map<String, Object> mockEvent = new HashMap<>();
        mockEvent.put("event", "token");
        mockEvent.put("content", "Hello Python");

        when(aiClientService.streamAnalyzeSymptoms(eq("2"), eq("Sore throat"), anyList(), eq("turn-456")))
                .thenReturn(Flux.just(mockEvent));

        // Act
        List<Map<String, Object>> resultList = router.streamAnalyzeSymptoms(
                2L, "turn-456", "Sore throat", Collections.emptyList()
        ).collectList().block();

        // Assert
        assertThat(resultList).hasSize(1);
        assertThat(resultList.get(0)).containsEntry("event", "token");
        assertThat(resultList.get(0)).containsEntry("content", "Hello Python");

        verify(aiClientService).streamAnalyzeSymptoms(eq("2"), eq("Sore throat"), anyList(), eq("turn-456"));
        verifyNoInteractions(triageAiEngine);
    }

    @Test
    void streamAnalyzeSymptoms_WithJavaShadow_ReturnsPythonAndRunsJava() {
        when(langChain4jConfig.getRuntime()).thenReturn("java-shadow");
        Map<String, Object> pythonFinal = Map.of(
                "event", "final",
                "classification_status", "OK",
                "red_flag_detected", false);
        Map<String, Object> javaFinal = Map.of(
                "event", "final",
                "classification_status", "OK",
                "red_flag_detected", false);
        when(aiClientService.streamAnalyzeSymptoms(eq("3"), eq("Headache"), anyList(), eq("turn-shadow")))
                .thenReturn(Flux.just(pythonFinal));
        when(triageAiEngine.streamAnalyzeSymptoms(any(TriageAiRequest.class)))
                .thenReturn(Flux.just(javaFinal));

        List<Map<String, Object>> result = router.streamAnalyzeSymptoms(
                3L, "turn-shadow", "Headache", Collections.emptyList())
                .collectList()
                .block();

        assertThat(result).containsExactly(pythonFinal);
        verify(aiClientService).streamAnalyzeSymptoms(eq("3"), eq("Headache"), anyList(), eq("turn-shadow"));
        verify(triageAiEngine, timeout(1000)).streamAnalyzeSymptoms(any(TriageAiRequest.class));
    }
}
