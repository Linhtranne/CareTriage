package com.caretriage.service;

import com.caretriage.service.impl.AiClientServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
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
    void testAnalyzeSymptoms_TimeoutFallback() {
        when(exchangeFunction.exchange(any(ClientRequest.class))).thenReturn(Mono.error(new TimeoutException("Connection timed out")));

        Map<String, Object> result = aiClientService.analyzeSymptoms("session1", "Đau đầu", new ArrayList<>());

        assertNotNull(result);
        assertEquals(false, result.get("is_complete"));
        assertEquals("Kết nối đến AI service quá hạn. Vui lòng thử lại.", result.get("reply"));
    }

    @Test
    void testAnalyzeSymptoms_5xxFallback() {
        ClientResponse clientResponse = ClientResponse.create(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Internal Server Error")
                .build();
        when(exchangeFunction.exchange(any(ClientRequest.class))).thenReturn(Mono.just(clientResponse));

        Map<String, Object> result = aiClientService.analyzeSymptoms("session1", "Đau đầu", new ArrayList<>());
        assertNotNull(result);
        assertEquals("Dịch vụ AI hiện không khả dụng. Vui lòng thử lại sau.", result.get("reply"));
    }

    @Test
    void testAnalyzeSymptoms_429Fallback() {
        ClientResponse clientResponse = ClientResponse.create(HttpStatus.TOO_MANY_REQUESTS)
                .body("Rate limit exceeded")
                .build();
        when(exchangeFunction.exchange(any(ClientRequest.class))).thenReturn(Mono.just(clientResponse));

        Map<String, Object> result = aiClientService.analyzeSymptoms("session1", "Đau đầu", new ArrayList<>());
        assertNotNull(result);
        assertEquals("Hệ thống AI đang quá tải (Quota/Rate Limit). Vui lòng thử lại sau.", result.get("reply"));
    }

    @Test
    void testAnalyzeSymptoms_InvalidSchemaFallback() {
        ClientResponse clientResponse = ClientResponse.create(HttpStatus.OK)
                .header("Content-Type", "application/json")
                .body("This is not a map")
                .build();
        when(exchangeFunction.exchange(any(ClientRequest.class))).thenReturn(Mono.just(clientResponse));

        Map<String, Object> result = aiClientService.analyzeSymptoms("session1", "Đau đầu", new ArrayList<>());

        assertNotNull(result);
        assertEquals("Hệ thống nhận được phản hồi không hợp lệ từ AI. Vui lòng thử lại.", result.get("reply"));
        assertEquals(false, result.get("is_complete"));
    }
}
