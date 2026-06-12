package com.caretriage.application.ai.service;

import com.caretriage.infrastructure.ai.config.LangChain4jConfig;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class MedicalCorpusIngestionService {

    private final LangChain4jConfig langChain4jConfig;
    private final EmbeddingModel embeddingModel;
    private final EmbeddingStore<TextSegment> embeddingStore;
    private final MedicalDocumentChunker chunker;

    private static final String DEFAULT_CORPUS_VERSION = "1.0";

    public synchronized void ingestCorpus() {
        if (!langChain4jConfig.getRag().isEnabled()) {
            log.warn("RAG is disabled. Ingestion skipped.");
            return;
        }

        log.info("Starting clinical RAG corpus ingestion...");

        try {
            List<Resource> resources = scanCorpusFiles();
            if (resources.isEmpty()) {
                log.warn("No corpus files found to ingest.");
                return;
            }

            Map<String, String> ingestionManifest = loadIngestionManifest();
            boolean indexUpdated = false;

            for (Resource resource : resources) {
                String filename = resource.getFilename();
                if (filename == null) continue;

                String content = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                String contentHash = calculateSHA256(content);
                String sourceId = filename;
                String corpusVersion = DEFAULT_CORPUS_VERSION;

                // Idempotency check key
                String idempotencyKey = sourceId + ":" + corpusVersion;

                if (contentHash.equals(ingestionManifest.get(idempotencyKey))) {
                    log.info("Document '{}' with version '{}' already ingested. Skipping (Idempotency).", sourceId, corpusVersion);
                    continue;
                }
                if (ingestionManifest.containsKey(idempotencyKey)) {
                    throw new IllegalStateException(
                            "Corpus content changed without a version bump for source " + sourceId);
                }

                log.info("Ingesting document '{}' with corpus version '{}'.", sourceId, corpusVersion);
                ingestDocument(sourceId, content, corpusVersion);
                ingestionManifest.put(idempotencyKey, contentHash);
                indexUpdated = true;
            }

            if (indexUpdated) {
                persistIndex();
                persistIngestionManifest(ingestionManifest);
            } else {
                log.info("No new clinical guidelines to ingest.");
            }

        } catch (IOException e) {
            throw new IllegalStateException("Failed to read or persist the RAG corpus", e);
        }
    }

    private List<Resource> scanCorpusFiles() throws IOException {
        List<Resource> files = new ArrayList<>();
        ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

        // 1. Scan from local workspace src/main/resources/corpus if available
        String localPath = "src/main/resources/" + langChain4jConfig.getRag().getCorpusPath();
        File localDir = new File(localPath);
        if (localDir.exists() && localDir.isDirectory()) {
            File[] fileList = localDir.listFiles();
            if (fileList != null) {
                for (File f : fileList) {
                    if (f.isFile() && (f.getName().endsWith(".md") || f.getName().endsWith(".txt"))) {
                        files.add(new org.springframework.core.io.FileSystemResource(f));
                    }
                }
            }
        }

        // 2. Scan classpath:corpus if workspace local files are empty
        if (files.isEmpty()) {
            try {
                Resource[] classpathResources = resolver.getResources("classpath*:" + langChain4jConfig.getRag().getCorpusPath() + "/*.*");
                for (Resource r : classpathResources) {
                    String filename = r.getFilename();
                    if (filename != null && (filename.endsWith(".md") || filename.endsWith(".txt"))) {
                        files.add(r);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to scan classpath corpus resources: {}", e.getMessage());
            }
        }

        return files;
    }

    private void ingestDocument(String sourceId, String content, String corpusVersion) {
        List<MedicalDocumentChunker.Chunk> chunks = chunker.chunkDocument(content);
        String title = parseDocumentTitle(content, sourceId);
        String specialty = parseDocumentSpecialty(sourceId);

        List<TextSegment> segments = new ArrayList<>();
        List<Embedding> embeddings = new ArrayList<>();

        for (int i = 0; i < chunks.size(); i++) {
            MedicalDocumentChunker.Chunk chunk = chunks.get(i);
            
            Metadata metadata = new Metadata();
            metadata.put("source_id", sourceId);
            metadata.put("source_title", title);
            metadata.put("source_url", "https://caretriage.com/guidelines/" + sourceId.replace(".md", "").toLowerCase());
            metadata.put("corpus_version", corpusVersion);
            metadata.put("chunk_id", sourceId + "_chunk_" + i);
            metadata.put("section", chunk.section());
            metadata.put("published_at", "2026-06-11");
            metadata.put("reviewed_at", "2026-06-11");
            metadata.put("expires_at", "2028-06-10");
            metadata.put("source_type", "guideline");
            metadata.put("publisher", "CareTriage Clinical Corpus");
            metadata.put("integrity_hash", calculateSHA256(chunk.content()));
            metadata.put("phi_safe", String.valueOf(!containsPhiLikeContent(chunk.content())));
            metadata.put("medical_specialty", specialty);
            metadata.put("language", "vi");

            TextSegment segment = TextSegment.from(chunk.content(), metadata);
            segments.add(segment);
            
            Embedding embedding = embeddingModel.embed(segment).content();
            embeddings.add(embedding);
        }

        if (!segments.isEmpty()) {
            embeddingStore.addAll(embeddings, segments);
            log.info("Successfully ingested {} chunks for guideline: {}", segments.size(), sourceId);
        }
    }

    private boolean containsPhiLikeContent(String content) {
        if (content == null || content.isBlank()) {
            return false;
        }
        String normalized = content.toLowerCase();
        return normalized.matches("(?s).*\\b\\d{9,12}\\b.*")
                || normalized.matches("(?s).*\\b[\\w.%+-]+@[\\w.-]+\\.[a-z]{2,}\\b.*")
                || normalized.matches("(?s).*\\b(?:0|\\+84)\\d{8,10}\\b.*");
    }

    private String parseDocumentTitle(String content, String fallback) {
        Pattern titlePattern = Pattern.compile("^#\\s+(.+)$", Pattern.MULTILINE);
        Matcher matcher = titlePattern.matcher(content);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return fallback.replace(".md", "").replace("_", " ");
    }

    private String parseDocumentSpecialty(String filename) {
        String name = filename.toLowerCase();
        if (name.contains("ent") || name.contains("tai_mui_hong") || name.contains("tai") || name.contains("hong")) {
            return "ENT";
        } else if (name.contains("cardio") || name.contains("tim_mach") || name.contains("tim")) {
            return "CARDIOLOGY";
        } else if (name.contains("neuro") || name.contains("than_kinh")) {
            return "NEUROLOGY";
        } else if (name.contains("pediatric") || name.contains("nhi_khoa") || name.contains("nhi")) {
            return "PEDIATRICS";
        } else if (name.contains("emergency") || name.contains("cap_cuu")) {
            return "EMERGENCY";
        }
        return "GENERAL_INTERNAL_MEDICINE";
    }

    private String calculateSHA256(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 calculation failed", e);
        }
    }

    private Map<String, String> loadIngestionManifest() throws IOException {
        Path manifestPath = getManifestPath();
        if (!Files.exists(manifestPath)) {
            return new HashMap<>();
        }

        Map<String, String> manifest = new HashMap<>();
        for (String line : Files.readAllLines(manifestPath, StandardCharsets.UTF_8)) {
            int separator = line.indexOf('=');
            if (separator > 0) {
                manifest.put(line.substring(0, separator), line.substring(separator + 1));
            }
        }
        return manifest;
    }

    private void persistIngestionManifest(Map<String, String> manifest) throws IOException {
        List<String> lines = manifest.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .toList();
        writeAtomically(getManifestPath(), String.join(System.lineSeparator(), lines));
    }

    private Path getManifestPath() {
        return Paths.get(langChain4jConfig.getRag().getIndexPath() + ".manifest");
    }

    private void persistIndex() throws IOException {
        if (!(embeddingStore instanceof InMemoryEmbeddingStore)) {
            return;
        }

        Path path = Paths.get(langChain4jConfig.getRag().getIndexPath());
        log.info("Persisting RAG vector store index to: {}", path.toAbsolutePath());
        String json = ((InMemoryEmbeddingStore<TextSegment>) embeddingStore).serializeToJson();
        writeAtomically(path, json);
        log.info("RAG index persisted successfully.");
    }

    private void writeAtomically(Path target, String content) throws IOException {
        Path absoluteTarget = target.toAbsolutePath();
        Path parent = absoluteTarget.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }
        Path temporaryFile = Files.createTempFile(parent, absoluteTarget.getFileName().toString(), ".tmp");
        try {
            Files.writeString(temporaryFile, content, StandardCharsets.UTF_8);
            try {
                Files.move(
                        temporaryFile,
                        absoluteTarget,
                        StandardCopyOption.REPLACE_EXISTING,
                        StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException ignored) {
                Files.move(temporaryFile, absoluteTarget, StandardCopyOption.REPLACE_EXISTING);
            }
        } finally {
            try {
                Files.deleteIfExists(temporaryFile);
            } catch (IOException cleanupError) {
                log.debug("Temporary RAG file cleanup deferred: {}", temporaryFile);
            }
        }
    }
}
