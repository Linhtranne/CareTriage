$content = Get-Content -Path "d:\CareTriage\code\backend\backend\src\main\java\com\caretriage\application\service\impl\AppointmentServiceImpl.java" -Raw -Encoding UTF8

$content = $content -replace 'User doctor = userRepository\.findById\(request\.getDoctorId\(\)\)(\r?\n\s*\.orElseThrow\(\(\) -> new ResourceNotFoundException\("Không tìm thấy bác sĩ"\)\);(\r?\n\s*)// Validate doctor has DOCTOR role(\r?\n\s*)boolean isDoctor = doctor\.getRoles\(\)\.stream\(\)(\r?\n\s*)\.anyMatch\(r -> r\.getName\(\)\.equals\("DOCTOR"\)\);(\r?\n\s*)if \(!isDoctor\) \{(\r?\n\s*)throw new BusinessException\("Người dùng được chọn không phải bác sĩ"\);(\r?\n\s*)\})', 'User doctor = null;
        com.caretriage.domain.entity.external.ExternalDoctor externalDoctor = null;

        if (request.getExternalDoctorId() != null) {
            externalDoctor = externalDoctorRepository.findById(request.getExternalDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bác sĩ ngoài hệ thống"));
        } else if (request.getDoctorId() != null) {
            doctor = userRepository.findById(request.getDoctorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bác sĩ"));

            boolean isDoctor = doctor.getRoles().stream()
                    .anyMatch(r -> r.getName().equals("DOCTOR"));
            if (!isDoctor) {
                throw new BusinessException("Người dùng được chọn không phải bác sĩ");
            }
        } else {
            throw new BusinessException("Phải cung cấp doctorId hoặc externalDoctorId");
        }'

$content = $content -replace 'java\.time\.DayOfWeek dayOfWeek = request\.getAppointmentDate\(\)\.getDayOfWeek\(\);(\r?\n\s*)List<DoctorSchedule> schedules = doctorScheduleRepository(\r?\n\s*)\.findByDoctorIdAndDayOfWeekAndIsActiveTrue\(request\.getDoctorId\(\), dayOfWeek\);(\r?\n\s*)if \(schedules\.isEmpty\(\)\) \{(\r?\n\s*)throw new BusinessException\("Bác sĩ không có lịch làm việc vào " \+ dayOfWeek\);(\r?\n\s*)\}(\r?\n\s*)// Verify the requested time falls within a schedule(\r?\n\s*)boolean isWithinSchedule = schedules\.stream\(\)(\r?\n\s*)\.anyMatch\(s -> !request\.getAppointmentTime\(\)\.isBefore\(s\.getStartTime\(\)\)(\r?\n\s*)&& !request\.getAppointmentTime\(\)\.isAfter\(s\.getEndTime\(\)\.minusMinutes\(SLOT_DURATION_MINUTES\)\)\);(\r?\n\s*)if \(!isWithinSchedule\) \{(\r?\n\s*)throw new BusinessException\("Giờ khám không nằm trong lịch làm việc của bác sĩ"\);(\r?\n\s*)\}', 'if (doctor != null) {
            java.time.DayOfWeek dayOfWeek = request.getAppointmentDate().getDayOfWeek();
            List<DoctorSchedule> schedules = doctorScheduleRepository
                    .findByDoctorIdAndDayOfWeekAndIsActiveTrue(request.getDoctorId(), dayOfWeek);

            if (schedules.isEmpty()) {
                throw new BusinessException("Bác sĩ không có lịch làm việc vào " + dayOfWeek);
            }

            boolean isWithinSchedule = schedules.stream()
                    .anyMatch(s -> !request.getAppointmentTime().isBefore(s.getStartTime())
                            && !request.getAppointmentTime().isAfter(s.getEndTime().minusMinutes(SLOT_DURATION_MINUTES)));

            if (!isWithinSchedule) {
                throw new BusinessException("Giờ khám không nằm trong lịch làm việc của bác sĩ");
            }
        }'

$content = $content -replace 'LocalTime endTime = request\.getAppointmentTime\(\)\.plusMinutes\(SLOT_DURATION_MINUTES\);(\r?\n\s*)List<Appointment> conflicts = appointmentRepository\.findConflictingAppointments\((\r?\n\s*)request\.getDoctorId\(\),(\r?\n\s*)request\.getAppointmentDate\(\),(\r?\n\s*)request\.getAppointmentTime\(\),(\r?\n\s*)endTime,(\r?\n\s*)null // excludeId is null for new bookings(\r?\n\s*)\);(\r?\n\s*)if \(!conflicts\.isEmpty\(\)\) \{(\r?\n\s*)throw new com\.caretriage\.shared\.exception\.ConflictException\("Khung giờ này vừa mới được đặt\. Vui lòng chọn khung giờ khác"\);(\r?\n\s*)\}', 'LocalTime endTime = request.getAppointmentTime().plusMinutes(SLOT_DURATION_MINUTES);
        if (doctor != null) {
            List<Appointment> conflicts = appointmentRepository.findConflictingAppointments(
                    request.getDoctorId(),
                    request.getAppointmentDate(),
                    request.getAppointmentTime(),
                    endTime,
                    null
            );

            if (!conflicts.isEmpty()) {
                throw new com.caretriage.shared.exception.ConflictException("Khung giờ này vừa mới được đặt. Vui lòng chọn khung giờ khác");
            }
        }'

$content = $content -replace '\.doctor\(com\.caretriage\.infrastructure\.persistence\.mapper\.UserMapper\.INSTANCE\.toEntity\(doctor\)\)', '.doctor(doctor != null ? com.caretriage.infrastructure.persistence.mapper.UserMapper.INSTANCE.toEntity(doctor) : null)
                .externalDoctor(externalDoctor)'

$content = $content -replace 'log\.info\("Appointment booked: ID=\{\}, Patient=\{\}, Doctor=\{\}, Date=\{\} Time=\{\}",(\r?\n\s*)saved\.getId\(\), patient\.getFullName\(\), doctor\.getFullName\(\),(\r?\n\s*)saved\.getAppointmentDate\(\), saved\.getAppointmentTime\(\)\);', 'log.info("Appointment booked: ID={}, Patient={}, Doctor={}, ExtDoctor={}, Date={} Time={}",
                saved.getId(), patient.getFullName(), doctor != null ? doctor.getFullName() : "N/A",
                externalDoctor != null ? externalDoctor.getFullName() : "N/A",
                saved.getAppointmentDate(), saved.getAppointmentTime());

        if (externalDoctor != null) {
            com.caretriage.domain.entity.external.ExternalDoctorBookingToken token = com.caretriage.domain.entity.external.ExternalDoctorBookingToken.builder()
                    .appointment(saved)
                    .externalDoctor(externalDoctor)
                    .token(UUID.randomUUID().toString())
                    .status(com.caretriage.domain.entity.external.ExternalDoctorBookingToken.TokenStatus.PENDING)
                    .expiresAt(LocalDateTime.now().plusDays(2))
                    .build();
            externalDoctorBookingTokenRepository.save(token);
            externalDoctorEmailService.sendBookingEmail(saved, externalDoctor, token);
        }'

Set-Content -Path "d:\CareTriage\code\backend\backend\src\main\java\com\caretriage\application\service\impl\AppointmentServiceImpl.java" -Value $content -Encoding UTF8 -NoNewline
