package com.caretriage.config;

import com.caretriage.entity.Role;
import com.caretriage.entity.User;
import com.caretriage.repository.RoleRepository;
import com.caretriage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // 1. Initialize Roles if not present
        Role patientRole = getOrCreateRole("PATIENT", "Default Patient role");
        Role doctorRole = getOrCreateRole("DOCTOR", "Default Doctor role");
        Role adminRole = getOrCreateRole("ADMIN", "Default Admin role");

        // 2. Initialize Users if not present
        getOrCreateUser("admin@caretriage.com", "admin", "Admin User", "Password123@", Set.of(adminRole));
        getOrCreateUser("doctor@caretriage.com", "doctor", "Doctor User", "Password123@", Set.of(doctorRole));
        getOrCreateUser("patient@caretriage.com", "patient", "Patient User", "Password123@", Set.of(patientRole));
    }

    private Role getOrCreateRole(String name, String description) {
        return roleRepository.findByName(name)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(name)
                        .description(description)
                        .deleted(false)
                        .build()));
    }

    private void getOrCreateUser(String email, String username, String fullName, String plainPassword, Set<Role> roles) {
        if (!userRepository.existsByEmail(email)) {
            User user = User.builder()
                    .email(email)
                    .username(username)
                    .fullName(fullName)
                    .password(passwordEncoder.encode(plainPassword))
                    .roles(roles)
                    .isActive(true)
                    .deleted(false)
                    .build();
            userRepository.save(user);
        }
    }
}
