package com.caretriage.service.impl;

import com.caretriage.dto.request.MedicalRecordRequest;
import com.caretriage.dto.response.MedicalRecordResponse;
import com.caretriage.entity.Appointment;
import com.caretriage.entity.MedicalRecord;
import com.caretriage.entity.User;
import com.caretriage.event.AppointmentStatusChangedEvent;
import com.caretriage.exception.ResourceNotFoundException;
import com.caretriage.repository.AppointmentRepository;
import com.caretriage.repository.MedicalRecordRepository;
import com.caretriage.repository.UserRepository;
import com.caretriage.service.AiClientService;
import com.caretriage.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final AiClientService aiClientService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public MedicalRecordResponse createRecord(MedicalRecordRequest request, String doctorEmail) {
        User doctor = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bác sĩ"));

        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn"));

        // Security check: Only the assigned doctor or an admin can create the record
        if (!appointment.getDoctor().getId().equals(doctor.getId()) && !doctor.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"))) {
            throw new AccessDeniedException("Bạn không có quyền tạo hồ sơ cho ca khám này");
        }

        MedicalRecord record = MedicalRecord.builder()
                .appointment(appointment)
                .patient(appointment.getPatient())
                .doctor(doctor)
                .symptoms(request.getSymptoms())
                .diagnosis(request.getDiagnosis())
                .treatmentPlan(request.getTreatmentPlan())
                .prescription(request.getPrescription())
                .notes(request.getNotes())
                .vitalSigns(request.getVitalSigns())
                .followUpDate(request.getFollowUpDate())
                .build();

        // Auto-complete appointment if it's not already
        if (appointment.getStatus() != Appointment.AppointmentStatus.COMPLETED) {
            Appointment.AppointmentStatus previousStatus = appointment.getStatus();
            appointment.setStatus(Appointment.AppointmentStatus.COMPLETED);
            appointmentRepository.save(appointment);
            eventPublisher.publishEvent(new AppointmentStatusChangedEvent(
                    appointment.getId(),
                    appointment.getTriageTicketId(),
                    previousStatus,
                    appointment.getStatus()
            ));
        }

        MedicalRecord saved = medicalRecordRepository.save(record);
        log.info("Medical record created: ID={}, Patient={}, Doctor={}", saved.getId(), appointment.getPatient().getFullName(), doctor.getFullName());
        
        // Trigger background AI research for this diagnosis
        try {
            String researchQuery = String.format("%s symptoms: %s", saved.getDiagnosis(), saved.getSymptoms());
            aiClientService.triggerResearch(saved.getPatient().getId(), researchQuery);
        } catch (Exception e) {
            log.error("Failed to trigger background research: {}", e.getMessage());
        }

        return mapToResponse(saved);
    }

    @Override
    public MedicalRecordResponse getRecordById(Long id, String userEmail) {
        MedicalRecord record = medicalRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bệnh án"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        // Security check: Patient can only see their own record
        if (user.getRoles().stream().anyMatch(r -> r.getName().equals("PATIENT")) && !record.getPatient().getId().equals(user.getId())) {
            throw new AccessDeniedException("Bạn không có quyền xem hồ sơ này");
        }

        return mapToResponse(record);
    }

    @Override
    public List<MedicalRecordResponse> getPatientHistory(Long patientId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        // Security check
        if (user.getRoles().stream().anyMatch(r -> r.getName().equals("PATIENT")) && !user.getId().equals(patientId)) {
            throw new AccessDeniedException("Bạn không có quyền xem lịch sử của người khác");
        }

        return medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<MedicalRecordResponse> getPatientHistoryPaged(Long patientId, Pageable pageable) {
        // This would typically be used by Admin/Doctor portals
        return medicalRecordRepository.findAll(pageable).map(this::mapToResponse);
    }

    private MedicalRecordResponse mapToResponse(MedicalRecord record) {
        return MedicalRecordResponse.builder()
                .id(record.getId())
                .appointmentId(record.getAppointment() != null ? record.getAppointment().getId() : null)
                .patientId(record.getPatient().getId())
                .patientName(record.getPatient().getFullName())
                .doctorId(record.getDoctor().getId())
                .doctorName(record.getDoctor().getFullName())
                .doctorSpecialization(record.getDoctor().getDoctorProfile() != null ? record.getDoctor().getDoctorProfile().getSpecialization() : null)
                .departmentName(record.getAppointment() != null && record.getAppointment().getDepartment() != null ? record.getAppointment().getDepartment().getName() : null)
                .symptoms(record.getSymptoms())
                .diagnosis(record.getDiagnosis())
                .treatmentPlan(record.getTreatmentPlan())
                .prescription(record.getPrescription())
                .notes(record.getNotes())
                .vitalSigns(record.getVitalSigns())
                .followUpDate(record.getFollowUpDate())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
