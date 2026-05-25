package com.caretriage.infrastructure.security;

import com.caretriage.domain.entity.ClinicalNote;
import com.caretriage.domain.entity.User;
import com.caretriage.domain.repository.ClinicalNoteRepository;
import com.caretriage.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("userSecurity")
@RequiredArgsConstructor
public class UserSecurity {

    private final UserRepository userRepository;
    private final ClinicalNoteRepository clinicalNoteRepository;

    public boolean isPatient(Long patientId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(user -> user.getId().equals(patientId))
                .orElse(false);
    }

    public boolean isPatientOwnerOfNote(Long noteId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(user -> {
                    Optional<ClinicalNote> noteOpt = clinicalNoteRepository.findById(noteId);
                    return noteOpt.isPresent() && noteOpt.get().getPatient().getId().equals(user.getId());
                })
                .orElse(false);
    }
}
