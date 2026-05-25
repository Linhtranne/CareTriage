DROP TABLE IF EXISTS triage_tickets;
DROP TABLE IF EXISTS ticket_categories;

CREATE TABLE ticket_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

CREATE INDEX idx_ticket_category_name ON ticket_categories(name);

CREATE TABLE triage_tickets (
    id CHAR(36) PRIMARY KEY,
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    requester_id BIGINT NOT NULL,
    triage_officer_id BIGINT NULL,
    category_id BIGINT NULL,
    metadata JSON NULL,
    triaged_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_triage_ticket_requester FOREIGN KEY (requester_id) REFERENCES users(id),
    CONSTRAINT fk_triage_ticket_officer FOREIGN KEY (triage_officer_id) REFERENCES users(id),
    CONSTRAINT fk_triage_ticket_category FOREIGN KEY (category_id) REFERENCES ticket_categories(id)
);

CREATE INDEX idx_ticket_status ON triage_tickets(status);
CREATE INDEX idx_ticket_priority ON triage_tickets(priority);
CREATE INDEX idx_ticket_requester ON triage_tickets(requester_id);
CREATE INDEX idx_ticket_triage_officer ON triage_tickets(triage_officer_id);
CREATE INDEX idx_ticket_category ON triage_tickets(category_id);
