import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: {
        login: 'Log In',
        register: 'Sign Up',
        logout: 'Log Out'
      },
      hero: {
        title: 'Smart Medical Platform',
        subtitle: 'Standardize Workflows',
        description: 'Optimize patient triage and clinical note extraction powered by advanced AI models.',
        action: 'Try It Now'
      },
      triage: {
        title: 'AI Triage & Routing System',
        description: 'Interactive communication layer optimizing preliminary consultations accurately in minutes.',
        step1: 'Conversational',
        step1_desc: 'Natural language health dialogues.',
        step2: 'Risk Evaluation',
        step2_desc: 'Instant severity analysis.',
        step3: 'Specialty Routing',
        step3_desc: 'Automated record distribution.',
        chat_patient1: 'Hello AI, I feel a sharp pain in my upper stomach.',
        chat_ai1: 'AI System Recorded: Upper stomach pain. Please specify: does this occur after eating or while fasting?',
        chat_patient2: 'Usually sharp pain immediately after meals.',
        chat_ai2: 'Diagnostic Recommendation: Gastritis / Acid Reflux. Specialty Suggested: Gastroenterology'
      },
      ehr: {
        title: 'EHR Data Extraction Engine',
        description: 'Automated capture pipelines converting unstructured clinical metrics safely.',
        ner: 'NER Detection',
        ner_desc: 'Auto-extract prescriptions, dosages, pathology.',
        format: 'Multi-format',
        format_desc: 'Accepts PDF, Word, hard copy scanning.',
        struct: 'Structured API',
        struct_desc: 'Convert paragraphs into tabular structures.',
        security: 'HIPAA Security',
        security_desc: 'Robust credential safety protocols.',
        nlp: 'High Accuracy',
        nlp_desc: 'Domain trained biomedical algorithms.',
        action: 'Start Experience'
      },
      problems: {
        wait: 'Prolonged Waiting Hours',
        wait_desc: 'Average patients spend 2-4 hours queueing up just for initial department navigation.',
        specialty: 'Specialty Misdirection',
        specialty_desc: 'Over 30% of initial patient check-ins select invalid clinical paths.',
        triage247: '24/7 Automated Triage',
        triage247_desc: 'Immediate risk scoring based on symptom inputs.',
        ehr_sync: 'Automated EHR Sync',
        ehr_sync_desc: 'Convert diagnostic notes to HL7 structures in one second.'
      }
    }
  },
  vi: {
    translation: {
      nav: {
        login: 'Đăng nhập',
        register: 'Đăng ký',
        logout: 'Đăng xuất'
      },
      hero: {
        title: 'Nền Tảng Y Tế Thông Minh',
        subtitle: 'Chuẩn Hóa Quy Trình',
        description: 'Tối ưu hóa quá trình phân luồng bệnh nhân và trích xuất bệnh án bằng trí tuệ nhân tạo.',
        action: 'Thử nghiệm ngay'
      },
      triage: {
        title: 'Hệ Thống Sơ Chẩn & Phân Luồng',
        description: 'Tương tác trực quan để xác định chính xác vấn đề sức khỏe của bạn chỉ trong vài phút.',
        step1: 'Đàm thoại',
        step1_desc: 'Hỏi đáp triệu chứng ngôn ngữ tự nhiên.',
        step2: 'Định vị rủi ro',
        step2_desc: 'Đánh giá mức độ khẩn cấp.',
        step3: 'Gửi chuyên khoa',
        step3_desc: 'Tự động điều phối hồ sơ.',
        chat_patient1: 'Chào AI, tôi bị đau tức vùng thượng vị.',
        chat_ai1: 'Hệ thống AI ghi nhận: Đau tức vùng thượng vị. Hãy cho biết: Cơn đau xuất hiện sau khi ăn hay lúc đói?',
        chat_patient2: 'Thường đau dữ dội sau bữa ăn.',
        chat_ai2: '✨ Khuyến nghị Chẩn đoán: Triệu chứng liên quan: Đau dạ dày / Trào ngược. Chuyên khoa đề xuất: Khoa Tiêu Hóa'
      },
      ehr: {
        title: 'Hệ Thống Trích Xuất Dữ Liệu Bệnh Án',
        description: 'Tự động hóa quy trình thu thập và lưu trữ thông tin chuyên sâu.',
        ner: 'Nhận diện NER',
        ner_desc: 'Tự động bóc tách Tên thuốc, Liều lượng, Triệu chứng, Bệnh lý.',
        format: 'Đa định dạng',
        format_desc: 'Đọc hiểu linh hoạt từ file PDF, Word cho tới văn bản ghi chú.',
        struct: 'Cấu trúc hóa',
        struct_desc: 'Chuyển dữ liệu phi cấu trúc thành bảng biểu chuẩn chỉnh.',
        security: 'Bảo mật HIPAA',
        security_desc: 'Mã hóa dữ liệu bệnh nhân tuyệt đối an toàn.',
        nlp: 'Độ chính xác cao',
        nlp_desc: 'Sử dụng mô hình NLP chuyên sâu cho ngành Y.',
        action: 'Bắt đầu trải nghiệm'
      },
      problems: {
        wait: 'Thời gian chờ đợi kéo dài',
        wait_desc: 'Bệnh nhân trung bình mất 2-4 tiếng xếp hàng tại quầy tiếp đón chỉ để hỏi thông tin phân luồng ban đầu.',
        specialty: 'Sai sót định hướng chuyên khoa',
        specialty_desc: 'Hơn 30% người bệnh chọn sai chuyên khoa trong lần khám đầu tiên, làm chậm trễ quy trình cấp cứu.',
        triage247: 'Sơ chẩn Tự Động 24/7',
        triage247_desc: 'AI tiếp nhận & đánh giá rủi ro tức thì thông qua mô tả triệu chứng thông minh.',
        ehr_sync: 'Số hóa EHR Tự Động',
        ehr_sync_desc: 'Quy đổi toàn bộ ghi chép lâm sàng sang bảng mã HL7 tiêu chuẩn chỉ sau 1 giây.'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
