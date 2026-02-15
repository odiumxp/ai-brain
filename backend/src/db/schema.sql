-- AI Brain Database Schema
-- Complete brain-inspired architecture for persistent AI personality

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- EPISODIC MEMORY (Hippocampus - Specific Events/Conversations)
-- ============================================================================
CREATE TABLE episodic_memory (
    memory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT NOW(),
    conversation_text JSONB NOT NULL,
    emotional_context JSONB,
    importance_score FLOAT DEFAULT 1.0,
    access_count INT DEFAULT 0,
    last_accessed TIMESTAMP,
    embedding VECTOR(1536),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient retrieval
CREATE INDEX idx_episodic_user ON episodic_memory(user_id);
CREATE INDEX idx_episodic_timestamp ON episodic_memory(timestamp DESC);
CREATE INDEX idx_episodic_importance ON episodic_memory(importance_score DESC);
CREATE INDEX idx_episodic_embedding ON episodic_memory 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- SEMANTIC MEMORY (General Knowledge and Facts)
-- ============================================================================
CREATE TABLE semantic_memory (
    concept_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    concept_name VARCHAR(255) NOT NULL,
    knowledge_data JSONB,
    confidence_level FLOAT DEFAULT 0.5,
    source_memories UUID[],
    created_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, concept_name)
);

CREATE INDEX idx_semantic_user ON semantic_memory(user_id);
CREATE INDEX idx_semantic_concept ON semantic_memory(concept_name);

-- ============================================================================
-- PROCEDURAL MEMORY (Learned Behaviors)
-- ============================================================================
CREATE TABLE procedural_memory (
    procedure_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    task_type VARCHAR(255) NOT NULL,
    execution_steps JSONB,
    success_rate FLOAT DEFAULT 0.0,
    times_executed INT DEFAULT 0,
    optimization_level FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PERSONALITY STATE (Prefrontal Cortex - Personality Traits)
-- ============================================================================
CREATE TABLE personality_state (
    trait_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    trait_name VARCHAR(100) NOT NULL,
    current_value FLOAT CHECK (current_value BETWEEN 0 AND 10),
    historical_values JSONB DEFAULT '{}',
    influencing_factors JSONB,
    last_modified TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, trait_name)
);

CREATE INDEX idx_personality_user ON personality_state(user_id);

-- ============================================================================
-- DECISION PATTERNS
-- ============================================================================
CREATE TABLE decision_patterns (
    pattern_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    situation_type VARCHAR(255),
    learned_approach JSONB,
    success_rate FLOAT DEFAULT 0.5,
    times_used INT DEFAULT 0,
    formed_from_memories UUID[]
);

-- ============================================================================
-- EMOTIONAL MEMORY (Amygdala - Emotional Associations)
-- ============================================================================
CREATE TABLE emotional_memory (
    emotion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    trigger_concept VARCHAR(255),
    emotional_response JSONB,
    strength FLOAT DEFAULT 0.5,
    formed_timestamp TIMESTAMP DEFAULT NOW(),
    reinforcement_events INT DEFAULT 1
);

-- ============================================================================
-- EMOTIONAL STATE (Current Mood)
-- ============================================================================
CREATE TABLE emotional_state (
    state_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT NOW(),
    base_mood JSONB,
    active_emotions JSONB,
    context_triggers UUID[]
);

CREATE INDEX idx_emotional_state_user ON emotional_state(user_id);
CREATE INDEX idx_emotional_state_time ON emotional_state(timestamp DESC);

