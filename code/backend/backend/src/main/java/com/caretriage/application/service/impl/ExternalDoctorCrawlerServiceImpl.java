package com.caretriage.application.service.impl;

import org.springframework.transaction.annotation.Transactional;

import com.caretriage.application.service.ExternalDoctorCrawlerService;
import com.caretriage.application.service.crawler.DefaultCrawlerStrategy;
import com.caretriage.application.service.crawler.SourceCrawlerStrategy;
import com.caretriage.domain.entity.external.ExternalDoctor;
import com.caretriage.domain.entity.external.ExternalDoctorSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional(readOnly = true)
@Slf4j
@RequiredArgsConstructor
public class ExternalDoctorCrawlerServiceImpl implements ExternalDoctorCrawlerService {

    private final List<SourceCrawlerStrategy> strategies;
    private final DefaultCrawlerStrategy defaultStrategy;

    @Override
    public List<ExternalDoctor> crawlDoctors(ExternalDoctorSource source) {
        log.info("Resolving Crawler Strategy for source: {}", source.getAllowedDomain());

        SourceCrawlerStrategy selectedStrategy = strategies.stream()
                .filter(s -> !(s instanceof DefaultCrawlerStrategy)) // skip default in the loop
                .filter(s -> s.supports(source.getAllowedDomain()))
                .findFirst()
                .orElse(defaultStrategy);

        log.info("Using strategy: {}", selectedStrategy.getClass().getSimpleName());
        
        List<ExternalDoctor> doctors = selectedStrategy.crawl(source);
        log.info("Finished crawling. Found {} doctors via {}.", doctors.size(), selectedStrategy.getClass().getSimpleName());
        return doctors;
    }
}
