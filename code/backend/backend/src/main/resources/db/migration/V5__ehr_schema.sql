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
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

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
    FOREIGN KEY (clinical_note_id) REFERENCES clinical_notes(id) ON DELETE CASCADE
);

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
    FOREIGN KEY (clinical_note_id) REFERENCES clinical_notes(id)
);

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
    FOREIGN KEY (clinical_note_id) REFERENCES clinical_notes(id)
);

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
    FOREIGN KEY (clinical_note_id) REFERENCES clinical_notes(id)
);

-- INDEXES FOR H2 AND MYSQL COMPATIBILITY
CREATE INDEX idx_clinical_note_patient ON clinical_notes (patient_id);
CREATE INDEX idx_clinical_note_doctor ON clinical_notes (doctor_id);
CREATE INDEX idx_clinical_note_status ON clinical_notes (extraction_status);

CREATE INDEX idx_entity_note ON extracted_entities (clinical_note_id);
CREATE INDEX idx_entity_type ON extracted_entities (entity_type);
CREATE INDEX idx_entity_value ON extracted_entities (entity_value);

CREATE INDEX idx_sym_patient ON patient_symptoms (patient_id);
CREATE INDEX idx_sym_name ON patient_symptoms (symptom_name);

CREATE INDEX idx_cond_patient ON patient_conditions (patient_id);
CREATE INDEX idx_cond_name ON patient_conditions (condition_name);
CREATE INDEX idx_cond_status ON patient_conditions (status);

CREATE INDEX idx_med_patient ON patient_medications (patient_id);
CREATE INDEX idx_med_name ON patient_medications (medication_name);
CREATE INDEX idx_med_status ON patient_medications (status);
