package com.caretriage.infrastructure.security;

import com.caretriage.domain.entity.TriageTicket;
import com.caretriage.domain.repository.ChatSessionRepository;
import com.caretriage.domain.repository.TriageTicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatAuthorizationService {

    private final ChatSessionRepository chatSessionRepository;
    private final TriageTicketRepository triageTicketRepository;

    /**
     * Checks if the authenticated user has access to the specified chat session.
     * Access is granted if:
     * - The user is an Admin/Super Admin (global access)
     * - The user is a Doctor who is assigned to this session's ticket OR the ticket is unassigned (available to view/claim)
     * - The user owns the chat session
     */
    public boolean canAccessSession(Authentication authentication, Long sessionId) {
        if (authentication == null || sessionId == null) {
            return false;
        }

        if (isAdmin(authentication)) {
            log.debug("User {} authorized as Admin/Super Admin for session {}", authentication.getName(), sessionId);
            return true;
        }

        if (isDoctor(authentication)) {
            return canDoctorAccessSession(authentication, sessionId);
        }

        return canPatientAccessSession(authentication, sessionId);
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") 
                            || a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }

    private boolean isDoctor(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR"));
    }

    private boolean canDoctorAccessSession(Authentication authentication, Long sessionId) {
        List<TriageTicket> tickets = triageTicketRepository.findByChatSessionId(sessionId);
        if (tickets.isEmpty()) {
            log.warn("Access denied: Doctor {} attempted to access session {} with no associated triage ticket", 
                    authentication.getName(), sessionId);
            return false;
        }

        for (TriageTicket ticket : tickets) {
            if (ticket.getTriageOfficer() == null || ticket.getTriageOfficer().getEmail().equalsIgnoreCase(authentication.getName())) {
                log.debug("User {} authorized as Doctor for ticket {} in session {}", 
                        authentication.getName(), ticket.getId(), sessionId);
                return true;
            }
        }

        log.warn("Access denied: Doctor {} is not assigned to any ticket for session {}", 
                authentication.getName(), sessionId);
        return false;
    }

    private boolean canPatientAccessSession(Authentication authentication, Long sessionId) {
        boolean isOwner = chatSessionRepository.findById(sessionId)
                .map(session -> session.getUser().getEmail().equalsIgnoreCase(authentication.getName()))
                .orElse(false);

        if (!isOwner) {
            log.warn("Access denied: User {} does not own chat session {}", authentication.getName(), sessionId);
        } else {
            log.debug("User {} authorized as owner of session {}", authentication.getName(), sessionId);
        }

        return isOwner;
    }

    /**
     * Checks if the authenticated user is authorized to subscribe to the given destination.
     */
    public boolean canSubscribeToDestination(Authentication authentication, String destination) {
        if (destination == null) {
            return false;
        }

        // Subscribing to a specific chat session topic
        if (destination.startsWith("/topic/chat/")) {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("^/topic/chat/(\\d+)$");
            java.util.regex.Matcher matcher = pattern.matcher(destination);
            if (!matcher.matches()) {
                log.warn("Invalid destination pattern subscription attempt: {}", destination);
                return false;
            }
            try {
                Long sessionId = Long.parseLong(matcher.group(1));
                return canAccessSession(authentication, sessionId);
            } catch (NumberFormatException e) {
                log.warn("Invalid session ID format in destination: {}", destination);
                return false;
            }
        }

        // Allow private user-specific queues (routed securely by Spring)
        if (destination.startsWith("/user/queue/") || destination.startsWith("/queue/")) {
            return true;
        }

        log.warn("Unauthorized destination subscription attempt: {}", destination);
        return false;
    }
}
