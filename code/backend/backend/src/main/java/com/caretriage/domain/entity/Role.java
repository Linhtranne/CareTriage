package com.caretriage.domain.entity;

import lombok.*;
import java.util.HashSet;
import java.util.Set;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Role {
    private Long id;
    private String name;
    private String description;
    @Builder.Default private Boolean deleted = false;
    @Builder.Default private Set<User> users = new HashSet<>();
}
