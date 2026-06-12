-- Add user_id column
ALTER TABLE chat_turns ADD COLUMN user_id BIGINT;

-- Populate user_id from chat_sessions
UPDATE chat_turns t
JOIN chat_sessions s ON t.session_id = s.id
SET t.user_id = s.user_id;

-- Make user_id NOT NULL after population
ALTER TABLE chat_turns MODIFY COLUMN user_id BIGINT NOT NULL;

-- Add foreign key constraint
ALTER TABLE chat_turns ADD CONSTRAINT fk_chat_turns_user 
FOREIGN KEY (user_id) REFERENCES users(id);

-- Add unique constraint for idempotency
ALTER TABLE chat_turns ADD CONSTRAINT uq_user_turn 
UNIQUE (user_id, turn_id);
