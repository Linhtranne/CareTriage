package com.caretriage.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.Set;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DoctorDepartmentRequest {
    @NotEmpty(message = "Danh sách ID chuyên khoa không được để trống")
    private Set<Long> departmentIds;
}
