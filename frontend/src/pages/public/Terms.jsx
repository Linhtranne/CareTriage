import FeatureDetailTemplate from '../../components/public/FeatureDetailTemplate'

export default function Terms() {
  const clauses = [
    { title: 'Bảo mật Dữ liệu', desc: 'Cam kết bảo vệ toàn vẹn hồ sơ bệnh án y tế tuân thủ nghiêm ngặt chuẩn mã hóa HIPAA.' },
    { title: 'Phạm vi Dịch vụ', desc: 'Hệ thống hỗ trợ định hướng và tối ưu hóa quy trình, không thay thế chẩn đoán trực tiếp của bác sĩ.' },
    { title: 'Quyền lợi Người dùng', desc: 'Bệnh nhân hoàn toàn làm chủ dữ liệu của mình, có quyền truy xuất hoặc yêu cầu xóa vĩnh viễn.' }
  ]

  return (
    <FeatureDetailTemplate 
      title="Điều khoản & Dịch vụ"
      category="Hệ thống"
      description="Văn bản quy định chi tiết về quyền hạn, nghĩa vụ và cam kết an toàn bảo mật giữa người dùng và nền tảng CareTriage."
      features={clauses}
    />
  )
}
