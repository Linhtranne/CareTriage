const fs = require('fs');
let content = fs.readFileSync('src/i18n.js', 'utf8');

const newRecords = `      records: {
        title: 'Lịch sử khám bệnh',
        subtitle: 'Xem bản tóm tắt các lần khám và chạm vào một mục để mở chi tiết đầy đủ.',
        view_detail: 'Xem chi tiết',
        search_placeholder: 'Tìm kiếm theo chẩn đoán, bác sĩ hoặc khoa...',
        department_filter: 'Chuyên khoa',
        all_departments: 'Tất cả khoa',
        advanced_filter: 'Lọc nâng cao',
        no_records: 'Bạn chưa có lịch sử khám bệnh nào trên hệ thống',
        book_now: 'Đặt lịch khám ngay',
        detail_title: 'Chi tiết hồ sơ bệnh án',
        record_id: 'Mã hồ sơ',
        general_info: 'Thông tin chung',
        exam_date: 'Ngày khám',
        doctor: 'Bác sĩ',
        department: 'Khoa',
        diagnosis_symptoms: 'Chẩn đoán & Triệu chứng',
        prescription_treatment: 'Đơn thuốc & Điều trị',
        no_prescription: 'Không có đơn thuốc được kê',
        treatment_plan: 'Phác đồ điều trị',
        doctor_notes: 'Dặn dò của bác sĩ',
        follow_up: 'Hẹn tái khám',
        close: 'Đóng',
        print: 'In',
        download_pdf: 'Tải kết quả PDF',
        no_symptoms: 'Không có mô tả triệu chứng',
        attending_doctor: 'Bác sĩ phụ trách',
        fetch_error: 'Lỗi tải dữ liệu',
        not_found: 'Không tìm thấy hồ sơ',
        back: 'Quay lại',
        history_link: 'Lịch sử khám bệnh',
        detail_title_short: 'Chi tiết hồ sơ',
        record_code: 'Mã hồ sơ',
        print_record: 'In hồ sơ',
        doctor_info: 'Thông tin bác sĩ',
        doctor_in_charge: 'Bác sĩ phụ trách',
        follow_up_date: 'Ngày tái khám',
        triage_priority: 'Mức độ ưu tiên',
        need_help: 'Bạn cần hỗ trợ về hồ sơ này?',
        contact_support: 'Liên hệ CSKH',
        diagnosis_symptoms_title: 'Chẩn đoán & Triệu chứng',
        diagnosis_result: 'Kết quả chẩn đoán',
        recorded_symptoms: 'Triệu chứng ghi nhận',
        no_symptoms_recorded: 'Bác sĩ không ghi nhận triệu chứng',
        ai_analysis: 'Phân tích AI',
        prescription_treatment_title: 'Đơn thuốc & Điều trị',
        prescription_details: 'Chi tiết đơn thuốc',
        additional_treatment_plan: 'Phác đồ điều trị bổ sung',
        professional_notes: 'Ghi chú chuyên môn'
      },`;

const regex = /      records: \{\s*title: 'Lịch sử khám bệnh',[\s\S]*?attending_doctor: 'Bác sĩ phụ trách'\s*\},\n/m;

content = content.replace(regex, newRecords + '\n');
fs.writeFileSync('src/i18n.js', content);
console.log('done');
