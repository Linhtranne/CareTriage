package com.caretriage.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "audit_logs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AuditLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String action;

    @Column(nullable = false, length = 100)
    private String entityName;

    @Column(nullable = false)
    private Long entityId;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(length = 50)
    private String ipAddress;
}
