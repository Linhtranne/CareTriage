package com.caretriage.infrastructure.ai.config;

import com.caretriage.infrastructure.ai.model.ModelProviderFactory;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.chat.listener.ChatModelListener;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

@Configuration
@ConfigurationProperties(prefix = "app.ai")
@Data
@Slf4j
public class LangChain4jConfig {

    private String runtime = "java";
    private GeminiProperties gemini = new GeminiProperties();
    private RagProperties rag = new RagProperties();

    @Data
    public static class GeminiProperties {
        private String apiKey;
        private String modelName = "gemini-2.5-flash";
        private String embeddingModelName = "text-embedding-004";
        private Double temperature = 0.1;
        private Integer timeoutSeconds = 60;
        private Integer connectTimeoutMs = 10000;
        private Integer readTimeoutMs = 30000;
    }

    @Data
    public static class RagProperties {
        private boolean enabled = true;
        private String indexPath = "medical_rag_index.json";
        private String corpusPath = "corpus";
        private int maxResults = 5;
        private double minRelevanceScore = 0.3;
        private int maxContextCharacters = 6000;
        private java.util.List<String> allowedSourceTypes = java.util.List.of("guideline", "internal_reviewed");
        private boolean requirePhiSafe = true;
        private boolean requireIntegrityHash = true;
        private int maxEvidenceAgeDays = 730;
    }

    @Bean
    public ChatLanguageModel chatLanguageModel(ChatModelListener modelListener) {
        return ModelProviderFactory.getChatModel(
            gemini.getApiKey(),
            gemini.getModelName(),
            gemini.getTemperature(),
            gemini.getTimeoutSeconds(),
            gemini.getConnectTimeoutMs(),
            gemini.getReadTimeoutMs(),
            modelListener
        );
    }

    @Bean
    public StreamingChatLanguageModel streamingChatLanguageModel(ChatModelListener modelListener) {
        return ModelProviderFactory.getStreamingChatModel(
            gemini.getApiKey(),
            gemini.getModelName(),
            gemini.getTemperature(),
            gemini.getTimeoutSeconds(),
            gemini.getConnectTimeoutMs(),
            gemini.getReadTimeoutMs(),
            modelListener
        );
    }

    @Bean
    public EmbeddingModel embeddingModel() {
        if (gemini.getApiKey() == null || gemini.getApiKey().trim().isEmpty() || "demo".equalsIgnoreCase(gemini.getApiKey())) {
            log.info("Initializing MockEmbeddingModel for offline/test environments.");
            return new com.caretriage.infrastructure.ai.model.MockEmbeddingModel();
        }
        log.info("Initializing Google AI embedding model.");
        return GoogleAiEmbeddingModel.builder()
                .apiKey(gemini.getApiKey())
                .modelName(gemini.getEmbeddingModelName())
                .build();
    }

    @Bean
    public EmbeddingStore<TextSegment> embeddingStore() {
        dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore<TextSegment> store;
        String path = rag.getIndexPath();
        File file = new File(path);
        if (file.exists()) {
            try {
                log.info("Loading existing RAG vector store index from: {}", file.getAbsolutePath());
                String json = new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8);
                store = dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore.fromJson(json);
            } catch (Exception e) {
                log.error("Failed to load vector store from file {}: {}", path, e.getClass().getSimpleName(), e);
                store = new dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore<>();
            }
        } else {
            log.info("No existing RAG index found at {}. Starting with empty vector store.", file.getAbsolutePath());
            store = new dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore<>();
        }
        return store;
    }

    @Bean
    public com.caretriage.application.ai.service.TriageClassifier triageClassifier(ChatLanguageModel chatLanguageModel) {
        return dev.langchain4j.service.AiServices.builder(com.caretriage.application.ai.service.TriageClassifier.class)
                .chatLanguageModel(chatLanguageModel)
                .build();
    }

    @Bean
    public com.caretriage.application.ai.port.StructuredMedicalEntityExtractor structuredMedicalEntityExtractor(ChatLanguageModel chatLanguageModel) {
        return dev.langchain4j.service.AiServices.builder(com.caretriage.application.ai.port.StructuredMedicalEntityExtractor.class)
                .chatLanguageModel(chatLanguageModel)
                .build();
    }

    @Bean
    public com.caretriage.application.ai.service.DoctorRecommendationAi doctorRecommendationAi(ChatLanguageModel chatLanguageModel) {
        return dev.langchain4j.service.AiServices.builder(com.caretriage.application.ai.service.DoctorRecommendationAi.class)
                .chatLanguageModel(chatLanguageModel)
                .build();
    }
}
