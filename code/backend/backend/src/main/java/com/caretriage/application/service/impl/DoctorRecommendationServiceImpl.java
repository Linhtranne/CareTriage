package com.caretriage.application.service.impl;

import com.caretriage.application.ai.service.DoctorRecommendationAi;
import com.caretriage.application.dto.request.DoctorRecommendationCriteria;
import com.caretriage.application.dto.response.DoctorRecommendationResult;
import com.caretriage.application.dto.response.DoctorRecommendationResult.RecommendedDoctor;
import com.caretriage.application.service.DoctorRecommendationService;
import com.caretriage.domain.entity.User;
import com.caretriage.domain.entity.external.ExternalDoctor;
import com.caretriage.domain.repository.UserRepository;
import com.caretriage.domain.repository.ExternalDoctorRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorRecommendationServiceImpl implements DoctorRecommendationService {

    private final DoctorRecommendationAi doctorRecommendationAi;
    private final UserRepository userRepository;
    private final ExternalDoctorRepository externalDoctorRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public DoctorRecommendationResult recommendDoctors(DoctorRecommendationCriteria criteria) {
        log.info("Generating doctor recommendations for TriageTicketId: {}", criteria.getTriageTicketId());

        List<User> internalDoctors = userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("DOCTOR")))
                .toList();

        List<ExternalDoctor> externalDoctors = externalDoctorRepository.findAll().stream()
                .filter(e -> ExternalDoctor.VerificationStatus.VERIFIED.equals(e.getVerificationStatus()))
                .toList();

        Map<String, RecommendedDoctor> enrichmentMap = new HashMap<>();
        List<Map<String, Object>> doctorProfiles = new ArrayList<>();
        
        doctorProfiles.addAll(buildInternalDoctorProfiles(internalDoctors, enrichmentMap));
        doctorProfiles.addAll(buildExternalDoctorProfiles(externalDoctors, enrichmentMap));

        String availableDoctorsJson = serializeProfiles(doctorProfiles);

        try {
            String jsonResult = doctorRecommendationAi.recommendDoctors(criteria, availableDoctorsJson);
            jsonResult = cleanJsonResult(jsonResult);

            DoctorRecommendationResult result = objectMapper.readValue(jsonResult, DoctorRecommendationResult.class);
            enrichRecommendations(result, enrichmentMap);
            
            if (result.getRecommendations() == null || result.getRecommendations().isEmpty()) {
                result.setRecommendations(buildFallbackRecommendations(criteria, enrichmentMap));
            }
            if (result.getRationale() == null || result.getRationale().isBlank()) {
                result.setRationale("Cac bac si duoc uu tien theo chuyen khoa phu hop voi ket qua triage.");
            }
            if (result.getRecommendedDepartment() == null || result.getRecommendedDepartment().isBlank()) {
                result.setRecommendedDepartment(criteria.getDepartment());
            }
            return result;
        } catch (Exception e) {
            log.warn("Doctor recommendation AI unavailable: {}", e.getClass().getSimpleName());
            return DoctorRecommendationResult.builder()
                    .rationale("He thong tam dung de xuat theo chuyen khoa do AI ranking chua kha dung.")
                    .recommendedDepartment(criteria.getDepartment())
                    .recommendations(buildFallbackRecommendations(criteria, enrichmentMap))
                    .build();
        }
    }

    private List<Map<String, Object>> buildInternalDoctorProfiles(List<User> internalDoctors, Map<String, RecommendedDoctor> enrichmentMap) {
        List<Map<String, Object>> profiles = new ArrayList<>();
        for (User d : internalDoctors) {
            String spec = d.getDoctorProfile() != null ? d.getDoctorProfile().getSpecialization() : "General";
            String bio = d.getDoctorProfile() != null ? d.getDoctorProfile().getBio() : "";
            Integer experience = d.getDoctorProfile() != null ? d.getDoctorProfile().getExperienceYears() : 0;
            String idStr = "INT_" + d.getId();
            
            Map<String, Object> map = new HashMap<>();
            map.put("id", idStr);
            map.put("name", d.getFullName());
            map.put("specialization", spec);
            map.put("bio", bio);
            map.put("experienceYears", experience);
            profiles.add(map);
            
            enrichmentMap.put(idStr, RecommendedDoctor.builder()
                .internalId(d.getId())
                .isExternal(false)
                .doctorName(d.getFullName())
                .avatarUrl(d.getAvatarUrl())
                .specialization(spec)
                .hospitalName("CareTriage Clinic")
                .build());
        }
        return profiles;
    }

    private List<Map<String, Object>> buildExternalDoctorProfiles(List<ExternalDoctor> externalDoctors, Map<String, RecommendedDoctor> enrichmentMap) {
        List<Map<String, Object>> profiles = new ArrayList<>();
        for (ExternalDoctor e : externalDoctors) {
            String idStr = "EXT_" + e.getId();
            Map<String, Object> map = new HashMap<>();
            map.put("id", idStr);
            map.put("name", e.getFullName());
            map.put("specialization", e.getSpecialization());
            map.put("bio", e.getBio() != null ? e.getBio() : "");
            map.put("hospitalName", e.getHospitalName());
            profiles.add(map);
            
            enrichmentMap.put(idStr, RecommendedDoctor.builder()
                .externalId(e.getId())
                .isExternal(true)
                .doctorName(e.getFullName())
                .avatarUrl(e.getAvatarUrl())
                .specialization(e.getSpecialization())
                .hospitalName(e.getHospitalName())
                .profileUrl(e.getProfileUrl())
                .build());
        }
        return profiles;
    }

    private String serializeProfiles(List<Map<String, Object>> doctorProfiles) {
        try {
            return objectMapper.writeValueAsString(doctorProfiles);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize doctor profiles to JSON", e);
            throw new com.caretriage.shared.exception.BusinessException("Failed to process doctor profiles: " + e.getMessage());
        }
    }

    private String cleanJsonResult(String jsonResult) {
        if (jsonResult.startsWith("```json")) {
            jsonResult = jsonResult.substring(7);
            if (jsonResult.endsWith("```")) {
                jsonResult = jsonResult.substring(0, jsonResult.length() - 3);
            }
        } else if (jsonResult.startsWith("```")) {
            jsonResult = jsonResult.substring(3);
            if (jsonResult.endsWith("```")) {
                jsonResult = jsonResult.substring(0, jsonResult.length() - 3);
            }
        }
        return jsonResult.trim();
    }

    private void enrichRecommendations(DoctorRecommendationResult result, Map<String, RecommendedDoctor> enrichmentMap) {
        if (result.getRecommendations() == null) return;
        List<RecommendedDoctor> validRecommendations = new ArrayList<>();
        for (RecommendedDoctor rec : result.getRecommendations()) {
            RecommendedDoctor enrichedData = enrichmentMap.get(rec.getDoctorId());
            if (enrichedData != null) {
                rec.setInternalId(enrichedData.getInternalId());
                rec.setExternalId(enrichedData.getExternalId());
                rec.setExternal(enrichedData.isExternal());
                rec.setAvatarUrl(enrichedData.getAvatarUrl());
                rec.setHospitalName(enrichedData.getHospitalName());
                rec.setProfileUrl(enrichedData.getProfileUrl());
                if (rec.getDoctorName() == null) rec.setDoctorName(enrichedData.getDoctorName());
                if (rec.getSpecialization() == null) rec.setSpecialization(enrichedData.getSpecialization());
                validRecommendations.add(rec);
            }
        }
        result.setRecommendations(validRecommendations);
    }

    private List<RecommendedDoctor> buildFallbackRecommendations(
            DoctorRecommendationCriteria criteria,
            Map<String, RecommendedDoctor> enrichmentMap) {
        String target = normalize(criteria.getDepartment());
        List<RecommendedDoctor> matched = enrichmentMap.entrySet().stream()
                .filter(entry -> target.isBlank() || specialtyMatches(target, entry.getValue().getSpecialization()))
                .limit(3)
                .map(entry -> toFallbackRecommendation(entry.getKey(), entry.getValue(), criteria.getDepartment(), 0.75))
                .toList();
        if (!matched.isEmpty()) {
            return matched;
        }
        return enrichmentMap.entrySet().stream()
                .limit(3)
                .map(entry -> toFallbackRecommendation(entry.getKey(), entry.getValue(), criteria.getDepartment(), 0.6))
                .toList();
    }

    private RecommendedDoctor toFallbackRecommendation(
            String doctorId,
            RecommendedDoctor base,
            String department,
            double score) {
        return RecommendedDoctor.builder()
                .doctorId(doctorId)
                .internalId(base.getInternalId())
                .externalId(base.getExternalId())
                .isExternal(base.isExternal())
                .doctorName(base.getDoctorName())
                .avatarUrl(base.getAvatarUrl())
                .specialization(base.getSpecialization())
                .hospitalName(base.getHospitalName())
                .profileUrl(base.getProfileUrl())
                .matchScore(score)
                .matchReason("Phu hop voi chuyen khoa " + department + " tu ket qua triage.")
                .build();
    }

    private boolean specialtyMatches(String target, String specialization) {
        String candidate = normalize(specialization);
        if (candidate.contains(target) || target.contains(candidate)) {
            return true;
        }
        if (target.contains("rang ham mat") || target.contains("nha khoa") || target.contains("dent")) {
            return candidate.contains("rang ham mat") || candidate.contains("nha khoa") || candidate.contains("dent");
        }
        return false;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}

