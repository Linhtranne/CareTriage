package com.caretriage.domain.repository;

import com.caretriage.domain.entity.external.ExternalDoctorBookingToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ExternalDoctorBookingTokenRepository extends JpaRepository<ExternalDoctorBookingToken, Long> {
    Optional<ExternalDoctorBookingToken> findByToken(String token);
}
