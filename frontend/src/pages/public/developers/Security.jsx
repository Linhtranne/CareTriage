import FeatureDetailTemplate from '../../../components/public/FeatureDetailTemplate'

export default function Security() {
  const features = [
    { title: 'Mã hóa AES-256', desc: 'Toàn bộ dữ liệu bệnh án được mã hóa đầu cuối tuyệt đối khi lưu trữ và truyền tải.' },
    { title: 'Tuân thủ HIPAA', desc: 'Quy trình kiểm soát truy cập chặt chẽ theo tiêu chuẩn an toàn thông tin y tế.' },
    { title: 'Audit Logs minh bạch', desc: 'Ghi vết toàn bộ lịch sử truy xuất dữ liệu của nhân viên y tế để đối soát.' }
  ]

  return (
    <FeatureDetailTemplate 
      title="Bảo mật dữ liệu & Tin cậy"
      category="Hệ thống"
      description="Đặt quyền riêng tư và an toàn dữ liệu của người bệnh lên ưu tiên hàng đầu bằng các tiêu chuẩn bảo mật cấp độ quân đội."
      features={features}
    />
  )
}
