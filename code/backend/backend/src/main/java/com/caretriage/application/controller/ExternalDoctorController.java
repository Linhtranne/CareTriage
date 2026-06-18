package com.caretriage.application.controller;

import com.caretriage.application.service.ExternalDoctorService;
import com.caretriage.domain.entity.external.ExternalDoctor;
import com.caretriage.domain.entity.external.ExternalDoctorImportJob;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/external-doctors")
@RequiredArgsConstructor
public class ExternalDoctorController {

    private final ExternalDoctorService externalDoctorService;

    @PostMapping("/sources")
    public ResponseEntity<com.caretriage.domain.entity.external.ExternalDoctorSource> createSource(
            @RequestBody com.caretriage.domain.entity.external.ExternalDoctorSource source) {
        return ResponseEntity.ok(externalDoctorService.createSource(source));
    }

    @GetMapping("/sources")
    public ResponseEntity<List<com.caretriage.domain.entity.external.ExternalDoctorSource>> getAllSources() {
        return ResponseEntity.ok(externalDoctorService.getAllSources());
    }

    @GetMapping("/sources/nearby")
    public ResponseEntity<List<com.caretriage.domain.entity.external.ExternalDoctorSource>> getNearbySources(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false, defaultValue = "10.0") Double radiusKm) {
        return ResponseEntity.ok(externalDoctorService.findNearbySources(lat, lng, radiusKm));
    }

    @GetMapping("/import-jobs/{id}/preview")
    public ResponseEntity<List<ExternalDoctor>> getJobPreview(@PathVariable Long id) {
        return ResponseEntity.ok(externalDoctorService.getJobPreview(id));
    }

    @PostMapping("/sync/{sourceId}")
    public ResponseEntity<ExternalDoctorImportJob> triggerSync(@PathVariable Long sourceId) {
        return ResponseEntity.ok(externalDoctorService.triggerSync(sourceId));
    }

    @GetMapping
    public ResponseEntity<List<ExternalDoctor>> getAllExternalDoctors() {
        return ResponseEntity.ok(externalDoctorService.getAllExternalDoctors());
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ExternalDoctor> approveDoctor(@PathVariable Long id) {
        return ResponseEntity.ok(externalDoctorService.approveDoctor(id));
    }

    @PostMapping("/bulk-approve")
    public ResponseEntity<List<ExternalDoctor>> bulkApproveDoctors(@RequestBody List<Long> doctorIds) {
        return ResponseEntity.ok(externalDoctorService.bulkApproveDoctors(doctorIds));
    }

    @PostMapping("/approve-all")
    public ResponseEntity<List<ExternalDoctor>> approveAllDoctors() {
        return ResponseEntity.ok(externalDoctorService.approveAllUnverifiedDoctors());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExternalDoctor(@PathVariable Long id) {
        externalDoctorService.deleteExternalDoctor(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAllExternalDoctors() {
        externalDoctorService.deleteAllExternalDoctors();
        return ResponseEntity.noContent().build();
    }
}

