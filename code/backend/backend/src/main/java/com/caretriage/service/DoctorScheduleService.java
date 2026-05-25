package com.caretriage.service;

import com.caretriage.dto.request.DoctorScheduleRequest;
import com.caretriage.dto.response.DoctorScheduleResponse;

import java.util.List;

public interface DoctorScheduleService {

    List<DoctorScheduleResponse> getDoctorSchedules(Long doctorId);

    DoctorScheduleResponse createSchedule(Long doctorId, DoctorScheduleRequest request);

    DoctorScheduleResponse updateSchedule(Long scheduleId, Long doctorId, DoctorScheduleRequest request);

    void deleteSchedule(Long scheduleId, Long doctorId);
}
