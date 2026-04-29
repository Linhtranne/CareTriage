import FeatureDetailTemplate from '../../../components/public/FeatureDetailTemplate'

export default function Hospitals() {
  const features = [
    { title: 'Giải phóng sảnh tiếp đón', desc: 'Cắt giảm 70% thời gian tập trung đông người tại quầy làm thủ tục hành chính.' },
    { title: 'Số hóa hạ tầng y tế', desc: 'Dễ dàng tích hợp vào các hệ thống HIS/PACS hiện có của bệnh viện.' },
    { title: 'Phân tích dữ liệu lớn', desc: 'Báo cáo trực quan về lưu lượng bệnh nhân phục vụ việc ra quyết định điều phối.' }
  ]

  return (
    <FeatureDetailTemplate 
      title="Giải pháp cho Bệnh viện lớn"
      category="Giải pháp"
      description="Đơn giản hóa quy trình vận hành cồng kềnh, gia tăng công suất phục vụ và nâng cao chỉ số hài lòng của bệnh nhân tại các cơ sở y tế tuyến đầu."
      features={features}
    />
  )
}
