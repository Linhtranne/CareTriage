-- CareTriage Full Database Schema (MySQL Compatible)
-- Perfectly aligned with Java Entities in d:\CareTriage\backend\src\main\java\com\caretriage\entity

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS patient_medications;
DROP TABLE IF EXISTS patient_conditions;
DROP TABLE IF EXISTS patient_symptoms;
DROP TABLE IF EXISTS extracted_entities;
DROP TABLE IF EXISTS clinical_notes;
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS doctor_schedules;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS chat_attachments;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS triage_tickets;
DROP TABLE IF EXISTS ticket_categories;
DROP TABLE IF EXISTS doctor_departments;
DROP TABLE IF EXISTS patient_profiles;
DROP TABLE IF EXISTS doctor_profiles;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS landing_content;
SET FOREIGN_KEY_CHECKS = 1;

-- 0. REFERENCE TABLES (Users & Roles - Provided for FK Integrity)
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url LONGTEXT,
    refresh_token VARCHAR(255),
    two_factor_email BOOLEAN DEFAULT FALSE,
    two_factor_sms BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- Mapping to DepartmentStatus enum
    -- Common fields that might be required by user's environment
    is_active TINYINT(1) DEFAULT 1, 
    deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

-- 2. DOCTOR PROFILES
CREATE TABLE IF NOT EXISTS doctor_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    bio TEXT,
    specialization VARCHAR(100),
    experience_years INT,
    degrees TEXT, -- Matches 'degrees' in DoctorProfile.java
    hospital_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Junction table for Doctors <-> Departments (Matches @JoinTable in DoctorProfile.java)
CREATE TABLE IF NOT EXISTS doctor_departments (
    doctor_profile_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    PRIMARY KEY (doctor_profile_id, department_id),
    FOREIGN KEY (doctor_profile_id) REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- 3. PATIENT PROFILES
CREATE TABLE IF NOT EXISTS patient_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    blood_type VARCHAR(10),
    allergies TEXT,
    insurance_number VARCHAR(50),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    chronic_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. TICKET CATEGORIES
CREATE TABLE IF NOT EXISTS ticket_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. CHAT SESSIONS (must be before triage_tickets due to FK)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_type VARCHAR(20) DEFAULT 'TRIAGE', -- TRIAGE, CONSULTATION, FOLLOW_UP
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, EXPIRED, CANCELLED
    ai_summary TEXT,
    suggested_department VARCHAR(100),
    urgency_level VARCHAR(20),
    title VARCHAR(200),
    last_message_content TEXT,
    last_message_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 6. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    sender_type VARCHAR(10) NOT NULL, -- USER, AI, SYSTEM
    content TEXT NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- 6.5 CHAT ATTACHMENTS
CREATE TABLE IF NOT EXISTS chat_attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120),
    file_size BIGINT,
    file_content LONGBLOB,
    extracted_text LONGTEXT,
    extraction_status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    INDEX idx_chat_attachment_session (session_id),
    INDEX idx_chat_attachment_status (extraction_status)
);


-- 7. TRIAGE TICKETS
CREATE TABLE IF NOT EXISTS triage_tickets (
    id binary(16) PRIMARY KEY, -- UUID stored as binary(16) to match Hibernate GenerationType.UUID
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'NEW', -- NEW, IN_TRIAGE, TRIAGED, CLOSED, REJECTED
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    severity VARCHAR(20) DEFAULT 'MINOR', -- CRITICAL, MAJOR, MINOR, COSMETIC
    requester_id BIGINT NOT NULL,
    triage_officer_id BIGINT,
    category_id BIGINT,
    chat_session_id BIGINT, -- Link to the AI session that generated this ticket
    metadata JSON,
    triaged_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL, -- Matches 'deletedAt' in TriageTicket.java
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (triage_officer_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES ticket_categories(id),
    FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id) ON DELETE SET NULL
);

-- 8. APPOINTMENTS
CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    department_id BIGINT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL, -- Matches 'appointmentTime' in Appointment.java
    end_time TIME,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, CONFIRMED, CHECKED_IN, etc.
    reason TEXT,
    notes TEXT, -- Matches 'notes' in Appointment.java
    cancellation_reason TEXT,
    triage_ticket_id binary(16), -- UUID binary(16) matching Appointment.triageTicketId type
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 9. DOCTOR SCHEDULES
CREATE TABLE IF NOT EXISTS doctor_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    day_of_week VARCHAR(15) NOT NULL, -- Matches DayOfWeek Enum String
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES users(id)
);

-- 10. MEDICAL RECORDS
CREATE TABLE IF NOT EXISTS medical_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT,
    diagnosis TEXT NOT NULL,
    symptoms TEXT,
    treatment_plan TEXT,
    prescription TEXT,
    notes TEXT,
    vital_signs JSON,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- 11. CLINICAL NOTES (For AI Extraction)
CREATE TABLE IF NOT EXISTS clinical_notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT,
    note_type VARCHAR(20) NOT NULL, -- ADMISSION, PROGRESS, etc.
    raw_text TEXT,
    file_path VARCHAR(500),
    file_type VARCHAR(20),
    extraction_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- 12. EXTRACTED ENTITIES
CREATE TABLE IF NOT EXISTS extracted_entities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clinical_note_id BIGINT NOT NULL,
    entity_type VARCHAR(20) NOT NULL, -- MEDICATION, SYMPTOM, etc.
    entity_value VARCHAR(500) NOT NULL,
    normalized_value VARCHAR(500),
    confidence_score DOUBLE,
    start_position INT,
    end_position INT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinical_note_id) REFERENCES clinical_notes(id) ON DELETE CASCADE
);

-- 13. PATIENT SYMPTOMS, CONDITIONS, MEDICATIONS
CREATE TABLE IF NOT EXISTS patient_symptoms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    clinical_note_id BIGINT,
    symptom_name VARCHAR(255) NOT NULL,
    severity VARCHAR(20) DEFAULT 'MODERATE', -- MILD, MODERATE, SEVERE
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
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, RESOLVED, CHRONIC
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
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, DISCONTINUED, COMPLETED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (clinical_note_id) REFERENCES clinical_notes(id)
);

-- 14. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(20) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    reference_id BIGINT,
    reference_type VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 15. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id BIGINT NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

-- 16. LANDING CONTENT
CREATE TABLE IF NOT EXISTS landing_content (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    section VARCHAR(255) NOT NULL,
    content_key VARCHAR(255) NOT NULL,
    content_value TEXT,
    language VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

-- 17. INDEXES (Optimized for entities)
CREATE INDEX idx_notif_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_ticket_search ON triage_tickets(status, priority);
CREATE INDEX idx_appt_search ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_chat_user_active ON chat_sessions(user_id, status);
