package com.caretriage.application.dto;

import com.caretriage.shared.exception.ContractViolationException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AiSseFinalPayloadContractTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void sharedFixtureMatchesJavaContract() throws Exception {
        Path fixture = Path.of("..", "..", "..", "contracts", "ai-sse-final-v1.json")
                .normalize();
        AiSseFinalPayload payload = objectMapper.readValue(
                Files.readString(fixture),
                AiSseFinalPayload.class);

        payload.validateForTurn("550e8400-e29b-41d4-a716-446655440000");

        assertEquals("1", payload.contractVersion());
        assertEquals("CARDIOLOGY", payload.triageResult().suggestedDepartmentCode());
        assertEquals(
                "Chest pain warrants cardiac assessment.",
                payload.triageResult().clinicalReasoningSummary());
    }

    @Test
    void rejectsTurnMismatch() throws Exception {
        Path fixture = Path.of("..", "..", "..", "contracts", "ai-sse-final-v1.json")
                .normalize();
        AiSseFinalPayload payload = objectMapper.readValue(
                Files.readString(fixture),
                AiSseFinalPayload.class);

        assertThrows(
                ContractViolationException.class,
                () -> payload.validateForTurn("different-turn"));
    }

    @Test
    void allSharedFixturesMatchJavaContract() throws Exception {
        Path contractDir = Path.of("..", "..", "..", "contracts").normalize();
        String turnId = "550e8400-e29b-41d4-a716-446655440000";

        AiSseTokenPayload token = objectMapper.readValue(
                Files.readString(contractDir.resolve("ai-sse-token-v1.json")),
                AiSseTokenPayload.class);
        assertEquals(turnId, token.turnId());
        assertEquals(1, token.sequence());

        AiSseErrorPayload error = objectMapper.readValue(
                Files.readString(contractDir.resolve("ai-sse-error-v1.json")),
                AiSseErrorPayload.class);
        error.validateForTurn(turnId);

        Map<?, ?> heartbeat = objectMapper.readValue(
                Files.readString(contractDir.resolve("ai-sse-heartbeat-v1.json")),
                Map.class);
        assertEquals(turnId, heartbeat.get("turn_id"));

        AiSseFinalPayload degraded = objectMapper.readValue(
                Files.readString(contractDir.resolve("ai-sse-final-degraded-v1.json")),
                AiSseFinalPayload.class);
        degraded.validateForTurn(turnId);
        assertEquals("DEGRADED", degraded.classificationStatus());
    }
}
