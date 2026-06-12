package com.caretriage.application.ai.port;

import com.caretriage.application.ai.model.TriageAiRequest;
import com.caretriage.application.ai.model.TriageClassification;
import reactor.core.publisher.Flux;
import java.util.Map;

public interface TriageAiEngine {
    TriageClassification analyzeSymptoms(TriageAiRequest request);
    Flux<Map<String, Object>> streamAnalyzeSymptoms(TriageAiRequest request);
}
