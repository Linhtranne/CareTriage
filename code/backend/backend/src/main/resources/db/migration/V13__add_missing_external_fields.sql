-- Add missing fields to external_doctor_sources
ALTER TABLE external_doctor_sources
ADD COLUMN base_url VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN allowed_domain VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN city VARCHAR(100),
ADD COLUMN district VARCHAR(100),
ADD COLUMN latitude DOUBLE,
ADD COLUMN longitude DOUBLE,
ADD COLUMN last_crawled_at TIMESTAMP NULL;

-- Add missing fields to external_doctors
ALTER TABLE external_doctors
ADD COLUMN source_url VARCHAR(500),
ADD COLUMN address VARCHAR(255),
ADD COLUMN latitude DOUBLE,
ADD COLUMN longitude DOUBLE,
ADD COLUMN verification_status VARCHAR(50) NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN active BOOLEAN DEFAULT FALSE;

-- Add external_doctor_id to appointments
ALTER TABLE appointments
ADD COLUMN external_doctor_id BIGINT NULL,
ADD CONSTRAINT fk_appointments_external_doctor FOREIGN KEY (external_doctor_id) REFERENCES external_doctors(id);

