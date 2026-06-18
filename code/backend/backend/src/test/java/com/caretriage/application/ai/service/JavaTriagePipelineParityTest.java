package com.caretriage.application.ai.service;

import com.caretriage.application.ai.model.TriageAiRequest;
// import com.caretriage.application.ai.model.TriageClassification;
import com.caretriage.application.ai.model.TriageClassificationResult;
// import com.caretriage.application.ai.model.PolicyResult;
// import com.caretriage.application.ai.model.TriageResultDetail;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.output.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.stubbing.Answer;
// import reactor.core.publisher.Flux;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class JavaTriagePipelineParityTest {

    @Mock
    private ChatLanguageModel chatLanguageModel;

    @Mock
    private StreamingChatLanguageModel streamingChatLanguageModel;

    @Mock
    private TriageClassifier triageClassifier;

    @Mock
    private com.caretriage.application.ai.port.ClinicalRetriever clinicalRetriever;

    private final RagContextBuilder ragContextBuilder = new RagContextBuilder();
    private final CitationValidator citationValidator = new CitationValidator();

    private LangChainTriageEngine engine;

    @BeforeEach
    void setUp() {
        engine = new LangChainTriageEngine(
                streamingChatLanguageModel,
                triageClassifier,
                clinicalRetriever,
                ragContextBuilder,
                citationValidator
        );
    }

    @Test
    void streamAnalyzeSymptoms_WithRedFlag_BypassesLLMAndEmitsImmediately() {
        // Arrange
        TriageAiRequest request = TriageAiRequest.builder()
                .sessionId(1L)
                .turnId("turn-rf-123")
                .currentMessage("tôi bị méo miệng đột ngột")
                .conversationHistory(Collections.emptyList())
                .build();

        // Act
        List<Map<String, Object>> events = engine.streamAnalyzeSymptoms(request)
                .collectList()
                .block();

        // Assert
        verifyNoInteractions(streamingChatLanguageModel);
        verifyNoInteractions(triageClassifier);

        assertThat(events).hasSize(2);
        
        Map<String, Object> tokenEvent = events.get(0);
        assertThat(tokenEvent.get("event")).isEqualTo("token");
        assertThat(tokenEvent.get("turn_id")).isEqualTo("turn-rf-123");
        assertThat(tokenEvent.get("sequence")).isEqualTo(1);
        assertThat(tokenEvent.get("content").toString()).contains("méo miệng");

        Map<String, Object> finalEvent = events.get(1);
        assertThat(finalEvent.get("event")).isEqualTo("final");
        assertThat(finalEvent.get("turn_id")).isEqualTo("turn-rf-123");
        assertThat(finalEvent.get("intake_complete")).isEqualTo(true);
        assertThat(finalEvent.get("red_flag_detected")).isEqualTo(true);
        
        @SuppressWarnings("unchecked")
        Map<String, Object> triageResult = (Map<String, Object>) finalEvent.get("triage_result");
        assertThat(triageResult).isNotNull();
        assertThat(triageResult.get("suggested_department_code")).isEqualTo("EMERGENCY");
        assertThat(triageResult.get("suggested_department_name")).isEqualTo("Cấp cứu");
    }

    @Test
    void streamAnalyzeSymptoms_StandardFlow_OKClassification() {
        // Arrange
        TriageAiRequest request = TriageAiRequest.builder()
                .sessionId(1L)
                .turnId("turn-standard-123")
                .currentMessage("tôi bị đau đầu")
                .conversationHistory(Collections.emptyList())
                .build();

        // Mock Phase A (streaming response)
        when(clinicalRetriever.retrieveRelevantInfo(anyString())).thenReturn(Collections.emptyList());
        doAnswer((Answer<Void>) invocation -> {
            StreamingResponseHandler<AiMessage> handler = invocation.getArgument(1);
            handler.onNext("Tôi ");
            handler.onNext("hiểu ");
            handler.onNext("triệu ");
            handler.onNext("chứng.");
            handler.onComplete(Response.from(AiMessage.from("Tôi hiểu triệu chứng.")));
            return null;
        }).when(streamingChatLanguageModel).generate(anyList(), org.mockito.ArgumentMatchers.any());

        // Mock Phase B (classification)
        TriageClassificationResult mockClassify = new TriageClassificationResult(
                true,
                false,
                Collections.emptyList(),
                "Thần kinh",
                "MEDIUM",
                0.9,
                List.of("Đau đầu căng thẳng"),
                List.of("Nghỉ ngơi"),
                "Lý do lâm sàng",
                "Tóm tắt bệnh án",
                false
        );
        when(triageClassifier.classify(anyString(), anyString())).thenReturn(mockClassify);

        // Act
        List<Map<String, Object>> events = engine.streamAnalyzeSymptoms(request)
                .collectList()
                .block();

        // Assert
        assertThat(events).hasSize(5); // 4 token events + 1 final event

        // Check tokens
        assertThat(events.get(0).get("event")).isEqualTo("token");
        assertThat(events.get(0).get("content")).isEqualTo("Tôi ");
        assertThat(events.get(3).get("event")).isEqualTo("token");
        assertThat(events.get(3).get("content")).isEqualTo("chứng.");

        // Check final event
        Map<String, Object> finalEvent = events.get(4);
        assertThat(finalEvent.get("event")).isEqualTo("final");
        assertThat(finalEvent.get("intake_complete")).isEqualTo(true);
        assertThat(finalEvent.get("red_flag_detected")).isEqualTo(false);
        assertThat(finalEvent.get("classification_status")).isEqualTo("OK");
        
        @SuppressWarnings("unchecked")
        Map<String, Object> triageResult = (Map<String, Object>) finalEvent.get("triage_result");
        assertThat(triageResult).isNotNull();
        assertThat(triageResult.get("suggested_department_code")).isEqualTo("NEUROLOGY");
        assertThat(triageResult.get("suggested_department_name")).isEqualTo("Thần kinh");
        assertThat(triageResult.get("urgency_level")).isEqualTo("MEDIUM");
        verify(triageClassifier, times(1)).classify(anyString(), anyString());
    }

    @Test
    void streamAnalyzeSymptoms_StandardFlow_PhaseBFails_ReturnsDegraded() {
        // Arrange
        TriageAiRequest request = TriageAiRequest.builder()
                .sessionId(1L)
                .turnId("turn-fail-123")
                .currentMessage("tôi bị đau đầu")
                .conversationHistory(Collections.emptyList())
                .build();

        // Mock Phase A (streaming response)
        when(clinicalRetriever.retrieveRelevantInfo(anyString())).thenReturn(Collections.emptyList());
        doAnswer((Answer<Void>) invocation -> {
            StreamingResponseHandler<AiMessage> handler = invocation.getArgument(1);
            handler.onNext("Tôi hiểu.");
            handler.onComplete(Response.from(AiMessage.from("Tôi hiểu.")));
            return null;
        }).when(streamingChatLanguageModel).generate(anyList(), org.mockito.ArgumentMatchers.any());

        // Mock Phase B fails with exception
        when(triageClassifier.classify(anyString(), anyString())).thenThrow(new RuntimeException("LLM Timeout"));

        // Act
        List<Map<String, Object>> events = engine.streamAnalyzeSymptoms(request)
                .collectList()
                .block();

        // Assert
        assertThat(events).hasSize(2); // 1 token event + 1 final event
        
        Map<String, Object> finalEvent = events.get(1);
        assertThat(finalEvent.get("event")).isEqualTo("final");
        assertThat(finalEvent.get("intake_complete")).isEqualTo(false);
        assertThat(finalEvent.get("classification_status")).isEqualTo("DEGRADED");
        assertThat(finalEvent.get("classification_error_code")).isEqualTo("LLM_PHASE_B_FAILED");
        assertThat(finalEvent.get("reply")).isEqualTo("Tôi hiểu.");
        assertThat(finalEvent.get("triage_result")).isNull();
        verify(triageClassifier, times(1)).classify(anyString(), anyString());
    }

    @Test
    void streamAnalyzeSymptoms_InvalidCitation_DoesNotMutateFinalReply() {
        TriageAiRequest request = TriageAiRequest.builder()
                .sessionId(1L)
                .turnId("turn-citation")
                .currentMessage("headache")
                .conversationHistory(Collections.emptyList())
                .build();
        when(clinicalRetriever.retrieveRelevantInfo(anyString())).thenReturn(Collections.emptyList());
        doAnswer((Answer<Void>) invocation -> {
            StreamingResponseHandler<AiMessage> handler = invocation.getArgument(1);
            handler.onNext("Advice [doc-hallucinated]");
            handler.onComplete(Response.from(AiMessage.from("Advice [doc-hallucinated]")));
            return null;
        }).when(streamingChatLanguageModel).generate(anyList(), org.mockito.ArgumentMatchers.any());
        when(triageClassifier.classify(anyString(), anyString())).thenReturn(new TriageClassificationResult(
                false,
                false,
                Collections.emptyList(),
                null,
                null,
                0.0,
                Collections.emptyList(),
                Collections.emptyList(),
                null,
                null,
                false));

        List<Map<String, Object>> events = engine.streamAnalyzeSymptoms(request).collectList().block();

        assertThat(events).hasSize(2);
        assertThat(events.get(0).get("content")).isEqualTo("Advice [doc-hallucinated]");
        assertThat(events.get(1).get("reply")).isEqualTo("Advice [doc-hallucinated]");
        assertThat(events.get(1).get("citation_status")).isEqualTo("DEGRADED");
        verify(triageClassifier, times(1)).classify(anyString(), anyString());
    }
}
