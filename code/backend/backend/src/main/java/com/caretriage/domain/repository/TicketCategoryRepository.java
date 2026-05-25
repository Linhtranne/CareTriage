package com.caretriage.domain.repository;

import com.caretriage.domain.entity.TicketCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TicketCategoryRepository extends JpaRepository<TicketCategory, Long> {

    Optional<TicketCategory> findByCode(String code);

    Optional<TicketCategory> findByName(String name);
}
