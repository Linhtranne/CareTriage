package com.caretriage.infrastructure.ai.model;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.output.Response;

import java.util.List;

public class FakeChatLanguageModel implements ChatLanguageModel {
    @Override
    public Response<AiMessage> generate(List<ChatMessage> messages) {
        String json = "{\n" +
                "  \"intakeComplete\": true,\n" +
                "  \"redFlagDetected\": false,\n" +
                "  \"missingInformation\": [],\n" +
                "  \"suggestedDepartment\": \"Tai Mũi Họng\",\n" +
                "  \"urgencyLevel\": \"MEDIUM\",\n" +
                "  \"confidenceScore\": 0.9,\n" +
                "  \"possibleConditions\": [\"Viêm họng\"],\n" +
                "  \"suggestedActions\": [\"Súc nước muối\"],\n" +
                "  \"clinicalReasoningSummary\": \"Đây là phản hồi chẩn đoán giả định từ Trợ lý AI CareTriage.\",\n" +
                "  \"summary\": \"Đây là phản hồi chẩn đoán giả định từ Trợ lý AI CareTriage.\",\n" +
                "  \"infectionControl\": false\n" +
                "}";
        return Response.from(AiMessage.from(json));
    }
}
