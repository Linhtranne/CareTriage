package com.caretriage.service.impl;

import com.caretriage.dto.response.AppointmentResponse;
import com.caretriage.entity.*;
import com.caretriage.entity.Appointment.AppointmentStatus;
import com.caretriage.event.AppointmentStatusChangedEvent;
import com.caretriage.exception.ConflictException;
import com.caretriage.exception.ResourceNotFoundException;
import com.caretriage.repository.*;
import com.caretriage.service.ExaminationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
@Slf4j
public class ExaminationServiceImpl implements ExaminationService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final ClinicalNoteRepository clinicalNoteRepository;
    private final AuditLogRepository auditLogRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public AppointmentResponse startExamination(Long appointmentId, String doctorEmail) {
        // 1. Truy vấn thông tin lịch hẹn
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn"));

        User doctor = userRepository.findByEmail(doctorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bác sĩ"));

        // Xác thực quyền hạn: Chỉ bác sĩ được phân công hoặc Admin
        if (!appointment.getDoctor().getId().equals(doctor.getId()) && 
            doctor.getRoles().stream().noneMatch(r -> r.getName().equals("ADMIN"))) {
            throw new AccessDeniedException("Bạn không có quyền bắt đầu ca khám này");
        }

        // 2. Kiểm tra điều kiện trạng thái lịch hẹn
        AppointmentStatus currentStatus = appointment.getStatus();
        if (currentStatus == AppointmentStatus.CANCELLED || currentStatus == AppointmentStatus.COMPLETED) {
            throw new ConflictException("Lịch hẹn đã bị hủy hoặc đã hoàn thành. Không thể bắt đầu khám.");
        }
        
        if (currentStatus != AppointmentStatus.CONFIRMED && currentStatus != AppointmentStatus.CHECKED_IN) {
            throw new ConflictException("Chỉ những lịch hẹn có trạng thái 'Confirmed' hoặc 'Checked-in' mới được phép bắt đầu.");
        }

        // 3. Xác thực sự tồn tại của Hồ sơ bệnh án chính (PatientProfile)
        User patient = appointment.getPatient();
        if (patient.getPatientProfile() == null) {
            log.info("Tạo mới hồ sơ bệnh án cơ bản cho bệnh nhân ID: {}", patient.getId());
            PatientProfile profile = PatientProfile.builder()
                    .user(patient)
                    .build();
            patientProfileRepository.save(profile);
            patient.setPatientProfile(profile);
        }

        // 4. Thực hiện liên kết: Tạo ClinicalNote (Session) và gán Appointment ID
        ClinicalNote sessionNote = ClinicalNote.builder()
                .patient(patient)
                .doctor(doctor)
                .appointment(appointment)
                .noteType(ClinicalNote.NoteType.PROGRESS)
                .extractionStatus(ClinicalNote.ExtractionStatus.PENDING)
                .build();
        clinicalNoteRepository.save(sessionNote);

        AppointmentStatus previousStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.IN_PROGRESS);
        appointmentRepository.save(appointment);
        eventPublisher.publishEvent(new AppointmentStatusChangedEvent(
                appointment.getId(),
                appointment.getTriageTicketId(),
                previousStatus,
                appointment.getStatus()
        ));

        // 7. Ghi nhận Audit Log
        AuditLog auditLog = AuditLog.builder()
                .action("START_EXAMINATION")
                .entityName("Appointment")
                .entityId(appointmentId)
                .details(String.format("Bác sĩ %s bắt đầu khám cho bệnh nhân %s. Đã tạo phiên làm việc ClinicalNote ID: %s", 
                        doctor.getFullName(), patient.getFullName(), sessionNote.getId()))
                .build();
        // BaseEntity fields (createdBy, createdAt) are handled by AuditingEntityListener
        auditLogRepository.save(auditLog);

        log.info("Bắt đầu ca khám thành công: Appointment ID={}, ClinicalNote ID={}", appointmentId, sessionNote.getId());

        return mapToResponse(appointment);
    }

    private AppointmentResponse mapToResponse(Appointment appointment) {
        AppointmentResponse.AppointmentResponseBuilder builder = AppointmentResponse.builder()
                .id(appointment.getId())
                .appointmentDate(appointment.getAppointmentDate())
                .appointmentTime(appointment.getAppointmentTime())
                .endTime(appointment.getEndTime())
                .status(appointment.getStatus().name())
                .reason(appointment.getReason())
                .notes(appointment.getNotes())
                .cancellationReason(appointment.getCancellationReason())
                .triageTicketId(appointment.getTriageTicketId())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt());

        if (appointment.getPatient() != null) {
            builder.patientId(appointment.getPatient().getId())
                    .patientName(appointment.getPatient().getFullName())
                    .patientAvatar(appointment.getPatient().getAvatarUrl())
                    .patientPhone(appointment.getPatient().getPhone());
        }

        if (appointment.getDoctor() != null) {
            builder.doctorId(appointment.getDoctor().getId())
                    .doctorName(appointment.getDoctor().getFullName())
                    .doctorAvatar(appointment.getDoctor().getAvatarUrl());
            if (appointment.getDoctor().getDoctorProfile() != null) {
                builder.doctorSpecialization(appointment.getDoctor().getDoctorProfile().getSpecialization());
            }
        }

        if (appointment.getDepartment() != null) {
            builder.departmentId(appointment.getDepartment().getId())
                    .departmentName(appointment.getDepartment().getName());
        }

        return builder.build();
    }
}
