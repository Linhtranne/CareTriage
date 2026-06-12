from app.domain.schemas import PolicyResult, TriageResultDetail


class SafetyPolicy:
    @staticmethod
    def get_fallback_response(context_type: str, reason: str = "") -> PolicyResult:
        """
        Generate a safe deterministic fallback based on the failure context.
        context_type: "emergency", "missing_info", "uncertain", "system_error"
        """
        if context_type == "emergency":
            return PolicyResult(
                is_triggered=True,
                reply_msg="Dựa trên các dấu hiệu nghiêm trọng, bạn cần đến khoa Cấp cứu ngay lập tức. Xin vui lòng không tự di chuyển mà hãy gọi 115 hoặc nhờ người nhà đưa đi.",
                triage_result=TriageResultDetail(
                    category_name="Cấp cứu",
                    suggested_department_code="EMERGENCY",
                    suggested_department_name="Cấp cứu",
                    urgency_level="EMERGENCY",
                    confidence_score=1.0,
                    possible_conditions=["Cần đánh giá y tế khẩn cấp"],
                    suggested_actions=["Gọi 115", "Đến phòng khám cấp cứu"],
                    department_mapping_status="RED_FLAG_BYPASS",
                    fallback_reason=reason,
                    clinical_reasoning_summary="Tự động kích hoạt do phát hiện triệu chứng cấp cứu tiềm ẩn.",
                    summary="Bệnh nhân có triệu chứng đe dọa sinh mạng, yêu cầu can thiệp cấp cứu lập tức.",
                    red_flag_detected=True,
                ),
            )
        elif context_type == "missing_info":
            return PolicyResult(
                is_triggered=True,
                reply_msg="Hệ thống chưa đủ thông tin để định hướng. Bạn có thể mô tả chi tiết hơn về thời điểm bắt đầu và mức độ đau/khó chịu được không?",
                triage_result=None,
            )
        elif context_type == "uncertain" or context_type == "system_error":
            return PolicyResult(
                is_triggered=True,
                reply_msg="Dựa trên thông tin hiện tại, hệ thống chưa thể đưa ra gợi ý chuyên khoa chính xác. Bạn nên đặt lịch khám Nội tổng quát để bác sĩ đánh giá trực tiếp.",
                triage_result=TriageResultDetail(
                    category_name="Nội tổng quát",
                    suggested_department_code="GENERAL_INTERNAL_MEDICINE",
                    suggested_department_name="Nội tổng quát",
                    urgency_level="MEDIUM",
                    confidence_score=0.5,
                    possible_conditions=[],
                    suggested_actions=[
                        "Đặt lịch khám Nội tổng quát",
                        "Theo dõi sức khỏe tại nhà",
                    ],
                    department_mapping_status="LOW_CONFIDENCE_FALLBACK",
                    fallback_reason=reason
                    or "Information uncertain or processing error.",
                    clinical_reasoning_summary="Hệ thống tự động chuyển tiếp nội tổng quát do thông tin không đủ độ tin cậy để phân loại.",
                    summary="Cần khám sàng lọc lâm sàng do thiếu dữ kiện cụ thể.",
                    red_flag_detected=False,
                ),
            )

        # Default
        return SafetyPolicy.get_fallback_response("uncertain", reason)
