import FeatureDetailTemplate from '../../../components/public/FeatureDetailTemplate'

export default function AITriage() {
  const features = [
    { title: 'Tự động phân nhóm', desc: 'Dựa vào triệu chứng mô tả, AI dự đoán chính xác chuyên khoa bệnh lý cần tiếp nhận.' },
    { title: 'Cảnh báo khẩn cấp', desc: 'Phát hiện sớm các dấu hiệu sinh tồn nguy hiểm để ưu tiên xử lý cấp cứu ngay lập tức.' },
    { title: 'Định hướng chuyên sâu', desc: 'Gợi ý danh mục xét nghiệm cơ bản phù hợp để chuẩn bị hồ sơ trước khi gặp bác sĩ.' }
  ]

  return (
    <FeatureDetailTemplate 
      title="AI Triage - Sơ chẩn & Phân luồng"
      category="Sản phẩm"
      description="Hệ thống trợ lý trí tuệ nhân tạo tiếp nhận bệnh nhân 24/7, đánh giá rủi ro y tế ban đầu và chuyển hồ sơ tới đúng chuyên khoa một cách nhanh chóng và chính xác nhất."
      features={features}
    />
  )
}
