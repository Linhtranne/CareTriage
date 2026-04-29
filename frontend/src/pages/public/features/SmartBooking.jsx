import FeatureDetailTemplate from '../../../components/public/FeatureDetailTemplate'

export default function SmartBooking() {
  const features = [
    { title: 'Sắp xếp theo độ ưu tiên', desc: 'Tự động đẩy các ca bệnh nặng lên đầu danh sách chờ khám một cách khoa học.' },
    { title: 'Đồng bộ thời gian thực', desc: 'Liên kết trực tiếp lịch biểu của bác sĩ, tránh hiện tượng quá tải cục bộ.' },
    { title: 'Nhắc hẹn tự động', desc: 'Gửi thông báo nhắc lịch khám và chuẩn bị trước xét nghiệm cho bệnh nhân.' }
  ]

  return (
    <FeatureDetailTemplate 
      title="Smart Booking - Lịch khám thông minh"
      category="Sản phẩm"
      description="Giải pháp điều phối thời gian khám bệnh thông minh, loại bỏ hiện tượng xếp hàng mệt mỏi và mang lại sự tiện nghi tối đa cho người bệnh."
      features={features}
    />
  )
}
