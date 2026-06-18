package com.caretriage.application.service.crawler;

import com.caretriage.domain.entity.external.ExternalDoctor;
import com.caretriage.domain.entity.external.ExternalDoctorSource;
import dev.langchain4j.model.chat.ChatLanguageModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiCrawlerStrategy implements SourceCrawlerStrategy {

    // Inject the ChatLanguageModel configured in LangChain4jConfig
    private final ChatLanguageModel chatLanguageModel;

    @Override
    public boolean supports(String domain) {
        // We activate the AI Crawler for 'youmed.vn' as a demo
        return domain != null && domain.contains("youmed.vn");
    }

    @Override
    public List<ExternalDoctor> crawl(ExternalDoctorSource source) {
        log.info("Executing AI-Assisted Crawler Strategy for source: {}", source.getAllowedDomain());
        List<ExternalDoctor> doctors = new ArrayList<>();

        try {
            // 1. Fetch raw HTML, bypassing SSL
            Document doc = Jsoup.connect("https://youmed.vn/bac-si")
                    .userAgent("Mozilla/5.0")
                    .timeout(15000)
                    .ignoreHttpErrors(true)
                    .sslSocketFactory(SslUtils.socketFactory())
                    .get();

            // 2. We extract just the text body to save tokens, avoiding massive HTML tags
            String rawText = doc.body().text();
            
            // Limit text size to prevent exceeding token limits if it's too huge
            if (rawText.length() > 20000) {
                rawText = rawText.substring(0, 20000);
            }

            log.info("Successfully fetched text from YouMed (Length: {}). Sending to Gemini AI...", rawText.length());

            // 3. Ask Gemini to extract data
            String prompt = "You are a data extraction AI. Extract a list of doctors from the following text.\n" +
                            "Respond ONLY in this exact JSON format (no markdown tags, no extra words):\n" +
                            "[{\"name\": \"Doctor Name\", \"specialty\": \"Doctor Specialty\"}]\n\n" +
                            "Text to extract from:\n" + rawText;

            String response = chatLanguageModel.generate(prompt);
            
            log.info("Gemini AI Response: {}", response);

            // Clean up the JSON response in case Gemini added markdown like ```json ... ```
            String cleanJson = response.replaceAll("```json", "").replaceAll("```", "").trim();

            // 4. Parse the JSON manually
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode rootNode = mapper.readTree(cleanJson);

            if (rootNode.isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode node : rootNode) {
                    String name = node.has("name") ? node.get("name").asText() : "Unknown";
                    String specialty = node.has("specialty") ? node.get("specialty").asText() : "Đa khoa";

                    doctors.add(ExternalDoctor.builder()
                            .source(source)
                            .externalId("AI-" + UUID.randomUUID().toString().substring(0, 8))
                            .fullName(name)
                            .specialization(specialty)
                            .hospitalName(source.getSourceName())
                            .verificationStatus(ExternalDoctor.VerificationStatus.UNVERIFIED)
                            .active(false)
                            .build());
                }
            }
            
        } catch (Exception e) {
            log.error("AI-Assisted Crawler failed for {}", source.getSourceName(), e);
        }

        if (doctors.isEmpty()) {
            log.warn("AI could not extract any doctors. Using fallback mock.");
            doctors.add(ExternalDoctor.builder()
                    .source(source)
                    .externalId("AI-MOCK-" + UUID.randomUUID().toString().substring(0, 8))
                    .fullName("BS. Mẫu (Do AI lỗi)")
                    .specialization("Nội khoa")
                    .hospitalName(source.getSourceName())
                    .verificationStatus(ExternalDoctor.VerificationStatus.UNVERIFIED)
                    .active(false)
                    .build());
        }

        return doctors;
    }
}
