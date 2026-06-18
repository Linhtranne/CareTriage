package com.caretriage.domain.repository.specification;

import com.caretriage.domain.entity.ClinicalNote;
import com.caretriage.domain.entity.PatientCondition;
import com.caretriage.domain.entity.PatientMedication;
import com.caretriage.domain.entity.PatientSymptom;
import com.caretriage.infrastructure.persistence.entity.UserJpaEntity;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class EHRSpecification {

    public static Specification<UserJpaEntity> searchPatients(
            String symptom, String medication, String condition,
            String severity, LocalDate dateFrom, LocalDate dateTo, boolean listAll) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (listAll) {
                // No criteria: return all users who have at least one clinical note (i.e., patients with EHR)
                Subquery<Long> noteSubquery = query.subquery(Long.class);
                Root<ClinicalNote> noteRoot = noteSubquery.from(ClinicalNote.class);
                noteSubquery.select(noteRoot.get("patient").get("id"));
                predicates.add(cb.in(root.get("id")).value(noteSubquery));
            } else {
                // Filter by symptom
                if (symptom != null && !symptom.isBlank()) {
                    Subquery<Long> subquery = query.subquery(Long.class);
                    Root<PatientSymptom> subRoot = subquery.from(PatientSymptom.class);
                    subquery.select(subRoot.get("patient").get("id"));

                    List<Predicate> subPreds = new ArrayList<>();
                    subPreds.add(cb.like(cb.lower(subRoot.get("symptomName")), "%" + symptom.toLowerCase() + "%"));

                    if (severity != null && !severity.isBlank()) {
                        try {
                            subPreds.add(cb.equal(subRoot.get("severity"), PatientSymptom.Severity.valueOf(severity.toUpperCase())));
                        } catch (IllegalArgumentException e) {
                            // ignore invalid severity
                        }
                    }
                    subquery.where(subPreds.toArray(new Predicate[0]));
                    predicates.add(cb.in(root.get("id")).value(subquery));
                }

                // Filter by medication
                if (medication != null && !medication.isBlank()) {
                    Subquery<Long> subquery = query.subquery(Long.class);
                    Root<PatientMedication> subRoot = subquery.from(PatientMedication.class);
                    subquery.select(subRoot.get("patient").get("id"));
                    subquery.where(cb.like(cb.lower(subRoot.get("medicationName")), "%" + medication.toLowerCase() + "%"));
                    predicates.add(cb.in(root.get("id")).value(subquery));
                }

                // Filter by condition
                if (condition != null && !condition.isBlank()) {
                    Subquery<Long> subquery = query.subquery(Long.class);
                    Root<PatientCondition> subRoot = subquery.from(PatientCondition.class);
                    subquery.select(subRoot.get("patient").get("id"));
                    subquery.where(cb.like(cb.lower(subRoot.get("conditionName")), "%" + condition.toLowerCase() + "%"));
                    predicates.add(cb.in(root.get("id")).value(subquery));
                }

                // Filter by ClinicalNote date range
                if (dateFrom != null || dateTo != null) {
                    Subquery<Long> subquery = query.subquery(Long.class);
                    Root<ClinicalNote> subRoot = subquery.from(ClinicalNote.class);
                    subquery.select(subRoot.get("patient").get("id"));

                    List<Predicate> subPreds = new ArrayList<>();
                    if (dateFrom != null) {
                        subPreds.add(cb.greaterThanOrEqualTo(subRoot.get("createdAt"), dateFrom.atStartOfDay()));
                    }
                    if (dateTo != null) {
                        subPreds.add(cb.lessThanOrEqualTo(subRoot.get("createdAt"), dateTo.atTime(23, 59, 59)));
                    }

                    subquery.where(subPreds.toArray(new Predicate[0]));
                    predicates.add(cb.in(root.get("id")).value(subquery));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
