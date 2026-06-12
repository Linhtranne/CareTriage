package com.caretriage.application.ai.service;

import com.caretriage.application.ai.model.TriageClassificationResult;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;
import com.caretriage.infrastructure.ai.prompt.TriagePromptFactory;

public interface TriageClassifier {

    @SystemMessage(TriagePromptFactory.SYSTEM_PROMPT)
    @UserMessage(TriagePromptFactory.TRIAGE_EVALUATION_PROMPT)
    TriageClassificationResult classify(
            @V("conversationContext") String conversationContext,
            @V("context") String context
    );
}
