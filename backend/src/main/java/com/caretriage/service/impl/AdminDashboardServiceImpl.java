package com.caretriage.service.impl;

import com.caretriage.dto.response.AdminDashboardResponse;
import com.caretriage.entity.TriageTicket;
import com.caretriage.repository.*;
import com.caretriage.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final TriageTicketRepository triageTicketRepository;

    @Override
    public AdminDashboardResponse getDashboardStats() {
        log.info("Fetching dashboard statistics...");
        Map<String, Long> usersByRole = new HashMap<>();
        usersByRole.put("ADMIN", userRepository.countByRolesName("ADMIN"));
        usersByRole.put("DOCTOR", userRepository.countByRolesName("DOCTOR"));
        usersByRole.put("PATIENT", userRepository.countByRolesName("PATIENT"));

        long total = userRepository.count();
        log.info("Total users in DB: {}", total);

        return AdminDashboardResponse.builder()
                .totalUsers(total)
                .activeUsers(userRepository.countByIsActive(true))
                .totalDoctors(doctorProfileRepository.count())
                .totalPatients(patientProfileRepository.count())
                .totalAppointments(appointmentRepository.count())
                .pendingTriage(triageTicketRepository.countByStatus(TriageTicket.Status.NEW))
                .usersByRole(usersByRole)
                .build();
    }
}
