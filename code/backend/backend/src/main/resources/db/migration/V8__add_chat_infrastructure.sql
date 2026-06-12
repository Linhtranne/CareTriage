-- Flyway SQL Migration V8
-- Create chat_turns table and alter chat_messages for turn-based tracking

CREATE TABLE IF NOT EXISTS chat_turns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    turn_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL, -- STARTED, STREAMING, COMPLETED, FAILED
    ticket_status VARCHAR(20) NULL, -- PENDING, READY, NOT_NEEDED, FAILED_RETRYABLE, FAILED_PERMANENT
    final_payload JSON NULL,
    persisted_payload JSON NULL,
    ticket_id VARCHAR(36) NULL,
    error_code VARCHAR(64) NULL,
    attempt_count INT NOT NULL DEFAULT 1,
    ticket_attempt_count INT DEFAULT 0,
    next_ticket_retry_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_session_turn (session_id, turn_id),
    CONSTRAINT fk_chat_turn_session FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- Alter chat_messages to support turn-based and legacy redis migration
ALTER TABLE chat_messages 
ADD COLUMN turn_id VARCHAR(36) NULL,
ADD COLUMN legacy_redis_id BIGINT NULL,
ADD UNIQUE KEY uq_chat_message_turn_sender (session_id, turn_id, sender_type);

CREATE UNIQUE INDEX uq_chat_message_legacy_redis
    ON chat_messages(session_id, legacy_redis_id);
