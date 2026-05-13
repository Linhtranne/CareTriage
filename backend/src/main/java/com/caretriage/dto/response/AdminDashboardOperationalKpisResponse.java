package com.caretriage.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminDashboardOperationalKpisResponse {
    private String period;
    private String periodLabel;
    private String comparisonLabel;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate previousStartDate;
    private LocalDate previousEndDate;
    private long totalAppointments;
    private long completedAppointments;
    private long noShowAppointments;
    private double completionRate;
    private double noShowRate;
    private long pendingTriageNow;
    private long deltaAppointments;
    private double deltaCompletionRate;
    private double deltaNoShowRate;
    private Map<String, Long> appointmentsByStatus;
    private List<AppointmentTrendPointResponse> appointmentTrend;
}
