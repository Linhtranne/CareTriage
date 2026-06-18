package com.caretriage.application.service.impl;

import com.caretriage.application.dto.request.DoctorDepartmentRequest;
import com.caretriage.application.dto.response.DepartmentResponse;
import com.caretriage.application.dto.response.DoctorPublicResponse;
import com.caretriage.application.dto.response.PagedResponse;
import com.caretriage.application.dto.response.TimeSlotResponse;
import com.caretriage.application.dto.response.DoctorPatientResponse;
import com.caretriage.application.dto.response.DoctorPatientDetailResponse;
import com.caretriage.application.dto.response.AppointmentResponse;
import com.caretriage.application.dto.response.MedicalRecordResponse;
import com.caretriage.application.dto.response.TriageTicketResponse;
import com.caretriage.domain.entity.Department;
import com.caretriage.domain.entity.DoctorProfile;
import com.caretriage.domain.entity.User;
import com.caretriage.domain.entity.Appointment;
import com.caretriage.domain.entity.MedicalRecord;
import com.caretriage.domain.entity.TriageTicket;
import com.caretriage.shared.exception.ResourceNotFoundException;
import com.caretriage.domain.repository.DepartmentRepository;
import com.caretriage.domain.repository.DoctorProfileRepository;
import com.caretriage.domain.repository.UserRepository;
import com.caretriage.domain.repository.AppointmentRepository;
import com.caretriage.domain.repository.MedicalRecordRepository;
import com.caretriage.domain.repository.TriageTicketRepository;
import com.caretriage.application.service.AppointmentService;
import com.caretriage.application.service.DoctorService;
import jakarta.persistence.criteria.Join;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@SuppressWarnings("java:S3776")
public class DoctorServiceImpl implements DoctorService {

    private final DoctorProfileRepository doctorProfileRepository;
    private final DepartmentRepository departmentRepository;
    private final AppointmentService appointmentService;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final TriageTicketRepository triageTicketRepository;

