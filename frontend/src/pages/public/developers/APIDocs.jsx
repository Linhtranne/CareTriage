import FeatureDetailTemplate from '../../../components/public/FeatureDetailTemplate'

export default function APIDocs() {
  const features = [
    { title: 'Chuẩn HL7/FHIR', desc: 'Tuân thủ nghiêm ngặt các giao thức trao đổi dữ liệu y tế toàn cầu.' },
    { title: 'SDK đa nền tảng', desc: 'Hỗ trợ thư viện tích hợp sẵn cho Javascript, Python, Java, C#.' },
    { title: 'Môi trường Sandbox', desc: 'Cung cấp tài khoản thử nghiệm giả lập dữ liệu lâm sàng đa dạng để phát triển.' }
  ]

  return (
    <FeatureDetailTemplate 
      title="Tài liệu kết nối API y tế"
      category="Hệ thống"
      description="Hệ thống API mở mạnh mẽ cho phép các nhà phát triển bên thứ ba tích hợp liền mạch dịch vụ AI Triage vào nền tảng sẵn có."
      features={features}
    />
  )
}
