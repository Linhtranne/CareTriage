-- Migration SQL to add doctor review columns, chat session connection and attachment extraction metadata
ALTER TABLE triage_tickets ADD COLUMN chat_session_id BIGINT NULL;
ALTER TABLE triage_tickets ADD COLUMN doctor_review_status VARCHAR(30) DEFAULT 'AI_ANALYSIS_PENDING_REVIEW';
ALTER TABLE triage_tickets ADD COLUMN reviewed_by_id BIGINT NULL;
ALTER TABLE triage_tickets ADD COLUMN reviewed_at TIMESTAMP NULL;
ALTER TABLE triage_tickets ADD COLUMN confirmed_department VARCHAR(255) NULL;
ALTER TABLE triage_tickets ADD COLUMN confirmed_urgency VARCHAR(50) NULL;
ALTER TABLE triage_tickets ADD COLUMN ai_analysis_snapshot TEXT NULL;
ALTER TABLE triage_tickets ADD COLUMN doctor_edits_snapshot TEXT NULL;
ALTER TABLE triage_tickets ADD COLUMN doctor_confirmed_summary VARCHAR(2000) NULL;
ALTER TABLE triage_tickets ADD COLUMN doctor_notes VARCHAR(2000) NULL;
ALTER TABLE triage_tickets ADD CONSTRAINT fk_triage_reviewed_by FOREIGN KEY (reviewed_by_id) REFERENCES users(id);
ALTER TABLE triage_tickets ADD CONSTRAINT fk_triage_chat_session FOREIGN KEY (chat_session_id) REFERENCES chat_sessions(id);

ALTER TABLE chat_attachments ADD COLUMN extraction_error_message VARCHAR(2000) NULL;
ALTER TABLE chat_attachments ADD COLUMN extraction_source VARCHAR(50) NULL;
ALTER TABLE chat_attachments ADD COLUMN extracted_entities_json TEXT NULL;
