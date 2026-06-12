package com.caretriage.infrastructure.ai.config;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
public class LangChain4jConfigTest {

    @Autowired(required = false)
    private ChatLanguageModel chatLanguageModel;

    @Autowired(required = false)
    private StreamingChatLanguageModel streamingChatLanguageModel;

    @Autowired
    private LangChain4jConfig langChain4jConfig;

    @Test
    void configLoadsAndBeansRegistered() {
        assertThat(langChain4jConfig).isNotNull();
        assertThat(langChain4jConfig.getRuntime()).isEqualTo("python");
        assertThat(langChain4jConfig.getGemini().getConnectTimeoutMs()).isEqualTo(10000);
        assertThat(langChain4jConfig.getGemini().getReadTimeoutMs()).isEqualTo(30000);
        assertThat(chatLanguageModel).isNotNull();
        assertThat(streamingChatLanguageModel).isNotNull();
    }
}
