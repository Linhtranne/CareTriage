package com.caretriage.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminDashboardResponse {
    private long totalUsers;
    private long activeUsers;
    private long totalDoctors;
    private long totalPatients;
    private long totalAppointments;
    private long pendingTriage;
    private Map<String, Long> usersByRole;
    private Map<String, Long> appointmentsByStatus;
    private List<AppointmentTrendPointResponse> recentAppointmentTrend;
    private AdminDashboardOperationalKpisResponse operationalKpis;
}
