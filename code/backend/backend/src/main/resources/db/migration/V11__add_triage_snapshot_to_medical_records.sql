ALTER TABLE medical_records
    ADD COLUMN triage_ticket_id VARCHAR(255),
    ADD COLUMN triage_priority VARCHAR(50),
    ADD COLUMN triage_severity VARCHAR(50),
    ADD COLUMN ai_summary_snapshot TEXT,
    ADD COLUMN triage_review_snapshot TEXT;
