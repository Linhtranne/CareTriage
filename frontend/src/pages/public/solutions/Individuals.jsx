import FeatureDetailTemplate from '../../../components/public/FeatureDetailTemplate'

export default function Individuals() {
  const features = [
    { title: 'Sổ khám sức khỏe 24/7', desc: 'Lưu giữ toàn bộ kết quả xét nghiệm, đơn thuốc lịch sử trực quan trên điện thoại.' },
    { title: 'Tự theo dõi triệu chứng', desc: 'Công cụ AI hỗ trợ đánh giá nhanh sức khỏe bất cứ khi nào bạn cảm thấy không ổn.' },
    { title: 'Đặt lịch bác sĩ riêng', desc: 'Dễ dàng tìm kiếm chuyên gia đầu ngành và đặt tư vấn từ xa thuận tiện.' }
  ]

  return (
    <FeatureDetailTemplate 
      title="Giải pháp cho Cá nhân & Gia đình"
      category="Giải pháp"
      description="Người bạn đồng hành thông minh giúp bạn chủ động nắm bắt và quản lý sức khỏe cho bản thân cùng những người thân yêu."
      features={features}
    />
  )
}
