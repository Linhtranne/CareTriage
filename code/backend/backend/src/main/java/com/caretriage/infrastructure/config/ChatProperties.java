package com.caretriage.infrastructure.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@ConfigurationProperties(prefix = "app.chat")
@Data
public class ChatProperties {
    private Duration inactivityTimeout = Duration.ofSeconds(45);
    private Duration wholeTurnTimeout = Duration.ofSeconds(120);
    private Duration activeTurnStaleTimeout = Duration.ofSeconds(150);
}
