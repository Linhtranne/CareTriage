package com.caretriage.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Slf4j
@Component
public class WebSocketRateLimiter {

    @Value("${app.chat.rate-limit-enabled:true}")
    private boolean enabled;

    @Value("${app.chat.rate-limit-messages-per-minute:20}")
    private int maxMessagesPerMinute;

    private final ConcurrentHashMap<Long, Queue<Long>> sessionRequestTimestamps = new ConcurrentHashMap<>();

    /**
     * Determines whether a message is allowed to be sent for a session.
     * Implements a sliding window of 1 minute.
     */
    public boolean isAllowed(Long sessionId) {
        if (!enabled || sessionId == null) {
            return true;
        }

        long now = System.currentTimeMillis();
        long oneMinuteAgo = now - 60000;

        Queue<Long> timestamps = sessionRequestTimestamps.computeIfAbsent(sessionId, k -> new ConcurrentLinkedQueue<>());

        synchronized (timestamps) {
            // Remove timestamps older than 1 minute
            while (!timestamps.isEmpty() && timestamps.peek() < oneMinuteAgo) {
                timestamps.poll();
            }

            // Check if the limit is exceeded
            if (timestamps.size() < maxMessagesPerMinute) {
                timestamps.add(now);
                return true;
            }

            log.warn("Rate limit exceeded for chat session {}: {} messages in the last minute (Max: {})", 
                    sessionId, timestamps.size(), maxMessagesPerMinute);
            return false;
        }
    }

    /**
     * Scheduled cleanup running every 5 minutes to evict inactive sessions and prevent memory leaks.
     */
    @Scheduled(fixedRate = 300000)
    public void cleanupObsoleteSessions() {
        long oneMinuteAgo = System.currentTimeMillis() - 60000;
        int initialSize = sessionRequestTimestamps.size();
        
        sessionRequestTimestamps.entrySet().removeIf(entry -> {
            Queue<Long> timestamps = entry.getValue();
            synchronized (timestamps) {
                while (!timestamps.isEmpty() && timestamps.peek() < oneMinuteAgo) {
                    timestamps.poll();
                }
                return timestamps.isEmpty();
            }
        });

        int finalSize = sessionRequestTimestamps.size();
        if (initialSize != finalSize) {
            log.info("Cleaned up WebSocketRateLimiter in-memory states. Expired session records evicted: {}", 
                    (initialSize - finalSize));
        }
    }
}
