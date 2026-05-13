package com.caretriage.service;

import com.caretriage.entity.LandingContent;
import com.caretriage.repository.LandingContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LandingContentService {

    private final LandingContentRepository repository;

    public Map<String, String> getContentByLanguage(String lang) {
        List<LandingContent> contents = repository.findByLanguage(lang);
        return contents.stream().collect(Collectors.toMap(
            c -> c.getSection() + "." + c.getContentKey(),
            LandingContent::getContentValue,
            (existing, replacement) -> replacement
        ));
    }

    @Transactional
    public void updateContent(String section, String key, String value, String lang) {
        LandingContent content = repository.findBySectionAndContentKeyAndLanguage(section, key, lang)
                .orElse(LandingContent.builder()
                        .section(section)
                        .contentKey(key)
                        .language(lang)
                        .build());
        content.setContentValue(value);
        repository.save(content);
    }
}
