package com.caretriage.service;

import com.caretriage.service.impl.AiClientServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Map;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AiClientServiceTest {

    private ExchangeFunction exchangeFunction;
    private AiClientServiceImpl aiClientService;

    @BeforeEach
    void setUp() {
        exchangeFunction = mock(ExchangeFunction.class);
        WebClient webClient = WebClient.builder()
                .exchangeFunction(exchangeFunction)
                .build();
        aiClientService = new AiClientServiceImpl(webClient);
        
        // Inject retry configuration using ReflectionTestUtils with micro-second delays for fast execution
        ReflectionTestUtils.setField(aiClientService, "maxAttempts", 2);
        ReflectionTestUtils.setField(aiClientService, "initialBackoffMs", 5L);
        ReflectionTestUtils.setField(aiClientService, "maxBackoffMs", 15L);
    }

    @Test
    void testAnalyzeSymptoms_Success() {
        ClientResponse clientResponse = ClientResponse.create(HttpStatus.OK)
                .header("Content-Type", "application/json")
                .body("{\"reply\": \"Bạn có triệu chứng gì?\", \"is_complete\": false}")
                .build();
        when(exchangeFunction.exchange(any(ClientRequest.class))).thenReturn(Mono.just(clientResponse));

        Map<String, Object> result = aiClientService.analyzeSymptoms("session1", "Đau đầu", new ArrayList<>());

        assertNotNull(result);
        assertEquals("Bạn có triệu chứng gì?", result.get("reply"));
        assertEquals(false, result.get("is_complete"));
    }

    @Test
    void testAnalyzeSymptoms_RetryAndRecover() {
        // Mock first call failing with 429 and second call succeeding
        ClientResponse rateLimitResponse = ClientResponse.create(HttpStatus.TOO_MANY_REQUESTS)
                .body("Rate limit exceeded")
                .build();
        ClientResponse successResponse = ClientResponse.create(HttpStatus.OK)
                .header("Content-Type", "application/json")
                .body("{\"reply\": \"Cảm ơn bạn, tôi đã nhận thông tin.\", \"is_complete\": false}")
                .build();

        when(exchangeFunction.exchange(any(ClientRequest.class)))
                .thenReturn(Mono.just(rateLimitResponse))
                .thenReturn(Mono.just(successResponse));

        Map<String, Object> result = aiClientService.analyzeSymptoms("session1", "Đau ngực", new ArrayList<>());

        assertNotNull(result);
        assertEquals("Cảm ơn bạn, tôi đã nhận thông tin.", result.get("reply"));
        assertEquals(false, result.get("is_complete"));
    }

    @Test
    void testAnalyzeSymptoms_ExhaustedFallback() {
        // Mock all calls failing with 503 Service Unavailable
        ClientResponse serviceUnavailableResponse = ClientResponse.create(HttpStatus.SERVICE_UNAVAILABLE)
                .body("Service Unavailable")
                .build();

        when(exchangeFunction.exchange(any(ClientRequest.class)))
                .thenReturn(Mono.just(serviceUnavailableResponse));

        Map<String, Object> result = aiClientService.analyzeSymptoms("session1", "Đau ngực", new ArrayList<>());

        assertNotNull(result);
        assertTrue(result.get("reply").toString().contains("Hệ thống AI hiện tại đang tạm thời không khả dụng"));
        assertEquals(false, result.get("is_complete"));
        
        // Assert deep structural fallback fields
        Map<?, ?> triageResult = (Map<?, ?>) result.get("triage_result");
        assertNotNull(triageResult);
        assertEquals("GENERAL_INTERNAL_MEDICINE", triageResult.get("suggested_department_code"));
        assertEquals("Nội tổng quát", triageResult.get("suggested_department_name"));
        assertEquals("MEDIUM", triageResult.get("urgency_level"));
        assertEquals(true, triageResult.get("fallback"));
        assertEquals("AI_SERVICE_UNAVAILABLE", triageResult.get("fallback_reason"));
    }

    @Test
    void testAnalyzeSymptoms_NonTransientNoRetry() {
        // Mock bad request 400 (non-transient), which should skip retry and go straight to fallback
        ClientResponse badRequestResponse = ClientResponse.create(HttpStatus.BAD_REQUEST)
                .body("Bad Request Parameter")
                .build();

        when(exchangeFunction.exchange(any(ClientRequest.class))).thenReturn(Mono.just(badRequestResponse));

        Map<String, Object> result = aiClientService.analyzeSymptoms("session1", "Triệu chứng", new ArrayList<>());

        assertNotNull(result);
        assertTrue(result.get("reply").toString().contains("Hệ thống AI hiện tại đang tạm thời không khả dụng"));
        
        // Confirm only 1 interaction occurred (retries were skipped)
        verify(exchangeFunction, times(1)).exchange(any(ClientRequest.class));
    }

    @Test
    void testAnalyzeSymptoms_TimeoutFallback() {
        // Mock a read timeout exception
        when(exchangeFunction.exchange(any(ClientRequest.class))).thenReturn(Mono.error(new TimeoutException("Read timeout")));

        Map<String, Object> result = aiClientService.analyzeSymptoms("session1", "Đau đầu", new ArrayList<>());

        assertNotNull(result);
        assertEquals(false, result.get("is_complete"));
        assertTrue(result.get("reply").toString().contains("Hệ thống AI hiện tại đang tạm thời không khả dụng"));
    }
}
