package com.caretriage.service.impl;

import com.caretriage.dto.request.DoctorScheduleRequest;
import com.caretriage.dto.response.DoctorScheduleResponse;
import com.caretriage.entity.DoctorSchedule;
import com.caretriage.entity.User;
import com.caretriage.exception.ResourceNotFoundException;
import com.caretriage.repository.DoctorScheduleRepository;
import com.caretriage.repository.UserRepository;
import com.caretriage.service.DoctorScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorScheduleServiceImpl implements DoctorScheduleService {

    private final DoctorScheduleRepository scheduleRepository;
    private final UserRepository userRepository;

    @Override
    public List<DoctorScheduleResponse> getDoctorSchedules(Long doctorId) {
        List<DoctorSchedule> schedules = scheduleRepository.findByDoctorIdAndIsActiveTrue(doctorId);
        return schedules.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DoctorScheduleResponse createSchedule(Long doctorId, DoctorScheduleRequest request) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bác sĩ"));

        // Validate time range
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new RuntimeException("Giờ bắt đầu phải trước giờ kết thúc");
        }

        // Check for overlapping schedules on the same day
        List<DoctorSchedule> existing = scheduleRepository
                .findByDoctorIdAndDayOfWeekAndIsActiveTrue(doctorId, request.getDayOfWeek());

        boolean hasOverlap = existing.stream().anyMatch(s ->
                request.getStartTime().isBefore(s.getEndTime())
                        && request.getEndTime().isAfter(s.getStartTime()));

        if (hasOverlap) {
            throw new RuntimeException("Lịch làm việc bị trùng với ca khác vào " + request.getDayOfWeek());
        }

        DoctorSchedule schedule = DoctorSchedule.builder()
                .doctor(doctor)
                .dayOfWeek(request.getDayOfWeek())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .isActive(true)
                .build();

        DoctorSchedule saved = scheduleRepository.save(schedule);
        log.info("Schedule created: Doctor={}, Day={}, {}-{}",
                doctor.getFullName(), request.getDayOfWeek(), request.getStartTime(), request.getEndTime());

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public DoctorScheduleResponse updateSchedule(Long scheduleId, Long doctorId, DoctorScheduleRequest request) {
        DoctorSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch làm việc"));

        if (!schedule.getDoctor().getId().equals(doctorId)) {
            throw new RuntimeException("Bạn không có quyền sửa lịch này");
        }

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new RuntimeException("Giờ bắt đầu phải trước giờ kết thúc");
        }

        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());

        DoctorSchedule saved = scheduleRepository.save(schedule);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteSchedule(Long scheduleId, Long doctorId) {
        DoctorSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch làm việc"));

        if (!schedule.getDoctor().getId().equals(doctorId)) {
            throw new RuntimeException("Bạn không có quyền xóa lịch này");
        }

        // Soft delete by deactivating
        schedule.setIsActive(false);
        scheduleRepository.save(schedule);
        log.info("Schedule deactivated: ID={}", scheduleId);
    }

    private DoctorScheduleResponse mapToResponse(DoctorSchedule schedule) {
        return DoctorScheduleResponse.builder()
                .id(schedule.getId())
                .doctorId(schedule.getDoctor().getId())
                .doctorName(schedule.getDoctor().getFullName())
                .dayOfWeek(schedule.getDayOfWeek())
                .startTime(schedule.getStartTime())
                .endTime(schedule.getEndTime())
                .isActive(schedule.getIsActive())
                .build();
    }
}
