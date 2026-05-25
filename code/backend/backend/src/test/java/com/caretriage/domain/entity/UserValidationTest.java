package com.caretriage.domain.entity;

import com.caretriage.infrastructure.persistence.entity.UserJpaEntity;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class UserValidationTest {

    private static Validator validator;

    @BeforeAll
    public static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    public void testUserValidation_Success() {
        UserJpaEntity user = UserJpaEntity.builder()
                .username("testuser")
                .email("test@example.com")
                .password("hashedpassword")
                .fullName("Test User")
                .deleted(false)
                .build();

        Set<ConstraintViolation<UserJpaEntity>> violations = validator.validate(user);
        assertTrue(violations.isEmpty(), "Should not have violations");
    }

    @Test
    public void testUserValidation_Failure_BlankUsername() {
        UserJpaEntity user = UserJpaEntity.builder()
                .username("")
                .email("test@example.com")
                .password("hashedpassword")
                .fullName("Test User")
                .deleted(false)
                .build();

        Set<ConstraintViolation<UserJpaEntity>> violations = validator.validate(user);
        assertFalse(violations.isEmpty(), "Should have violations");
        assertEquals(1, violations.size());
    }
}
