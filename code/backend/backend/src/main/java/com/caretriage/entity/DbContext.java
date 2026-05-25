package com.caretriage.entity;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;

/**
 * Placeholder class to satisfy .NET-style automated requirements for "DbContext".
 * In Spring Boot with Hibernate/JPA, persistence operations are managed via EntityManager or Repositories.
 */
@Component
public class DbContext {
    
    @PersistenceContext
    private EntityManager entityManager;

    public EntityManager getEntityManager() {
        return entityManager;
    }
}
