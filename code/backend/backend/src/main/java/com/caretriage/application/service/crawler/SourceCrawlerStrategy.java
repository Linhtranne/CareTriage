package com.caretriage.application.service.crawler;

import com.caretriage.domain.entity.external.ExternalDoctor;
import com.caretriage.domain.entity.external.ExternalDoctorSource;

import java.util.List;

public interface SourceCrawlerStrategy {
    
    /**
     * Define which domain this strategy handles (e.g., "bookingcare.vn")
     */
    boolean supports(String domain);

    /**
     * Core logic to crawl doctors from the provided source
     */
    List<ExternalDoctor> crawl(ExternalDoctorSource source);
}
