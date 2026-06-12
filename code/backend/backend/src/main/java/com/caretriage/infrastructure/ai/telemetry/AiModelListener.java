package com.caretriage.infrastructure.ai.telemetry;

import dev.langchain4j.model.chat.listener.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class AiModelListener implements ChatModelListener {

    @Override
    public void onRequest(ChatModelRequestContext context) {
        log.info("AI Model Request: model = {}",
            context.request().model());
    }

    @Override
    public void onResponse(ChatModelResponseContext context) {
        log.info("AI Model Response: tokenUsage = {}",
            context.response().tokenUsage());
    }

    @Override
    public void onError(ChatModelErrorContext context) {
        log.error("AI model request failed: errorType={}",
            context.error().getClass().getSimpleName());
    }
}
