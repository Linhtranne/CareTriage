package com.caretriage.infrastructure.ai.model;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.chat.listener.ChatModelListener;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiStreamingChatModel;

import java.util.Collections;

public class ModelProviderFactory {

    public static ChatLanguageModel getChatModel(
            String apiKey,
            String modelName,
            Double temperature,
            Integer timeoutSeconds,
            Integer connectTimeoutMs,
            Integer readTimeoutMs,
            ChatModelListener listener) {
        if (apiKey == null || apiKey.trim().isEmpty() || "demo".equalsIgnoreCase(apiKey)) {
            return new FakeChatLanguageModel();
        }
        return GoogleAiGeminiChatModel.builder()
                .apiKey(apiKey)
                .modelName(modelName)
                .temperature(temperature)
                .timeout(java.time.Duration.ofSeconds(timeoutSeconds))
                .listeners(Collections.singletonList(listener))
                .logRequestsAndResponses(false)
                .build();
    }

    public static StreamingChatLanguageModel getStreamingChatModel(
            String apiKey,
            String modelName,
            Double temperature,
            Integer timeoutSeconds,
            Integer connectTimeoutMs,
            Integer readTimeoutMs,
            ChatModelListener listener) {
        if (apiKey == null || apiKey.trim().isEmpty() || "demo".equalsIgnoreCase(apiKey)) {
            return new FakeStreamingChatLanguageModel();
        }
        return GoogleAiGeminiStreamingChatModel.builder()
                .apiKey(apiKey)
                .modelName(modelName)
                .temperature(temperature)
                .timeout(java.time.Duration.ofSeconds(timeoutSeconds))
                .listeners(Collections.singletonList(listener))
                .logRequestsAndResponses(false)
                .build();
    }
}
