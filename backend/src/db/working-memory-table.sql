-- Drop existing working_memory table and recreate with correct structure
DROP TABLE IF EXISTS working_memory CASCADE;

-- Working Memory Table
-- Stores the current "active thoughts" and context for ongoing conversations

CREATE TABLE working_memory (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    persona_id UUID REFERENCES ai_personas(persona_id) ON DELETE SET NULL,

    -- Active topics being discussed (last 3-5)
    active_topics JSONB DEFAULT '[]'::jsonb,

    -- Questions user asked that haven't been fully resolved
    unresolved_questions JSONB DEFAULT '[]'::jsonb,

    -- Current conversation goal/intent
    conversation_goal TEXT,

    -- Current emotional state in this session
    emotional_state JSONB DEFAULT '{}'::jsonb,

    -- Last message timestamp (for detecting session continuity)
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- When this working memory session started
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Is this session still active?
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_working_memory_user ON working_memory(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_working_memory_activity ON working_memory(last_activity) WHERE is_active = true;

-- Function to auto-expire old sessions (older than 1 hour)
CREATE OR REPLACE FUNCTION expire_old_working_memory()
RETURNS void AS $$
BEGIN
    UPDATE working_memory
    SET is_active = false
    WHERE last_activity < NOW() - INTERVAL '1 hour'
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Remove the problematic trigger - expiration will be handled by application logic
-- CREATE TRIGGER check_expired_working_memory
--     AFTER INSERT OR UPDATE ON working_memory
--     EXECUTE FUNCTION expire_old_working_memory();

COMMENT ON TABLE working_memory IS 'Simulates human working memory - keeps track of current conversation context, active topics, and unresolved questions';
COMMENT ON COLUMN working_memory.active_topics IS 'Array of recent topics (last 3-5), e.g., ["job search", "Python learning", "weekend plans"]';
COMMENT ON COLUMN working_memory.unresolved_questions IS 'Array of questions user asked that need follow-up, e.g., [{"question": "What was that restaurant?", "asked_at": "2024-02-15"}]';
COMMENT ON COLUMN working_memory.conversation_goal IS 'What the user is trying to accomplish in this conversation, e.g., "get advice on career change"';
