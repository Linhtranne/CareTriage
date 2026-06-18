package com.caretriage.application.controller;

import com.caretriage.application.dto.request.AppointmentRequest;
import com.caretriage.application.service.ExternalAppointmentService;
import com.caretriage.domain.entity.Appointment;
import com.caretriage.domain.entity.User;
import com.caretriage.domain.entity.external.ExternalDoctorBookingToken;
import com.caretriage.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/external-bookings")
@RequiredArgsConstructor
public class ExternalBookingController {

    private final ExternalAppointmentService externalAppointmentService;
    private final UserRepository userRepository;

    @PostMapping("/appointments")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<Appointment> bookExternalAppointment(
            @RequestBody AppointmentRequest request,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(externalAppointmentService.bookExternalAppointment(userId, request));
    }

    @GetMapping("/{token}")
    public ResponseEntity<ExternalDoctorBookingToken> getBookingToken(@PathVariable String token) {
        return ResponseEntity.ok(externalAppointmentService.getBookingToken(token));
    }

    @PostMapping("/{token}/accept")
    public ResponseEntity<Appointment> acceptBooking(@PathVariable String token) {
        return ResponseEntity.ok(externalAppointmentService.acceptBooking(token));
    }

    @PostMapping("/{token}/reject")
    public ResponseEntity<Appointment> rejectBooking(@PathVariable String token, @RequestParam String reason) {
        return ResponseEntity.ok(externalAppointmentService.rejectBooking(token, reason));
    }

    @PostMapping("/{token}/propose-time")
    public ResponseEntity<Appointment> proposeNewTime(@PathVariable String token, @RequestParam String newTime) {
        return ResponseEntity.ok(externalAppointmentService.proposeNewTime(token, newTime));
    }

    private Long getUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new com.caretriage.shared.exception.ResourceNotFoundException("User not found"));
        return user.getId();
    }
}
