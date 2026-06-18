-- External Doctor Source Table
CREATE TABLE external_doctor_sources (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL UNIQUE,
    api_endpoint VARCHAR(255) NOT NULL,
    api_token VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- External Doctor Table
CREATE TABLE external_doctors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_id BIGINT NOT NULL,
    external_id VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    specialization VARCHAR(150),
    hospital_name VARCHAR(255),
    bio TEXT,
    profile_url VARCHAR(500),
    rating DOUBLE,
    experience_years INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_external_doctors_source FOREIGN KEY (source_id) REFERENCES external_doctor_sources(id)
);

-- External Doctor Import Job Table
CREATE TABLE external_doctor_import_jobs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    doctors_imported INT DEFAULT 0,
    doctors_updated INT DEFAULT 0,
    doctors_failed INT DEFAULT 0,
    error_log TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    CONSTRAINT fk_import_jobs_source FOREIGN KEY (source_id) REFERENCES external_doctor_sources(id)
);

-- External Doctor Booking Token Table
CREATE TABLE external_doctor_booking_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT NOT NULL,
    external_doctor_id BIGINT NOT NULL,
    token VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_tokens_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_booking_tokens_external_doctor FOREIGN KEY (external_doctor_id) REFERENCES external_doctors(id)
);
