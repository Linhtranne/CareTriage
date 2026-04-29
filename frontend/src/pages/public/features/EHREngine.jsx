import FeatureDetailTemplate from '../../../components/public/FeatureDetailTemplate'

export default function EHREngine() {
  const features = [
    { title: 'Trích xuất NER', desc: 'Nhận diện tên thuốc, liều lượng và thuật ngữ lâm sàng từ văn bản tự do.' },
    { title: 'Chuẩn hóa dữ liệu', desc: 'Quy đổi toàn bộ bệnh án sang chuẩn quốc tế HL7/FHIR tiện cho việc lưu trữ.' },
    { title: 'Tra cứu thông minh', desc: 'Dễ dàng tổng hợp tiến trình điều trị trong nhiều năm của bệnh nhân chỉ qua 1 click.' }
  ]

  return (
    <FeatureDetailTemplate 
      title="EHR Engine - Quản lý bệnh án điện tử"
      category="Sản phẩm"
      description="Trình phân tích và cấu trúc hóa các ghi chép y khoa phức tạp thành dữ liệu bệnh án điện tử sạch, tối ưu hóa 90% thời gian nhập liệu thủ công."
      features={features}
    />
  )
}
