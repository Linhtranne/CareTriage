package com.caretriage.repository;

import com.caretriage.entity.ExtractedEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExtractedEntityRepository extends JpaRepository<ExtractedEntity, Long> {

    List<ExtractedEntity> findByClinicalNoteId(Long clinicalNoteId);

    List<ExtractedEntity> findByClinicalNoteIdAndEntityType(Long clinicalNoteId, ExtractedEntity.EntityType entityType);

    @Query("SELECT DISTINCT ee.clinicalNote.patient.id FROM ExtractedEntity ee " +
           "WHERE ee.entityType = :entityType AND LOWER(ee.entityValue) LIKE LOWER(CONCAT('%', :value, '%'))")
    List<Long> findPatientIdsByEntityTypeAndValue(@Param("entityType") ExtractedEntity.EntityType entityType, @Param("value") String value);
}
