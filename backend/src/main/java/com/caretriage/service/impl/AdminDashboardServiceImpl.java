package com.caretriage.service.impl;

import com.caretriage.dto.response.AdminDashboardOperationalKpisResponse;
import com.caretriage.dto.response.AdminDashboardResponse;
import com.caretriage.dto.response.AppointmentTrendPointResponse;
import com.caretriage.entity.Appointment;
import com.caretriage.entity.TriageTicket;
import com.caretriage.repository.AppointmentRepository;
import com.caretriage.repository.DoctorProfileRepository;
import com.caretriage.repository.PatientProfileRepository;
import com.caretriage.repository.TriageTicketRepository;
import com.caretriage.repository.UserRepository;
import com.caretriage.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private static final List<String> ROLE_ORDER = List.of(
            "SUPER_ADMIN",
            "ADMIN",
            "CONTENT_ADMIN",
            "DOCTOR",
            "PATIENT"
    );

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final AppointmentRepository appointmentRepository;
    private final TriageTicketRepository triageTicketRepository;

    @Override
    public AdminDashboardResponse getDashboardStats(String period) {
        PeriodWindow window = resolveWindow(period);
        log.info("Fetching dashboard statistics for period {}", window.period());

        Map<String, Long> usersByRole = buildRoleCounts();
        Map<String, Long> appointmentsByStatus = buildStatusCounts(appointmentRepository.countAppointmentsByStatus());

        LocalDate today = LocalDate.now();
        LocalDate recentStartDate = today.minusDays(6);
        List<AppointmentTrendPointResponse> recentAppointmentTrend = buildTrend(
                recentStartDate,
                today,
                indexDateCounts(appointmentRepository.countAppointmentsByDateBetween(recentStartDate, today))
        );

        Map<String, Long> currentStatusCounts = buildStatusCounts(
                appointmentRepository.countAppointmentsByStatusBetween(window.startDate(), window.endDate())
        );
        Map<String, Long> previousStatusCounts = buildStatusCounts(
                appointmentRepository.countAppointmentsByStatusBetween(window.previousStartDate(), window.previousEndDate())
        );

        long currentTotalAppointments = sumCounts(currentStatusCounts);
        long previousTotalAppointments = sumCounts(previousStatusCounts);
        long currentCompletedAppointments = currentStatusCounts.getOrDefault(Appointment.AppointmentStatus.COMPLETED.name(), 0L);
        long currentNoShowAppointments = currentStatusCounts.getOrDefault(Appointment.AppointmentStatus.NO_SHOW.name(), 0L);
        long previousCompletedAppointments = previousStatusCounts.getOrDefault(Appointment.AppointmentStatus.COMPLETED.name(), 0L);
        long previousNoShowAppointments = previousStatusCounts.getOrDefault(Appointment.AppointmentStatus.NO_SHOW.name(), 0L);

        double currentCompletionRate = percentage(currentCompletedAppointments, currentTotalAppointments);
        double currentNoShowRate = percentage(currentNoShowAppointments, currentTotalAppointments);
        double previousCompletionRate = percentage(previousCompletedAppointments, previousTotalAppointments);
        double previousNoShowRate = percentage(previousNoShowAppointments, previousTotalAppointments);
        long pendingTriageNow = triageTicketRepository.countByStatus(TriageTicket.Status.NEW);

        AdminDashboardOperationalKpisResponse operationalKpis = AdminDashboardOperationalKpisResponse.builder()
                .period(window.period())
                .periodLabel(window.periodLabel())
                .comparisonLabel(window.comparisonLabel())
                .startDate(window.startDate())
                .endDate(window.endDate())
                .previousStartDate(window.previousStartDate())
                .previousEndDate(window.previousEndDate())
                .totalAppointments(currentTotalAppointments)
                .completedAppointments(currentCompletedAppointments)
                .noShowAppointments(currentNoShowAppointments)
                .completionRate(currentCompletionRate)
                .noShowRate(currentNoShowRate)
                .pendingTriageNow(pendingTriageNow)
                .deltaAppointments(currentTotalAppointments - previousTotalAppointments)
                .deltaCompletionRate(currentCompletionRate - previousCompletionRate)
                .deltaNoShowRate(currentNoShowRate - previousNoShowRate)
                .appointmentsByStatus(currentStatusCounts)
                .appointmentTrend(buildTrend(
                        window.startDate(),
                        window.endDate(),
                        indexDateCounts(appointmentRepository.countAppointmentsByDateBetween(window.startDate(), window.endDate()))
                ))
                .build();

        return AdminDashboardResponse.builder()
                .totalUsers(userRepository.count())
                .activeUsers(userRepository.countByIsActive(true))
                .totalDoctors(doctorProfileRepository.count())
                .totalPatients(patientProfileRepository.count())
                .totalAppointments(appointmentRepository.count())
                .pendingTriage(pendingTriageNow)
                .usersByRole(usersByRole)
                .appointmentsByStatus(appointmentsByStatus)
                .recentAppointmentTrend(recentAppointmentTrend)
                .operationalKpis(operationalKpis)
                .build();
    }

    private Map<String, Long> buildRoleCounts() {
        Map<String, Long> usersByRole = new LinkedHashMap<>();
        for (String role : ROLE_ORDER) {
            usersByRole.put(role, userRepository.countByRolesName(role));
        }
        return usersByRole;
    }

    private Map<String, Long> buildStatusCounts(List<Object[]> rows) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Appointment.AppointmentStatus status : Appointment.AppointmentStatus.values()) {
            counts.put(status.name(), 0L);
        }

        for (Object[] row : rows) {
            if (row == null || row.length < 2 || row[0] == null) {
                continue;
            }

            String status = String.valueOf(row[0]);
            if (!counts.containsKey(status)) {
                continue;
            }

            long count = row[1] == null ? 0L : ((Number) row[1]).longValue();
            counts.put(status, count);
        }

        return counts;
    }

    private Map<LocalDate, Long> indexDateCounts(List<Object[]> rows) {
        Map<LocalDate, Long> counts = new LinkedHashMap<>();
        for (Object[] row : rows) {
            if (row == null || row.length < 2 || row[0] == null) {
                continue;
            }

            LocalDate date = (LocalDate) row[0];
            long count = row[1] == null ? 0L : ((Number) row[1]).longValue();
            counts.put(date, count);
        }
        return counts;
    }

    private List<AppointmentTrendPointResponse> buildTrend(LocalDate startDate, LocalDate endDate, Map<LocalDate, Long> counts) {
        List<AppointmentTrendPointResponse> trend = new ArrayList<>();
        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            trend.add(AppointmentTrendPointResponse.builder()
                    .date(currentDate)
                    .count(counts.getOrDefault(currentDate, 0L))
                    .build());
            currentDate = currentDate.plusDays(1);
        }
        return trend;
    }

    private long sumCounts(Map<String, Long> counts) {
        long total = 0L;
        for (Long value : counts.values()) {
            total += value == null ? 0L : value;
        }
        return total;
    }

    private double percentage(long numerator, long denominator) {
        if (denominator <= 0L) {
            return 0D;
        }
        return (numerator * 100.0D) / denominator;
    }

    private PeriodWindow resolveWindow(String period) {
        String normalized = period == null ? "7d" : period.trim().toLowerCase(Locale.ROOT);
        int days;
        String periodLabel;
        String comparisonLabel;

        switch (normalized) {
            case "today", "1d" -> {
                days = 1;
                periodLabel = "Hôm nay";
                comparisonLabel = "so với hôm qua";
                normalized = "today";
            }
            case "30d" -> {
                days = 30;
                periodLabel = "30 ngày";
                comparisonLabel = "so với 30 ngày trước";
                normalized = "30d";
            }
            default -> {
                days = 7;
                periodLabel = "7 ngày";
                comparisonLabel = "so với 7 ngày trước";
                normalized = "7d";
            }
        }

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1L);
        LocalDate previousEndDate = startDate.minusDays(1L);
        LocalDate previousStartDate = previousEndDate.minusDays(days - 1L);
        return new PeriodWindow(normalized, periodLabel, comparisonLabel, startDate, endDate, previousStartDate, previousEndDate);
    }

    private static final class PeriodWindow {
        private final String period;
        private final String periodLabel;
        private final String comparisonLabel;
        private final LocalDate startDate;
        private final LocalDate endDate;
        private final LocalDate previousStartDate;
        private final LocalDate previousEndDate;

        private PeriodWindow(String period,
                             String periodLabel,
                             String comparisonLabel,
                             LocalDate startDate,
                             LocalDate endDate,
                             LocalDate previousStartDate,
                             LocalDate previousEndDate) {
            this.period = period;
            this.periodLabel = periodLabel;
            this.comparisonLabel = comparisonLabel;
            this.startDate = startDate;
            this.endDate = endDate;
            this.previousStartDate = previousStartDate;
            this.previousEndDate = previousEndDate;
        }

        private String period() {
            return period;
        }

        private String periodLabel() {
            return periodLabel;
        }

        private String comparisonLabel() {
            return comparisonLabel;
        }

        private LocalDate startDate() {
            return startDate;
        }

        private LocalDate endDate() {
            return endDate;
        }

        private LocalDate previousStartDate() {
            return previousStartDate;
        }

        private LocalDate previousEndDate() {
            return previousEndDate;
        }
    }
}
