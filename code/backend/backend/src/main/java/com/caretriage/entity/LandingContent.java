package com.caretriage.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "landing_content")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandingContent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String section; // e.g., "hero", "services", "about"

    @Column(name = "content_key", nullable = false)
    private String contentKey; // e.g., "title", "subtitle", "description"

    @Column(name = "content_value", columnDefinition = "TEXT")
    private String contentValue;

    @Column(nullable = false, length = 10)
    private String language; // "vi", "en"
}
