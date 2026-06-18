import type { MedicineUnit } from '../types/create-medical-record'

export const CREATE_MEDICAL_RECORD_COPY = {
  fallbackPatientName: 'Bệnh nhân',
  subtitle: 'Lập hồ sơ bệnh án chi tiết và kê đơn thuốc cho bệnh nhân.',
  badge: 'Clinical Workspace',
  back: 'Quay lại danh sách',
  clinicalInfo: 'Thông tin lâm sàng',
  prescription: 'Đơn thuốc',
  additionalInfo: 'Thông tin bổ sung',
  symptoms: 'Triệu chứng lâm sàng',
  symptomsPlaceholder: 'Nhập các triệu chứng bệnh nhân mô tả...',
  diagnosis: 'Chẩn đoán bệnh',
  diagnosisPlaceholder: 'Ví dụ: Viêm họng cấp, Cúm A...',
  treatmentPlan: 'Phác đồ điều trị',
  treatmentPlanPlaceholder: 'Hướng điều trị, lời dặn chung...',
  followUpDate: 'Ngày tái khám',
  notes: 'Ghi chú nội bộ',
  notesPlaceholder: 'Ghi chú thêm cho bác sĩ...',
  medicineName: 'Tên thuốc',
  medicineQuantity: 'SL',
  medicineUnit: 'Đơn vị',
  medicineDosage: 'Liều dùng & Cách dùng',
  medicineSearchPlaceholder: 'Tìm thuốc...',
  medicineDosagePlaceholder: 'Lưu ý liều dùng...',
  addMedicine: 'Thêm thuốc',
  save: 'Lưu hồ sơ bệnh án',
  cancel: 'Hủy bỏ',
  confirmCopy:
    'Xác nhận thông tin bệnh án và đơn thuốc. Sau khi lưu, trạng thái lịch hẹn sẽ chuyển thành Hoàn thành.',
  saveError: 'Có lỗi xảy ra khi lưu hồ sơ.',
  invalidAppointment: 'Không xác định được lịch hẹn cần tạo hồ sơ.',
  validation: {
    symptomsRequired: 'Vui lòng nhập triệu chứng lâm sàng',
    diagnosisRequired: 'Vui lòng nhập chẩn đoán',
    medicineNameRequired: 'Tên thuốc không được để trống',
    medicineQuantityType: 'Phải là số',
    medicineQuantityPositive: 'Số lượng phải lớn hơn 0',
    medicineQuantityRequired: 'Số lượng là bắt buộc',
    medicineUnitRequired: 'Đơn vị là bắt buộc',
    medicineDosageRequired: 'Liều dùng là bắt buộc',
  },
} as const

export const CREATE_MEDICAL_RECORD_UI = {
  defaultQuantity: 1,
  mainColumn: 8,
  sideColumn: 4,
  prescriptionSuggestionCount: 12,
  symptomsRows: 3,
  treatmentPlanRows: 2,
  notesRows: 3,
  saveProgressSize: 20,
} as const

export const CREATE_MEDICAL_RECORD_DRUG_SUGGESTIONS = [
  'Paracetamol 500mg',
  'Amoxicillin 500mg',
  'Ibuprofen 400mg',
  'Ceftriaxone 1g',
  'Metformin 500mg',
  'Amlodipine 5mg',
  'Atorvastatin 20mg',
  'Omeprazole 20mg',
  'Salbutamol inhaler',
  'Gliclazide 30mg',
  'Losartan 50mg',
  'Augmentin 625mg',
] as const

export const CREATE_MEDICAL_RECORD_UNITS: MedicineUnit[] = ['Viên', 'Gói', 'Chai', 'Ống', 'Tuýp']

export const CREATE_MEDICAL_RECORD_DEFAULT_DOSAGE =
  'Ngày uống 2 lần, mỗi lần 1 viên sau ăn'