    @Override
    @Transactional
    public void assignDepartments(Long doctorId, DoctorDepartmentRequest request) {
        DoctorProfile doctorProfile = doctorProfileRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found with id: " + doctorId));

        Set<Department> departments = new HashSet<>();
        for (Long deptId : request.getDepartmentIds()) {
            Department dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + deptId));
            departments.add(dept);
        }

        doctorProfile.setDepartments(departments);
        doctorProfileRepository.save(doctorProfile);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getDoctorDepartments(Long doctorId) {
        DoctorProfile doctorProfile = doctorProfileRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found with id: " + doctorId));

        return doctorProfile.getDepartments().stream()
                .map(this::mapToDepartmentResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<DoctorPublicResponse> getPublicDoctors(Long departmentId, String search, int page, int size) {
        Specification<DoctorProfile> spec = Specification.where(null);

        if (departmentId != null) {
            spec = spec.and((root, query, cb) -> {
                Join<DoctorProfile, Department> departments = root.join("departments");
                return cb.equal(departments.get("id"), departmentId);
            });
        }

        if (search != null && !search.isEmpty()) {
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("user").get("fullName")), "%" + search.toLowerCase() + "%")
            );
        }

        Page<DoctorProfile> doctorPage = doctorProfileRepository.findAll(spec, PageRequest.of(page, size));

        List<DoctorPublicResponse> content = doctorPage.getContent().stream()
                .map(this::mapToPublicResponse)
                .toList();

        return PagedResponse.<DoctorPublicResponse>builder()
                .content(content)
                .page(doctorPage.getNumber())
                .size(doctorPage.getSize())
                .totalElements(doctorPage.getTotalElements())
                .totalPages(doctorPage.getTotalPages())
                .last(doctorPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorPublicResponse getDoctorById(Long id) {
        DoctorProfile doctor = doctorProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bác sĩ với ID: " + id));
        return mapToPublicResponse(doctor);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimeSlotResponse> getAvailableSlots(Long doctorId, java.time.LocalDate date) {
        // Verify doctor exists
        if (!doctorProfileRepository.existsById(doctorId)) {
            throw new ResourceNotFoundException("Không tìm thấy bác sĩ với ID: " + doctorId);
        }
        return appointmentService.getAvailableSlots(doctorId, date);
    }

    private DepartmentResponse mapToDepartmentResponse(Department dept) {
        return DepartmentResponse.builder()
                .id(dept.getId())
                .code(dept.getCode())
                .name(dept.getName())
                .slug(dept.getSlug())
                .description(dept.getDescription())
                .imageUrl(dept.getImageUrl())
                .status(dept.getStatus())
                .build();
    }



    private DoctorPublicResponse mapToPublicResponse(DoctorProfile d) {
        return DoctorPublicResponse.builder()
                .id(d.getUser().getId())
                .fullName(d.getUser().getFullName())
                .avatarUrl(d.getUser().getAvatarUrl())
                .bio(d.getBio())
                .specialization(d.getSpecialization())
                .experienceYears(d.getExperienceYears())
                .hospitalName(d.getHospitalName())
                .departments(d.getDepartments().stream()
                        .map(this::mapToDepartmentResponse)
                        .toList())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<DoctorPatientResponse> getDoctorPatients(
            Long doctorId, String search, String relationshipSource, String ticketStatus,
            Boolean hasUpcomingAppointment, Boolean hasMedicalRecord, int page, int size) {

        Page<Long> patientIdPage = userRepository.findPatientIdsByDoctorRelation(
                doctorId,
                (search == null || search.trim().isEmpty()) ? null : search.trim(),
                (relationshipSource == null || relationshipSource.trim().isEmpty() || "ALL".equalsIgnoreCase(relationshipSource)) ? null : relationshipSource.trim().toUpperCase(),
                (ticketStatus == null || ticketStatus.trim().isEmpty() || "ALL".equalsIgnoreCase(ticketStatus)) ? null : ticketStatus.trim().toUpperCase(),
                hasUpcomingAppointment != null && hasUpcomingAppointment,
                hasMedicalRecord != null && hasMedicalRecord,
                LocalDate.now(),
                PageRequest.of(page, size)
        );

        List<DoctorPatientResponse> content = patientIdPage.getContent().stream().map(patientId -> {
            User u = userRepository.findById(patientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

            String gender = null;
            LocalDate dateOfBirth = null;
            Integer age = null;
            if (u.getPatientProfile() != null) {
                gender = u.getPatientProfile().getGender();
                dateOfBirth = u.getPatientProfile().getDateOfBirth();
                if (dateOfBirth != null) {
                    age = Period.between(dateOfBirth, LocalDate.now()).getYears();
                }
            }

            // Relationship sources
            List<String> sources = new ArrayList<>();
            long apptCount = appointmentRepository.countByDoctorIdAndPatientIdAndStatusNotCancelled(doctorId, patientId);
            long medCount = medicalRecordRepository.countByDoctorIdAndPatientId(doctorId, patientId);
            long ticketCount = triageTicketRepository.countByTriageOfficerIdAndRequesterId(doctorId, patientId);

            if (apptCount > 0) sources.add("APPOINTMENT");
            if (medCount > 0) sources.add("MEDICAL_RECORD");
            if (ticketCount > 0) sources.add("TRIAGE_TICKET");

            // Find last and next appointment
            List<Appointment> appts = appointmentRepository.findActiveAppointmentsByDoctorAndPatient(doctorId, patientId);
            LocalDateTime lastAppointmentDate = null;
            LocalDateTime nextAppointmentDate = null;

            LocalDate today = LocalDate.now();
            for (Appointment a : appts) {
                LocalDateTime ldt = LocalDateTime.of(a.getAppointmentDate(), a.getAppointmentTime());
                if (a.getAppointmentDate().isBefore(today)) {
                    if (lastAppointmentDate == null || ldt.isAfter(lastAppointmentDate)) {
                        lastAppointmentDate = ldt;
                    }
                } else {
                    if (nextAppointmentDate == null || ldt.isBefore(nextAppointmentDate)) {
                        nextAppointmentDate = ldt;
                    }
                }
            }

            if (lastAppointmentDate == null && !appts.isEmpty()) {
                for (Appointment a : appts) {
                    LocalDateTime ldt = LocalDateTime.of(a.getAppointmentDate(), a.getAppointmentTime());
                    if (!a.getAppointmentDate().isAfter(today)) {
                        lastAppointmentDate = ldt;
                        break;
                    }
                }
            }

            LocalDateTime lastInteractionAt = null;
            List<MedicalRecord> meds = medicalRecordRepository.findByDoctorIdAndPatientIdOrderByCreatedAtDesc(doctorId, patientId);
            LocalDateTime latestMedDate = meds.isEmpty() ? null : meds.get(0).getCreatedAt();

            List<TriageTicket> tickets = triageTicketRepository.findByTriageOfficerIdAndRequesterIdOrderByCreatedAtDesc(doctorId, patientId);
            LocalDateTime latestTicketDate = tickets.isEmpty() ? null : tickets.get(0).getUpdatedAt();

            List<LocalDateTime> dates = new ArrayList<>();
            if (lastAppointmentDate != null) dates.add(lastAppointmentDate);
            if (latestMedDate != null) dates.add(latestMedDate);
            if (latestTicketDate != null) dates.add(latestTicketDate);

            if (!dates.isEmpty()) {
                lastInteractionAt = Collections.max(dates);
            } else {
                lastInteractionAt = u.getCreatedAt() != null ? u.getCreatedAt() : LocalDateTime.now();
            }

            String latestTicketStatus = tickets.isEmpty() ? null : tickets.get(0).getStatus().name();

            return DoctorPatientResponse.builder()
                    .patientId(patientId)
                    .fullName(u.getFullName())
                    .email(u.getEmail())
                    .phone(u.getPhone())
                    .gender(gender)
                    .dateOfBirth(dateOfBirth)
                    .age(age)
                    .avatarUrl(u.getAvatarUrl())
                    .relationshipSources(sources)
                    .lastAppointmentDate(lastAppointmentDate)
                    .nextAppointmentDate(nextAppointmentDate)
                    .medicalRecordCount(medCount)
                    .triageTicketCount(ticketCount)
                    .latestTicketStatus(latestTicketStatus)
                    .lastInteractionAt(lastInteractionAt)
                    .build();
        }).toList();

        return PagedResponse.<DoctorPatientResponse>builder()
                .content(content)
                .page(patientIdPage.getNumber())
                .size(patientIdPage.getSize())
                .totalElements(patientIdPage.getTotalElements())
                .totalPages(patientIdPage.getTotalPages())
                .last(patientIdPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorPatientDetailResponse getDoctorPatientDetail(Long doctorId, Long patientId) {
        long apptCount = appointmentRepository.countByDoctorIdAndPatientIdAndStatusNotCancelled(doctorId, patientId);
        long medCount = medicalRecordRepository.countByDoctorIdAndPatientId(doctorId, patientId);
        long ticketCount = triageTicketRepository.countByTriageOfficerIdAndRequesterId(doctorId, patientId);

        if (apptCount == 0 && medCount == 0 && ticketCount == 0) {
            throw new ResourceNotFoundException("Patient relationship not found with id: " + patientId);
        }

        User u = userRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        LocalDate dateOfBirth = null;
        String gender = null;
        String address = null;
        String bloodType = null;
        String allergies = null;
        String insuranceNumber = null;
        String emergencyContactName = null;
        String emergencyContactPhone = null;
        String chronicConditions = null;

        if (u.getPatientProfile() != null) {
            dateOfBirth = u.getPatientProfile().getDateOfBirth();
            gender = u.getPatientProfile().getGender();
            address = u.getPatientProfile().getAddress();
            bloodType = u.getPatientProfile().getBloodType();
            allergies = u.getPatientProfile().getAllergies();
            insuranceNumber = u.getPatientProfile().getInsuranceNumber();
            emergencyContactName = u.getPatientProfile().getEmergencyContactName();
            emergencyContactPhone = u.getPatientProfile().getEmergencyContactPhone();
            chronicConditions = u.getPatientProfile().getChronicConditions();
        }

        List<Appointment> appts = appointmentRepository.findActiveAppointmentsByDoctorAndPatient(doctorId, patientId);
        List<AppointmentResponse> recentAppts = appts.stream()
                .limit(5)
                .map(this::mapToAppointmentResponse)
                .toList();

        List<MedicalRecord> meds = medicalRecordRepository.findByDoctorIdAndPatientIdOrderByCreatedAtDesc(doctorId, patientId);
        List<MedicalRecordResponse> recentMeds = meds.stream()
                .limit(5)
                .map(this::mapToMedicalRecordResponse)
                .toList();

        List<TriageTicket> tickets = triageTicketRepository.findByTriageOfficerIdAndRequesterIdOrderByCreatedAtDesc(doctorId, patientId);
        List<TriageTicketResponse> recentTickets = tickets.stream()
                .limit(5)
                .map(this::mapToTriageTicketResponse)
                .toList();

        long completedAppts = appointmentRepository.countByDoctorIdAndPatientIdAndStatusCompleted(doctorId, patientId);
        long activeTickets = triageTicketRepository.countActiveTicketsByDoctorAndPatient(doctorId, patientId);

        return DoctorPatientDetailResponse.builder()
                .patientId(patientId)
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .avatarUrl(u.getAvatarUrl())
                .createdAt(u.getCreatedAt())
                .dateOfBirth(dateOfBirth)
                .gender(gender)
                .address(address)
                .bloodType(bloodType)
                .allergies(allergies)
                .insuranceNumber(insuranceNumber)
                .emergencyContactName(emergencyContactName)
                .emergencyContactPhone(emergencyContactPhone)
                .chronicConditions(chronicConditions)
                .totalAppointments(apptCount)
                .completedAppointments(completedAppts)
                .totalMedicalRecords(medCount)
                .totalTriageTickets(ticketCount)
                .activeTriageTickets(activeTickets)
                .recentAppointments(recentAppts)
                .recentMedicalRecords(recentMeds)
                .recentTriageTickets(recentTickets)
                .build();
    }

    private AppointmentResponse mapToAppointmentResponse(Appointment appt) {
        String spec = null;
        if (appt.getDoctor() != null && appt.getDoctor().getDoctorProfile() != null) {
            spec = appt.getDoctor().getDoctorProfile().getSpecialization();
        }

        return AppointmentResponse.builder()
                .id(appt.getId())
                .patientId(appt.getPatient().getId())
                .patientName(appt.getPatient().getFullName())
                .patientAvatar(appt.getPatient().getAvatarUrl())
                .patientPhone(appt.getPatient().getPhone())
                .doctorId(appt.getDoctor().getId())
                .doctorName(appt.getDoctor().getFullName())
                .doctorAvatar(appt.getDoctor().getAvatarUrl())
                .doctorSpecialization(spec)
                .departmentId(appt.getDepartment() != null ? appt.getDepartment().getId() : null)
                .departmentName(appt.getDepartment() != null ? appt.getDepartment().getName() : null)
                .appointmentDate(appt.getAppointmentDate())
                .appointmentTime(appt.getAppointmentTime())
                .endTime(appt.getEndTime())
                .status(appt.getStatus() != null ? appt.getStatus().name() : null)
                .reason(appt.getReason())
                .notes(appt.getNotes())
                .cancellationReason(appt.getCancellationReason())
                .triageTicketId(appt.getTriageTicketId())
                .createdAt(appt.getCreatedAt())
                .updatedAt(appt.getUpdatedAt())
                .build();
    }

    private MedicalRecordResponse mapToMedicalRecordResponse(MedicalRecord medRecord) {
        String spec = null;
        if (medRecord.getDoctor() != null && medRecord.getDoctor().getDoctorProfile() != null) {
            spec = medRecord.getDoctor().getDoctorProfile().getSpecialization();
        }

        String deptName = null;
        if (medRecord.getAppointment() != null && medRecord.getAppointment().getDepartment() != null) {
            deptName = medRecord.getAppointment().getDepartment().getName();
        }

        return MedicalRecordResponse.builder()
                .id(medRecord.getId())
                .appointmentId(medRecord.getAppointment() != null ? medRecord.getAppointment().getId() : null)
                .patientId(medRecord.getPatient().getId())
                .patientName(medRecord.getPatient().getFullName())
                .doctorId(medRecord.getDoctor().getId())
                .doctorName(medRecord.getDoctor().getFullName())
                .doctorSpecialization(spec)
                .departmentName(deptName)
                .symptoms(medRecord.getSymptoms())
                .diagnosis(medRecord.getDiagnosis())
                .treatmentPlan(medRecord.getTreatmentPlan())
                .prescription(medRecord.getPrescription())
                .notes(medRecord.getNotes())
                .vitalSigns(medRecord.getVitalSigns())
                .followUpDate(medRecord.getFollowUpDate())
                .triagePriority(medRecord.getTriagePriority())
                .createdAt(medRecord.getCreatedAt())
                .build();
    }

    private TriageTicketResponse mapToTriageTicketResponse(TriageTicket t) {
        return TriageTicketResponse.builder()
                .id(t.getId())
                .ticketNumber(t.getTicketNumber())
                .title(t.getTitle())
                .description(t.getDescription())
                .status(t.getStatus())
                .priority(t.getPriority())
                .severity(t.getSeverity())
                .requesterId(t.getRequester().getId())
                .requesterName(t.getRequester().getFullName())
                .triageOfficerId(t.getTriageOfficer() != null ? t.getTriageOfficer().getId() : null)
                .triageOfficerName(t.getTriageOfficer() != null ? t.getTriageOfficer().getFullName() : null)
                .categoryId(t.getCategory() != null ? t.getCategory().getId() : null)
                .categoryName(t.getCategory() != null ? t.getCategory().getName() : null)
                .metadata(t.getMetadata())
                .triagedAt(t.getTriagedAt())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
