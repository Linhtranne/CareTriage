package com.caretriage.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "departments", indexes = {
    @Index(name = "idx_dept_code", columnList = "code"),
    @Index(name = "idx_dept_name", columnList = "name"),
    @Index(name = "idx_dept_slug", columnList = "slug")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Department extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Department code is required")
    @Size(max = 20, message = "Department code must not exceed 20 characters")
    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @NotBlank(message = "Department name is required")
    @Size(max = 100, message = "Department name must not exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Department slug is required")
    @Size(max = 120, message = "Department slug must not exceed 120 characters")
    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DepartmentStatus status = DepartmentStatus.ACTIVE;

    @ManyToMany(mappedBy = "departments")
    @Builder.Default
    private Set<DoctorProfile> doctors = new HashSet<>();
}
