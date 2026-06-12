package com.caretriage.application.ai.service;

import com.caretriage.application.ai.model.PolicyResult;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class RedFlagDetectorTest {

    @Test
    public void detectRedFlags_Triggers() {
        PolicyResult result = RedFlagDetector.detectRedFlags("tôi bị mất thị lực đột ngột");
        assertThat(result).isNotNull();
        assertThat(result.isTriggered()).isTrue();
        assertThat(result.getTriageResult().getUrgencyLevel()).isEqualTo("EMERGENCY");
        assertThat(result.getTriageResult().getSuggestedDepartmentName().toLowerCase()).contains("cấp cứu");
    }

    @Test
    public void detectRedFlags_Negated() {
        PolicyResult result = RedFlagDetector.detectRedFlags("tôi không bị đau ngực dữ dội");
        assertThat(result).isNull();
    }

    @Test
    public void detectRedFlags_ChestPainRadiatingLeftArm() {
        PolicyResult result = RedFlagDetector.detectRedFlags(
            "Tôi bị đau tức ngực dữ dội lan ra cánh tay trái, khó thở và toát mồ hôi lạnh."
        );
        assertThat(result).isNotNull();
        assertThat(result.isTriggered()).isTrue();
        assertThat(result.getTriageResult().getSuggestedDepartmentCode()).isEqualTo("EMERGENCY");
        assertThat(result.getTriageResult().getUrgencyLevel()).isEqualTo("EMERGENCY");
    }

    @Test
    public void detectRedFlags_NoFlags() {
        PolicyResult result = RedFlagDetector.detectRedFlags("tôi bị ngứa ngoài da và nổi mẩn đỏ");
        assertThat(result).isNull();
    }
}
