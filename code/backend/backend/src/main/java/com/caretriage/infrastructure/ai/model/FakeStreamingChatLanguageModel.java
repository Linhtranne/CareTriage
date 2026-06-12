package com.caretriage.infrastructure.ai.model;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.output.Response;

import java.util.List;

public class FakeStreamingChatLanguageModel implements StreamingChatLanguageModel {
    @Override
    public void generate(List<ChatMessage> messages, StreamingResponseHandler<AiMessage> handler) {
        handler.onNext("Đây ");
        handler.onNext("là ");
        handler.onNext("phản ");
        handler.onNext("hồi ");
        handler.onNext("chẩn ");
        handler.onNext("đoán ");
        handler.onNext("giả ");
        handler.onNext("định ");
        handler.onNext("từ ");
        handler.onNext("Trợ ");
        handler.onNext("lý ");
        handler.onNext("AI ");
        handler.onNext("CareTriage.");
        handler.onComplete(Response.from(AiMessage.from("Đây là phản hồi chẩn đoán giả định từ Trợ lý AI CareTriage.")));
    }
}
