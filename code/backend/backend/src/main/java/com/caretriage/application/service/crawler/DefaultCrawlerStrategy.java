package com.caretriage.application.service.crawler;

import com.caretriage.domain.entity.external.ExternalDoctor;
import com.caretriage.domain.entity.external.ExternalDoctorSource;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
public class DefaultCrawlerStrategy implements SourceCrawlerStrategy {

    @Override
    public boolean supports(String domain) {
        // Fallback strategy for all other domains
        return true;
    }

    @Override
    public List<ExternalDoctor> crawl(ExternalDoctorSource source) {
        log.info("Executing Default Fallback Crawler for source: {}", source.getSourceName());
        List<ExternalDoctor> doctors = new ArrayList<>();

        try {
            Document doc = Jsoup.connect(source.getBaseUrl())
                    .userAgent("Mozilla/5.0")
                    .timeout(10000)
                    .ignoreHttpErrors(true)
                    .sslSocketFactory(SslUtils.socketFactory())
                    .get();

            Elements doctorCards = doc.select(".doctor-card, .doctor-profile, .provider-card, .bac-si-card, .thong-tin-bac-si");
            
            if (doctorCards.isEmpty()) {
                log.warn("No default doctor cards found at {}. Using mock data.", source.getBaseUrl());
                ExternalDoctor mockDoctor = ExternalDoctor.builder()
                        .source(source)
                        .externalId("VN-EXT-" + UUID.randomUUID().toString().substring(0, 8))
                        .fullName("BS. Nguyễn Văn Khách (" + source.getSourceName() + ")")
                        .specialization("Đa khoa")
                        .hospitalName(source.getSourceName())
                        .email("lienhe@" + source.getAllowedDomain())
                        .verificationStatus(ExternalDoctor.VerificationStatus.UNVERIFIED)
                        .active(false)
                        .build();
                doctors.add(mockDoctor);
            } else {
                for (Element card : doctorCards) {
                    try {
                        String name = card.select(".doctor-name, .ten-bac-si, h3, h4").first() != null ? 
                                card.select(".doctor-name, .ten-bac-si, h3, h4").first().text() : "Bác sĩ chưa rõ tên";
                        
                        String specialty = card.select(".specialty, .department, .chuyen-khoa, .khoa").first() != null ? 
                                card.select(".specialty, .department, .chuyen-khoa, .khoa").first().text() : "Đa khoa";

                        String docId = card.attr("data-doctor-id");
                        if (docId == null || docId.isEmpty()) {
                            docId = "VN-EXT-" + UUID.randomUUID().toString().substring(0, 8);
                        }

                        ExternalDoctor parsedDoc = ExternalDoctor.builder()
                                .source(source)
                                .externalId(docId)
                                .fullName(name)
                                .specialization(specialty)
                                .hospitalName(source.getSourceName())
                                .verificationStatus(ExternalDoctor.VerificationStatus.UNVERIFIED)
                                .active(false)
                                .build();
                        
                        doctors.add(parsedDoc);
                    } catch (Exception e) {
                        log.warn("Failed to parse a doctor card: {}", e.getClass().getSimpleName());
                    }
                }
            }

        } catch (Exception e) {
            log.error("Failed to crawl doctors from source: {}", source.getSourceName(), e);
            throw new RuntimeException("Crawler failed for " + source.getSourceName(), e);
        }

        return doctors;
    }
}
