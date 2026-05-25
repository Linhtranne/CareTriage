package com.caretriage.repository;

import com.caretriage.entity.LandingContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LandingContentRepository extends JpaRepository<LandingContent, Long> {
    List<LandingContent> findByLanguage(String language);
    List<LandingContent> findBySectionAndLanguage(String section, String language);
    Optional<LandingContent> findBySectionAndContentKeyAndLanguage(String section, String contentKey, String language);
    boolean existsBySectionAndContentKeyAndLanguage(String section, String contentKey, String language);
}
