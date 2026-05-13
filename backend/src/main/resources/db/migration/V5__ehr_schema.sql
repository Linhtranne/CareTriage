-- Sprint 15: EHR Schema Migration
-- CREATE TABLE IF NOT EXISTS for clinical_notes, extracted_entities, patient_symptoms, patient_conditions, patient_medications

CREATE TABLE IF NOT EXISTS clinical_notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT,
    note_type VARCHAR(20) NOT NULL,
    raw_text TEXT,
    file_path VARCHAR(500),
    file_type VARCHAR(20),
    extraction_status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    INDEX idx_clinical_note_patient (patient_id),
    INDEX idx_clinical_note_doctor (doctor_id),
    INDEX idx_clinical_note_status (extraction_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS extracted_entities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clinical_note_id BIGINT NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    entity_value VARCHAR(500) NOT NULL,
    normalized_value VARCHAR(500),
    confidence_score DOUBLE,
    start_position INT,
    end_position INT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinical_note_id) REFERENCES clinical_notes(id) ON DELETE CASCADE,
    INDEX idx_entity_note (clinical_note_id),
    INDEX idx_entity_type (entity_type),
    INDEX idx_entity_value (entity_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patient_symptoms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    clinical_note_id BIGINT,
    symptom_name VARCHAR(255) NOT NULL,
    severity VARCHAR(20) DEFAULT 'MODERATE',
    onset_date DATE,
    duration VARCHAR(100),
    body_location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (clinical_note_id) REFERENCES clinical_notes(id),
    INDEX idx_sym_patient (patient_id),
    INDEX idx_sym_name (symptom_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patient_conditions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    clinical_note_id BIGINT,
    condition_name VARCHAR(255) NOT NULL,
    icd_code VARCHAR(20),
    severity VARCHAR(20) DEFAULT 'MODERATE',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    diagnosed_date DATE,
    resolved_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (clinical_note_id) REFERENCES clinical_notes(id),
    INDEX idx_cond_patient (patient_id),
    INDEX idx_cond_name (condition_name),
    INDEX idx_cond_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patient_medications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    clinical_note_id BIGINT,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    route VARCHAR(50),
    start_date DATE,
    end_date DATE,
    prescribing_doctor_id BIGINT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (clinical_note_id) REFERENCES clinical_notes(id),
    INDEX idx_med_patient (patient_id),
    INDEX idx_med_name (medication_name),
    INDEX idx_med_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
