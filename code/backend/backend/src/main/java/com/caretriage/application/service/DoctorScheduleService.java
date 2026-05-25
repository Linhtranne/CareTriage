package com.caretriage.application.service;

import com.caretriage.application.dto.request.DoctorScheduleRequest;
import com.caretriage.application.dto.response.DoctorScheduleResponse;

import java.util.List;

public interface DoctorScheduleService {

    List<DoctorScheduleResponse> getDoctorSchedules(Long doctorId);

    DoctorScheduleResponse createSchedule(Long doctorId, DoctorScheduleRequest request);

    DoctorScheduleResponse updateSchedule(Long scheduleId, Long doctorId, DoctorScheduleRequest request);

    void deleteSchedule(Long scheduleId, Long doctorId);
}
