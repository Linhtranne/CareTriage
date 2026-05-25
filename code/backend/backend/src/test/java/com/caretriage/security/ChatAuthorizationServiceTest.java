package com.caretriage.security;

import com.caretriage.entity.ChatSession;
import com.caretriage.entity.TriageTicket;
import com.caretriage.entity.User;
import com.caretriage.repository.ChatSessionRepository;
import com.caretriage.repository.TriageTicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatAuthorizationServiceTest {

    @Mock
    private ChatSessionRepository chatSessionRepository;

    @Mock
    private TriageTicketRepository triageTicketRepository;

    @InjectMocks
    private ChatAuthorizationService chatAuthorizationService;

    private Authentication patientAuth;
    private Authentication doctorAuth;
    private Authentication adminAuth;

    @BeforeEach
    void setUp() {
        patientAuth = new UsernamePasswordAuthenticationToken(
                "patient@example.com", 
                null, 
                List.of(new SimpleGrantedAuthority("ROLE_PATIENT"))
        );
        doctorAuth = new UsernamePasswordAuthenticationToken(
                "doctor@example.com", 
                null, 
                List.of(new SimpleGrantedAuthority("ROLE_DOCTOR"))
        );
        adminAuth = new UsernamePasswordAuthenticationToken(
                "admin@example.com", 
                null, 
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }

    @Test
    void testCanAccessSession_AdminHasAccess() {
        assertTrue(chatAuthorizationService.canAccessSession(adminAuth, 123L));
        verifyNoInteractions(chatSessionRepository);
        verifyNoInteractions(triageTicketRepository);
    }

    @Test
    void testCanAccessSession_DoctorNoTicketsDenied() {
        when(triageTicketRepository.findByChatSessionId(123L)).thenReturn(Collections.emptyList());

        assertFalse(chatAuthorizationService.canAccessSession(doctorAuth, 123L));
        verify(triageTicketRepository, times(1)).findByChatSessionId(123L);
    }

    @Test
    void testCanAccessSession_DoctorUnassignedTicketAllowed() {
        TriageTicket ticket = new TriageTicket();
        ticket.setTriageOfficer(null); // Unassigned

        when(triageTicketRepository.findByChatSessionId(123L)).thenReturn(List.of(ticket));

        assertTrue(chatAuthorizationService.canAccessSession(doctorAuth, 123L));
    }

    @Test
    void testCanAccessSession_DoctorAssignedTicketAllowed() {
        User doctor = new User();
        doctor.setEmail("doctor@example.com");

        TriageTicket ticket = new TriageTicket();
        ticket.setTriageOfficer(doctor); // Assigned to this doctor

        when(triageTicketRepository.findByChatSessionId(123L)).thenReturn(List.of(ticket));

        assertTrue(chatAuthorizationService.canAccessSession(doctorAuth, 123L));
    }

    @Test
    void testCanAccessSession_DoctorAssignedToOtherDenied() {
        User otherDoctor = new User();
        otherDoctor.setEmail("other_doctor@example.com");

        TriageTicket ticket = new TriageTicket();
        ticket.setTriageOfficer(otherDoctor); // Assigned to another doctor

        when(triageTicketRepository.findByChatSessionId(123L)).thenReturn(List.of(ticket));

        assertFalse(chatAuthorizationService.canAccessSession(doctorAuth, 123L));
    }

    @Test
    void testCanAccessSession_PatientOwnsSession() {
        ChatSession session = new ChatSession();
        User user = new User();
        user.setEmail("patient@example.com");
        session.setUser(user);

        when(chatSessionRepository.findById(123L)).thenReturn(Optional.of(session));

        assertTrue(chatAuthorizationService.canAccessSession(patientAuth, 123L));
        verify(chatSessionRepository, times(1)).findById(123L);
    }

    @Test
    void testCanAccessSession_PatientDoesNotOwnSession() {
        ChatSession session = new ChatSession();
        User user = new User();
        user.setEmail("other_patient@example.com");
        session.setUser(user);

        when(chatSessionRepository.findById(123L)).thenReturn(Optional.of(session));

        assertFalse(chatAuthorizationService.canAccessSession(patientAuth, 123L));
        verify(chatSessionRepository, times(1)).findById(123L);
    }

    @Test
    void testCanAccessSession_SessionNotFound() {
        when(chatSessionRepository.findById(123L)).thenReturn(Optional.empty());

        assertFalse(chatAuthorizationService.canAccessSession(patientAuth, 123L));
    }

    @Test
    void testCanSubscribeToDestination_ChatTopic_Success() {
        ChatSession session = new ChatSession();
        User user = new User();
        user.setEmail("patient@example.com");
        session.setUser(user);

        when(chatSessionRepository.findById(123L)).thenReturn(Optional.of(session));

        assertTrue(chatAuthorizationService.canSubscribeToDestination(patientAuth, "/topic/chat/123"));
    }

    @Test
    void testCanSubscribeToDestination_ChatTopic_Denied() {
        ChatSession session = new ChatSession();
        User user = new User();
        user.setEmail("other_patient@example.com");
        session.setUser(user);

        when(chatSessionRepository.findById(123L)).thenReturn(Optional.of(session));

        assertFalse(chatAuthorizationService.canSubscribeToDestination(patientAuth, "/topic/chat/123"));
    }

    @Test
    void testCanSubscribeToDestination_UserQueue_Allowed() {
        assertTrue(chatAuthorizationService.canSubscribeToDestination(patientAuth, "/user/queue/errors"));
        assertTrue(chatAuthorizationService.canSubscribeToDestination(patientAuth, "/queue/errors"));
    }

    @Test
    void testCanSubscribeToDestination_InvalidFormat() {
        assertFalse(chatAuthorizationService.canSubscribeToDestination(patientAuth, "/topic/chat/invalid_id"));
        assertFalse(chatAuthorizationService.canSubscribeToDestination(patientAuth, "/topic/random"));
    }
}
