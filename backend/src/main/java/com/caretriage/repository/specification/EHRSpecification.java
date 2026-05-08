package com.caretriage.repository.specification;

import com.caretriage.entity.PatientCondition;
import com.caretriage.entity.PatientMedication;
import com.caretriage.entity.PatientSymptom;
import com.caretriage.entity.User;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class EHRSpecification {

    public static Specification<User> searchPatients(String symptom, String medication, String condition, String severity) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

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

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
