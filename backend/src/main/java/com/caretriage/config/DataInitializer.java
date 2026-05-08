package com.caretriage.config;

import com.caretriage.entity.Role;
import com.caretriage.entity.User;
import com.caretriage.repository.RoleRepository;
import com.caretriage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Starting data initialization...");
        // 1. Initialize Roles if not present
        Role patientRole = getOrCreateRole("PATIENT", "Default Patient role");
        Role doctorRole = getOrCreateRole("DOCTOR", "Default Doctor role");
        Role adminRole = getOrCreateRole("ADMIN", "Default Admin role");

        // 2. Initialize Users if not present
        getOrCreateUser("admin@caretriage.com", "admin", "Admin User", "Password123@", Set.of(adminRole));
        getOrCreateUser("doctor@caretriage.com", "doctor", "Doctor User", "Password123@", Set.of(doctorRole));
        getOrCreateUser("patient@caretriage.com", "patient", "Patient User", "Password123@", Set.of(patientRole));
        log.info("Data initialization completed.");
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
            log.info("Created seed user: {}", email);
        } else {
            log.info("Seed user already exists: {}", email);
        }
    }
}
