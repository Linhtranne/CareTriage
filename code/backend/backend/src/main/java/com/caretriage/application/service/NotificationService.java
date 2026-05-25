package com.caretriage.application.service;

import com.caretriage.application.dto.response.NotificationResponse;
import com.caretriage.domain.entity.Notification;

import java.util.List;

public interface NotificationService {
    long getUnreadCount(Long userId);
    List<NotificationResponse> getRecentNotifications(Long userId, int limit);
    void markAsRead(Long userId, Long notificationId);
    void markAllAsRead(Long userId);
    void createNotification(Long userId, String title, String message, Notification.NotificationType type, Long referenceId, String referenceType);
}
