package com.caretriage.domain.entity;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import com.caretriage.infrastructure.persistence.entity.UserJpaEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class TriageTicketValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void shouldPassValidationWithRequiredFields() {
        TriageTicket ticket = TriageTicket.builder()
                .ticketNumber("TT-0001")
                .title("Cannot login")
                .description("User cannot login after password reset")
                .status(TriageTicket.Status.NEW)
                .priority(TriageTicket.Priority.HIGH)
                .severity(TriageTicket.Severity.MAJOR)
                .requester(UserJpaEntity.builder()
                        .id(1L)
                        .username("requester")
                        .email("requester@test.com")
                        .password("hashed_password")
                        .fullName("Requester")
                        .build())
                .build();

        Set<ConstraintViolation<TriageTicket>> violations = validator.validate(ticket);
        assertThat(violations).isEmpty();
    }

    @Test
    void shouldFailValidationWhenRequiredFieldsMissing() {
        TriageTicket ticket = TriageTicket.builder().build();

        Set<ConstraintViolation<TriageTicket>> violations = validator.validate(ticket);

        assertThat(violations).extracting(ConstraintViolation::getPropertyPath)
                .extracting(Object::toString)
                .contains("ticketNumber", "title", "description", "requester");
    }
}
