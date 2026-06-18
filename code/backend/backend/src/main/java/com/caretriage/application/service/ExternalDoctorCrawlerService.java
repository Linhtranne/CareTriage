package com.caretriage.application.service;

import com.caretriage.domain.entity.external.ExternalDoctor;
import com.caretriage.domain.entity.external.ExternalDoctorSource;

import java.util.List;

public interface ExternalDoctorCrawlerService {
    
    /**
     * Crawls an external doctor source to find doctors and return a list of parsed ExternalDoctors.
     * The doctors are not saved to the database by this service, they are returned for processing.
     *
     * @param source The source to crawl
     * @return List of parsed ExternalDoctor entities (unsaved)
     */
    List<ExternalDoctor> crawlDoctors(ExternalDoctorSource source);
}
