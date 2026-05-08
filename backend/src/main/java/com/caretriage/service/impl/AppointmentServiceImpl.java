package com.caretriage.service.impl;

import com.caretriage.dto.request.AppointmentRequest;
import com.caretriage.dto.request.CancelAppointmentRequest;
import com.caretriage.dto.request.CreateAppointmentFromTicketRequest;
import com.caretriage.dto.request.UpdateAppointmentStatusRequest;
import com.caretriage.dto.response.AppointmentResponse;
import com.caretriage.dto.response.TimeSlotResponse;
import com.caretriage.entity.Appointment;
import com.caretriage.entity.Appointment.AppointmentStatus;
import com.caretriage.entity.Department;
import com.caretriage.entity.DoctorSchedule;
import com.caretriage.entity.User;
import com.caretriage.entity.TriageTicket;
import com.caretriage.event.AppointmentStatusChangedEvent;
import com.caretriage.exception.ResourceNotFoundException;
import com.caretriage.repository.AppointmentRepository;
import com.caretriage.repository.DepartmentRepository;
import com.caretriage.repository.DoctorScheduleRepository;
import com.caretriage.repository.TriageTicketRepository;
import com.caretriage.repository.UserRepository;
import com.caretriage.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final TriageTicketRepository triageTicketRepository;
    private final ApplicationEventPublisher eventPublisher;

    private static final int SLOT_DURATION_MINUTES = 30;

    @Override
    @Transactional
    public AppointmentResponse bookAppointment(Long patientId, AppointmentRequest request) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bệnh nhân"));

        User doctor = userRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bác sĩ"));

        // Validate doctor has DOCTOR role
        boolean isDoctor = doctor.getRoles().stream()
                .anyMatch(r -> r.getName().equals("DOCTOR"));
        if (!isDoctor) {
            throw new RuntimeException("Người dùng được chọn không phải bác sĩ");
        }

        // Business Rule: Only allow booking within 30 days from now
        LocalDate maxDate = LocalDate.now().plusDays(30);
        if (request.getAppointmentDate().isAfter(maxDate)) {
            throw new RuntimeException("Chỉ cho phép đặt lịch trong vòng 30 ngày kể từ hôm nay");
        }

        // Business Rule: Minimum 60-minute lead time for same-day appointments
        if (request.getAppointmentDate().equals(LocalDate.now())) {
            LocalTime minTime = LocalTime.now().plusMinutes(60);
            if (request.getAppointmentTime().isBefore(minTime)) {
                throw new RuntimeException("Vui lòng đặt lịch trước giờ hẹn ít nhất 60 phút");
            }
        }

        // Business Rule: Max 2 appointments per patient per day
        List<Appointment> dailyAppointments = appointmentRepository.findByPatientIdAndAppointmentDate(patientId, request.getAppointmentDate());
        long activeDailyCount = dailyAppointments.stream()
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
                .count();
        if (activeDailyCount >= 2) {
            throw new RuntimeException("Mỗi bệnh nhân chỉ được đặt tối đa 02 cuộc hẹn trong cùng một ngày");
        }

        // Check doctor schedule for the requested day
        java.time.DayOfWeek dayOfWeek = request.getAppointmentDate().getDayOfWeek();
        List<DoctorSchedule> schedules = doctorScheduleRepository
                .findByDoctorIdAndDayOfWeekAndIsActiveTrue(request.getDoctorId(), dayOfWeek);

        if (schedules.isEmpty()) {
            throw new RuntimeException("Bác sĩ không có lịch làm việc vào " + dayOfWeek);
        }

        // Verify the requested time falls within a schedule
        boolean isWithinSchedule = schedules.stream()
                .anyMatch(s -> !request.getAppointmentTime().isBefore(s.getStartTime())
                        && !request.getAppointmentTime().isAfter(s.getEndTime().minusMinutes(SLOT_DURATION_MINUTES)));

        if (!isWithinSchedule) {
            throw new RuntimeException("Giờ khám không nằm trong lịch làm việc của bác sĩ");
        }

        // Check for time slot conflicts (T-029)
        LocalTime endTime = request.getAppointmentTime().plusMinutes(SLOT_DURATION_MINUTES);
        List<Appointment> conflicts = appointmentRepository.findConflictingAppointments(
                request.getDoctorId(),
                request.getAppointmentDate(),
                request.getAppointmentTime(),
                endTime,
                null // excludeId is null for new bookings
        );

        if (!conflicts.isEmpty()) {
            throw new com.caretriage.exception.ConflictException("Khung giờ này vừa mới được đặt. Vui lòng chọn khung giờ khác");
        }

        // Check if patient already has appointment at the same time
        List<Appointment> patientAppointments = appointmentRepository
                .findByPatientIdAndStatus(patientId, AppointmentStatus.PENDING);
        patientAppointments.addAll(appointmentRepository
                .findByPatientIdAndStatus(patientId, AppointmentStatus.CONFIRMED));

        boolean patientConflict = patientAppointments.stream()
                .anyMatch(a -> a.getAppointmentDate().equals(request.getAppointmentDate())
                        && a.getAppointmentTime().equals(request.getAppointmentTime()));

        if (patientConflict) {
            throw new RuntimeException("Bạn đã có lịch khám vào thời gian này");
        }

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId()).orElse(null);
        }

        Appointment appointment = Appointment.builder()
                .patient(patient)
                .doctor(doctor)
                .department(department)
                .appointmentDate(request.getAppointmentDate())
                .appointmentTime(request.getAppointmentTime())
                .endTime(endTime)
                .reason(request.getReason())
                .status(AppointmentStatus.PENDING)
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        log.info("Appointment booked: ID={}, Patient={}, Doctor={}, Date={} Time={}",
                saved.getId(), patient.getFullName(), doctor.getFullName(),
                saved.getAppointmentDate(), saved.getAppointmentTime());

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public AppointmentResponse cancelAppointment(Long appointmentId, Long userId, CancelAppointmentRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn"));

        // Verify ownership (patient or doctor can cancel)
        if (!appointment.getPatient().getId().equals(userId)
                && !appointment.getDoctor().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền hủy lịch hẹn này");
        }

        // Business Rule: Cannot cancel less than 2 hours before appointment
        LocalDateTime appointmentDateTime = LocalDateTime.of(appointment.getAppointmentDate(), appointment.getAppointmentTime());
        if (LocalDateTime.now().plusHours(2).isAfter(appointmentDateTime)) {
            throw new RuntimeException("Không thể hủy lịch hẹn trước giờ khám ít hơn 02 tiếng");
        }

        AppointmentStatus previousStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.CANCELLED);
        if (request != null && request.getCancellationReason() != null) {
            appointment.setCancellationReason(request.getCancellationReason());
        }

        Appointment saved = appointmentRepository.save(appointment);
        publishAppointmentStatusChanged(saved.getId(), saved.getTriageTicketId(), previousStatus, saved.getStatus());
        log.info("Appointment cancelled: ID={}", appointmentId);
        return mapToResponse(saved);
    }

    @Override
    public List<AppointmentResponse> getPatientAppointments(Long patientId, String status) {
        List<Appointment> appointments;

        if (status != null && !status.isEmpty()) {
            try {
                AppointmentStatus appointmentStatus = AppointmentStatus.valueOf(status.toUpperCase());
                appointments = appointmentRepository.findByPatientIdAndStatus(patientId, appointmentStatus);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Trạng thái không hợp lệ: " + status);
            }
        } else {
            appointments = appointmentRepository.findByPatientIdOrderByAppointmentDateDesc(patientId);
        }

        return appointments.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentResponse> getDoctorAppointments(Long doctorId, LocalDate date, String status) {
        List<Appointment> appointments;

        if (date != null && status != null && !status.isEmpty()) {
            AppointmentStatus appointmentStatus = AppointmentStatus.valueOf(status.toUpperCase());
            appointments = appointmentRepository.findByDoctorIdAndAppointmentDate(doctorId, date)
                    .stream()
                    .filter(a -> a.getStatus() == appointmentStatus)
                    .collect(Collectors.toList());
        } else if (date != null) {
            appointments = appointmentRepository.findByDoctorIdAndAppointmentDate(doctorId, date);
        } else if (status != null && !status.isEmpty()) {
            AppointmentStatus appointmentStatus = AppointmentStatus.valueOf(status.toUpperCase());
            appointments = appointmentRepository.findByDoctorIdAndStatus(doctorId, appointmentStatus);
        } else {
            appointments = appointmentRepository.findByDoctorIdOrderByAppointmentDateDesc(doctorId);
        }

        return appointments.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentResponse> getDoctorTodayAppointments(Long doctorId) {
        List<Appointment> appointments = appointmentRepository
                .findByDoctorIdAndAppointmentDate(doctorId, LocalDate.now());

        // Sort by appointment time
        appointments.sort((a, b) -> a.getAppointmentTime().compareTo(b.getAppointmentTime()));

        return appointments.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppointmentResponse updateAppointmentStatus(Long appointmentId, Long doctorId, UpdateAppointmentStatusRequest request) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn"));

        if (!appointment.getDoctor().getId().equals(doctorId)) {
            throw new RuntimeException("Bạn không có quyền cập nhật lịch hẹn này");
        }

        AppointmentStatus newStatus;
        try {
            newStatus = AppointmentStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái không hợp lệ: " + request.getStatus());
        }

        // Business Rule: One IN_PROGRESS at a time (T-032)
        if (newStatus == AppointmentStatus.IN_PROGRESS) {
            List<Appointment> inProgress = appointmentRepository.findByDoctorIdAndStatus(doctorId, AppointmentStatus.IN_PROGRESS);
            if (!inProgress.isEmpty() && !inProgress.get(0).getId().equals(appointmentId)) {
                throw new RuntimeException("Bạn đang có một ca khám chưa kết thúc. Vui lòng hoàn thành ca cũ trước.");
            }
        }

        // Business Rule: Cancellation requires reason
        if (newStatus == AppointmentStatus.CANCELLED && (request.getNotes() == null || request.getNotes().trim().isEmpty())) {
            throw new RuntimeException("Vui lòng nhập lý do khi hủy lịch khám");
        }

        // Validate status transitions
        validateStatusTransition(appointment.getStatus(), newStatus);

        AppointmentStatus previousStatus = appointment.getStatus();
        appointment.setStatus(newStatus);
        if (request.getNotes() != null) {
            if (newStatus == AppointmentStatus.CANCELLED) {
                appointment.setCancellationReason(request.getNotes());
            } else {
                appointment.setNotes(request.getNotes());
            }
        }

        Appointment saved = appointmentRepository.save(appointment);
        publishAppointmentStatusChanged(saved.getId(), saved.getTriageTicketId(), previousStatus, saved.getStatus());
        log.info("Appointment status updated: ID={}, {} -> {}", appointmentId, appointment.getStatus(), newStatus);
        return mapToResponse(saved);
    }

    @Override
    public List<TimeSlotResponse> getAvailableSlots(Long doctorId, LocalDate date) {
        // Business Rule: Only allow checking slots within 30 days
        LocalDate maxDate = LocalDate.now().plusDays(30);
        if (date.isBefore(LocalDate.now()) || date.isAfter(maxDate)) {
            return new ArrayList<>();
        }

        // Get doctor's schedule for the requested day
        java.time.DayOfWeek dayOfWeek = date.getDayOfWeek();
        List<DoctorSchedule> schedules = doctorScheduleRepository
                .findByDoctorIdAndDayOfWeekAndIsActiveTrue(doctorId, dayOfWeek);

        if (schedules.isEmpty()) {
            return new ArrayList<>();
        }

        // Get existing appointments for this date
        List<Appointment> existingAppointments = appointmentRepository
                .findByDoctorIdAndAppointmentDate(doctorId, date)
                .stream()
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED
                        && a.getStatus() != AppointmentStatus.NO_SHOW)
                .collect(Collectors.toList());

        List<TimeSlotResponse> slots = new ArrayList<>();

        for (DoctorSchedule schedule : schedules) {
            LocalTime current = schedule.getStartTime();
            LocalTime end = schedule.getEndTime();

            while (current.plusMinutes(SLOT_DURATION_MINUTES).compareTo(end) <= 0) {
                final LocalTime slotStart = current;
                final LocalTime slotEnd = current.plusMinutes(SLOT_DURATION_MINUTES);

                // Business Rule: Minimum 60-minute lead time for same-day appointments
                boolean isUnavailable = false;
                if (date.equals(LocalDate.now())) {
                    LocalTime minTime = LocalTime.now().plusMinutes(60);
                    if (slotStart.isBefore(minTime)) {
                        isUnavailable = true;
                    }
                } else if (date.isBefore(LocalDate.now())) {
                    isUnavailable = true;
                }

                // Check if slot is already booked
                boolean isBooked = existingAppointments.stream()
                        .anyMatch(a -> a.getAppointmentTime().equals(slotStart));

                slots.add(TimeSlotResponse.builder()
                        .startTime(slotStart)
                        .endTime(slotEnd)
                        .available(!isUnavailable && !isBooked)
                        .build());

                current = slotEnd;
            }
        }

        return slots;
    }

    @Override
    @Transactional
    public AppointmentResponse createAppointmentFromTicket(Long doctorId, CreateAppointmentFromTicketRequest request) {
        TriageTicket ticket = triageTicketRepository.findById(request.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy triage ticket"));

        if (appointmentRepository.existsByTriageTicketId(request.getTicketId())) {
            throw new RuntimeException("Phiếu này đã có lịch hẹn trước đó");
        }

        if (request.getAppointmentDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Không thể tạo lịch hẹn trong quá khứ");
        }

        AppointmentRequest appointmentRequest = new AppointmentRequest();
        appointmentRequest.setDoctorId(doctorId);
        appointmentRequest.setDepartmentId(request.getDepartmentId());
        appointmentRequest.setAppointmentDate(request.getAppointmentDate());
        appointmentRequest.setAppointmentTime(request.getAppointmentTime());
        appointmentRequest.setReason(ticket.getDescription());

        AppointmentResponse response = bookAppointment(ticket.getRequester().getId(), appointmentRequest);

        Appointment appointment = appointmentRepository.findById(response.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn"));
        appointment.setTriageTicketId(ticket.getId());
        AppointmentStatus previousStatus = appointment.getStatus();
        appointment.setStatus(AppointmentStatus.CHECKED_IN);
        Appointment saved = appointmentRepository.save(appointment);
        publishAppointmentStatusChanged(saved.getId(), saved.getTriageTicketId(), previousStatus, saved.getStatus());

        return mapToResponse(saved);
    }

    @Override
    public AppointmentResponse getAppointmentById(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch hẹn"));
        return mapToResponse(appointment);
    }

    // --- Private helpers ---

    private void publishAppointmentStatusChanged(Long appointmentId, UUID triageTicketId,
                                                 AppointmentStatus previousStatus, AppointmentStatus newStatus) {
        eventPublisher.publishEvent(new AppointmentStatusChangedEvent(
                appointmentId,
                triageTicketId,
                previousStatus,
                newStatus
        ));
    }

    private void validateStatusTransition(AppointmentStatus current, AppointmentStatus next) {
        boolean valid = switch (current) {
            case PENDING -> next == AppointmentStatus.CONFIRMED || next == AppointmentStatus.CANCELLED;
            case CONFIRMED -> next == AppointmentStatus.CHECKED_IN || next == AppointmentStatus.IN_PROGRESS || next == AppointmentStatus.CANCELLED || next == AppointmentStatus.NO_SHOW;
            case CHECKED_IN -> next == AppointmentStatus.IN_PROGRESS || next == AppointmentStatus.CANCELLED || next == AppointmentStatus.NO_SHOW;
            case IN_PROGRESS -> next == AppointmentStatus.COMPLETED;
            default -> false;
        };

        if (!valid) {
            throw new RuntimeException(
                    String.format("Không thể chuyển trạng thái từ %s sang %s", current, next));
        }
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
