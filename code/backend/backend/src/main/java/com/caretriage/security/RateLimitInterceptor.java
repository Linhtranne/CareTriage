package com.caretriage.security;

import com.caretriage.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final Map<String, RequestCounter> limiters = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS = 50;
    private static final long TIME_WINDOW_MS = TimeUnit.MINUTES.toMillis(1);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String ip = request.getRemoteAddr();
        String path = request.getRequestURI();
        
        // Only rate limit public schedule/slot APIs
        if (!path.contains("/slots") && !path.contains("/schedules")) {
            return true;
        }

        String key = ip + ":" + path;
        RequestCounter counter = limiters.computeIfAbsent(key, k -> new RequestCounter());

        if (counter.isExpired()) {
            counter.reset();
        }

        if (counter.incrementAndGet() > MAX_REQUESTS) {
            throw new BusinessException("Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.");
        }

        return true;
    }

    private static class RequestCounter {
        private final AtomicInteger count = new AtomicInteger(0);
        private long startTime = System.currentTimeMillis();

        public boolean isExpired() {
            return System.currentTimeMillis() - startTime > TIME_WINDOW_MS;
        }

        public void reset() {
            count.set(0);
            startTime = System.currentTimeMillis();
        }

        public int incrementAndGet() {
            return count.incrementAndGet();
        }
    }
}
