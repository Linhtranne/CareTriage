package com.caretriage.infrastructure.ai.model;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;

import java.util.ArrayList;
import java.util.List;

public class MockEmbeddingModel implements EmbeddingModel {

    private final int dimension;

    public MockEmbeddingModel() {
        this.dimension = 768;
    }

    public MockEmbeddingModel(int dimension) {
        this.dimension = dimension;
    }

    @Override
    public Response<Embedding> embed(String text) {
        return Response.from(createMockEmbedding(text));
    }

    @Override
    public Response<Embedding> embed(TextSegment textSegment) {
        return Response.from(createMockEmbedding(textSegment.text()));
    }

    @Override
    public Response<List<Embedding>> embedAll(List<TextSegment> textSegments) {
        List<Embedding> embeddings = new ArrayList<>();
        for (TextSegment ts : textSegments) {
            embeddings.add(createMockEmbedding(ts.text()));
        }
        return Response.from(embeddings);
    }

    private Embedding createMockEmbedding(String text) {
        float[] vector = new float[dimension];
        if (text != null) {
            String lower = text.toLowerCase();
            int hash;
            if (lower.contains("tai mũi họng") || lower.contains("ent") || lower.contains("họng") || lower.contains("tai")) {
                hash = 1000;
            } else if (lower.contains("tim mạch") || lower.contains("cardiology") || lower.contains("ngực")) {
                hash = 2000;
            } else if (lower.contains("thần kinh") || lower.contains("neurology") || lower.contains("đầu")) {
                hash = 3000;
            } else {
                hash = text.hashCode();
            }
            for (int i = 0; i < dimension; i++) {
                vector[i] = (float) (Math.sin(hash + i) * 0.1);
            }
        }
        return Embedding.from(vector);
    }
}
