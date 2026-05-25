package com.caretriage.application.service;

import com.caretriage.application.dto.response.AdminDashboardResponse;

public interface AdminDashboardService {
    AdminDashboardResponse getDashboardStats(String period);
}