-- ============================================================================
-- NEURAL CONNECTIONS (Synaptic Pathways)
-- ============================================================================
CREATE TABLE neural_connections (
    connection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    from_concept_id UUID REFERENCES semantic_memory(concept_id),
    to_concept_id UUID REFERENCES semantic_memory(concept_id),
    connection_strength FLOAT DEFAULT 0.5 CHECK (connection_strength BETWEEN 0 AND 1),
    connection_type VARCHAR(50),
    activation_count INT DEFAULT 0,
    last_activated TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_connections_from ON neural_connections(from_concept_id);
CREATE INDEX idx_connections_to ON neural_connections(to_concept_id);
CREATE INDEX idx_connections_strength ON neural_connections(connection_strength DESC);

-- ============================================================================
-- THOUGHT PATTERNS
-- ============================================================================
CREATE TABLE thought_patterns (
    pattern_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    pattern_name VARCHAR(255),
    node_sequence UUID[],
    activation_frequency INT DEFAULT 0,
    pattern_strength FLOAT DEFAULT 0.0
);

-- ============================================================================
-- WORKING MEMORY (Active Context)
-- ============================================================================
CREATE TABLE working_memory (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    active_concepts UUID[],
    attention_weights JSONB,
    recent_retrievals UUID[],
    context_window TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE INDEX idx_working_user ON working_memory(user_id);

-- ============================================================================
-- SELF-AWARENESS (Meta-Cognition)
-- ============================================================================
CREATE TABLE self_awareness (
    reflection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT NOW(),
    self_observation TEXT,
    identity_update JSONB,
    behavioral_insight JSONB
);

-- ============================================================================
-- IDENTITY (Self-Concept)
-- ============================================================================
CREATE TABLE identity (
    identity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    core_values JSONB,
    self_description TEXT,
    personal_history JSONB,
    version INT DEFAULT 1,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to consolidate memories (run daily)
CREATE OR REPLACE FUNCTION consolidate_memories(target_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Strengthen important memories
    UPDATE episodic_memory 
    SET importance_score = LEAST(importance_score * 1.1, 3.0)
    WHERE user_id = target_user_id 
    AND access_count > 5;
    
    -- Weaken unimportant ones (forgetting)
    UPDATE episodic_memory 
    SET importance_score = GREATEST(importance_score * 0.9, 0.1)
    WHERE user_id = target_user_id 
    AND access_count = 0 
    AND timestamp < NOW() - INTERVAL '30 days';
    
    -- Delete very weak old memories
    DELETE FROM episodic_memory
    WHERE user_id = target_user_id
    AND importance_score < 0.2
    AND timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to activate neural connection
CREATE OR REPLACE FUNCTION activate_connection(conn_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE neural_connections
    SET connection_strength = LEAST(connection_strength * 1.1, 1.0),
        activation_count = activation_count + 1,
        last_activated = NOW()
    WHERE connection_id = conn_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decay inactive connections
CREATE OR REPLACE FUNCTION decay_connections(target_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Weaken inactive connections
    UPDATE neural_connections
    SET connection_strength = GREATEST(connection_strength * 0.95, 0.1)
    WHERE user_id = target_user_id
    AND last_activated < NOW() - INTERVAL '30 days';
    
    -- Prune very weak connections
    DELETE FROM neural_connections
    WHERE user_id = target_user_id
    AND connection_strength < 0.1 
    AND activation_count < 3;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize default personality traits for new user
CREATE OR REPLACE FUNCTION initialize_personality(target_user_id UUID)
RETURNS void AS $$
DECLARE
    traits TEXT[] := ARRAY['humor', 'empathy', 'directness', 'formality', 'enthusiasm', 'curiosity', 'patience'];
    trait_name TEXT;
BEGIN
    FOREACH trait_name IN ARRAY traits
    LOOP
        INSERT INTO personality_state (user_id, trait_name, current_value)
        VALUES (target_user_id, trait_name, 5.0)
        ON CONFLICT (user_id, trait_name) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create a default user (you can modify this later)
INSERT INTO users (username, email) 
VALUES ('default_user', 'user@example.com')
ON CONFLICT (username) DO NOTHING;

-- Initialize personality for default user
DO $$
DECLARE
    default_user_id UUID;
BEGIN
    SELECT user_id INTO default_user_id FROM users WHERE username = 'default_user';
    PERFORM initialize_personality(default_user_id);
END $$;
