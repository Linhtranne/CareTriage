package com.caretriage.domain.entity;

import com.caretriage.infrastructure.persistence.entity.UserJpaEntity;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UserEntityTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void whenAllFieldsCorrect_thenNoViolations() {
        UserJpaEntity user = UserJpaEntity.builder()
                .username("testuser")
                .email("test@example.com")
                .password("password123")
                .fullName("Test User")
                .isActive(true)
                .deleted(false)
                .build();

        Set<ConstraintViolation<UserJpaEntity>> violations = validator.validate(user);
        assertTrue(violations.isEmpty());
    }

    @Test
    void whenEmailInvalid_thenViolations() {
        UserJpaEntity user = UserJpaEntity.builder()
                .username("testuser")
                .email("invalid-email")
                .password("password123")
                .fullName("Test User")
                .build();

        Set<ConstraintViolation<UserJpaEntity>> violations = validator.validate(user);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().equals("Email should be valid")));
    }

    @Test
    void whenUsernameBlank_thenViolations() {
        UserJpaEntity user = UserJpaEntity.builder()
                .username("")
                .email("test@example.com")
                .password("password123")
                .fullName("Test User")
                .build();

        Set<ConstraintViolation<UserJpaEntity>> violations = validator.validate(user);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().equals("Username is required")));
    }
}
