import FeatureDetailTemplate from '../../../components/public/FeatureDetailTemplate'

export default function Clinics() {
  const features = [
    { title: 'Triển khai thần tốc', desc: 'Không cần cài đặt máy chủ phức tạp, vận hành hoàn toàn trên nền tảng Cloud an toàn.' },
    { title: 'Tiết kiệm nhân lực', desc: 'Tự động hóa quy trình chăm sóc khách hàng và lưu trữ bệnh án tinh gọn.' },
    { title: 'Quản lý doanh thu', desc: 'Theo dõi lịch hẹn, thanh toán viện phí nhanh gọn và minh bạch.' }
  ]

  return (
    <FeatureDetailTemplate 
      title="Giải pháp cho Phòng khám tư"
      category="Giải pháp"
      description="Gói phần mềm tinh gọn giúp nâng tầm trải nghiệm dịch vụ chuyên nghiệp, giữ chân khách hàng trung thành cho các phòng khám tư nhân."
      features={features}
    />
  )
}
