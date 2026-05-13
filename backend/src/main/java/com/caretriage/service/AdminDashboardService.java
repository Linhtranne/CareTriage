package com.caretriage.service;

import com.caretriage.dto.response.AdminDashboardResponse;

public interface AdminDashboardService {
    AdminDashboardResponse getDashboardStats(String period);
}
