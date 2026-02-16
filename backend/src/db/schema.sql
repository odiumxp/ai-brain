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
-- MEMORY CHAINS (Links related episodic memories for narrative understanding)
-- ============================================================================
CREATE TABLE memory_chains (
    chain_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    chain_name VARCHAR(255),
    chain_type VARCHAR(50) DEFAULT 'narrative', -- narrative, topic, emotional, temporal
    start_memory_id UUID REFERENCES episodic_memory(memory_id) ON DELETE CASCADE,
    end_memory_id UUID REFERENCES episodic_memory(memory_id) ON DELETE CASCADE,
    memory_sequence UUID[] NOT NULL, -- Ordered list of memory IDs in the chain
    chain_strength FLOAT DEFAULT 1.0, -- How strong/important this chain is
    chain_summary TEXT, -- AI-generated summary of the chain
    topics_covered TEXT[], -- Key topics in this chain
    emotional_arc JSONB, -- Emotional progression through the chain
    created_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP DEFAULT NOW(),
    access_count INT DEFAULT 0
);

-- Indexes for memory chain operations
CREATE INDEX idx_memory_chains_user ON memory_chains(user_id);
CREATE INDEX idx_memory_chains_type ON memory_chains(chain_type);
CREATE INDEX idx_memory_chains_strength ON memory_chains(chain_strength DESC);
CREATE INDEX idx_memory_chains_start ON memory_chains(start_memory_id);
CREATE INDEX idx_memory_chains_end ON memory_chains(end_memory_id);

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
    last_consolidated TIMESTAMP,
    consolidation_count INT DEFAULT 0,
    UNIQUE(user_id, trait_name)
);

CREATE INDEX idx_personality_user ON personality_state(user_id);

-- ============================================================================
-- EMOTIONAL TIMELINE (Amygdala & Limbic System - Emotional Tracking)
-- ============================================================================
CREATE TABLE emotional_timeline (
    emotion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT NOW(),
    emotion_type VARCHAR(50) NOT NULL, -- joy, sadness, anger, fear, surprise, disgust, trust, anticipation
    intensity FLOAT CHECK (intensity BETWEEN 0 AND 10),
    confidence FLOAT CHECK (confidence BETWEEN 0 AND 1) DEFAULT 0.8,
    trigger_event JSONB, -- what caused this emotion
    context_memory_id UUID REFERENCES episodic_memory(memory_id), -- link to memory
    physiological_markers JSONB, -- heart rate, stress levels, etc. (simulated)
    emotional_triggers JSONB, -- keywords/topics that triggered emotion
    duration_minutes INT, -- how long emotion lasted
    resolution_status VARCHAR(20) DEFAULT 'active', -- active, resolved, suppressed
    empathy_calibration JSONB, -- how AI should respond
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for emotional analysis
CREATE INDEX idx_emotional_user ON emotional_timeline(user_id);
CREATE INDEX idx_emotional_timestamp ON emotional_timeline(timestamp DESC);
CREATE INDEX idx_emotional_type ON emotional_timeline(emotion_type);
CREATE INDEX idx_emotional_intensity ON emotional_timeline(intensity DESC);
CREATE INDEX idx_emotional_memory ON emotional_timeline(context_memory_id);

-- ============================================================================
-- EMOTIONAL PATTERNS (Learned emotional responses)
-- ============================================================================
CREATE TABLE emotional_patterns (
    pattern_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    emotion_type VARCHAR(50) NOT NULL,
    trigger_patterns JSONB, -- common triggers for this emotion
    response_patterns JSONB, -- how user typically responds
    empathy_strategies JSONB, -- effective empathy approaches
    frequency_count INT DEFAULT 1,
    last_observed TIMESTAMP DEFAULT NOW(),
    confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1) DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_emotional_patterns_user ON emotional_patterns(user_id);
CREATE INDEX idx_emotional_patterns_type ON emotional_patterns(emotion_type);

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
-- AI PERSONAS (Multiple Personalities)
-- ============================================================================
CREATE TABLE ai_personas (
    persona_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    system_prompt TEXT,
    avatar_emoji VARCHAR(10) DEFAULT '🤖',
    color_theme VARCHAR(50) DEFAULT 'default',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP,
    UNIQUE(user_id, name)
);

CREATE INDEX idx_personas_user ON ai_personas(user_id);
CREATE INDEX idx_personas_active ON ai_personas(user_id, is_active) WHERE is_active = true;

-- ============================================================================
-- IDENTITY SUMMARIES (Self-Model Layer)
-- ============================================================================
CREATE TABLE identity_summaries (
    summary_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    persona_id UUID REFERENCES ai_personas(persona_id) ON DELETE CASCADE,

    -- Summary content
    personality_summary JSONB,  -- Current personality traits
    behavioral_patterns JSONB,  -- How the persona typically behaves
    relationship_dynamics JSONB, -- How it interacts with the user
    evolution_trends JSONB,     -- How it's changed over time

    -- Metadata
    stability_score FLOAT DEFAULT 0.5,  -- How stable/consistent the identity is
    confidence_level FLOAT DEFAULT 0.5, -- How confident we are in this summary
    generated_at TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,  -- When this summary expires

    UNIQUE(user_id, persona_id)
);

CREATE INDEX idx_identity_summaries_user_persona ON identity_summaries(user_id, persona_id);
CREATE INDEX idx_identity_summaries_generated ON identity_summaries(generated_at DESC);

-- ============================================================================
-- CONCEPT SCHEMA LAYER (Semantic Backbone)
-- ============================================================================

-- Core concepts table (extends semantic_memory with hierarchy)
CREATE TABLE concept_schema (
    concept_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    concept_name VARCHAR(255) NOT NULL,
    concept_type VARCHAR(50) DEFAULT 'general', -- 'general', 'entity', 'action', 'property', 'abstract'
    description TEXT,
    embedding VECTOR(1536), -- For semantic similarity
    importance_score FLOAT DEFAULT 1.0,
    activation_count INT DEFAULT 0,
    last_activated TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, concept_name)
);

CREATE INDEX idx_concept_schema_user ON concept_schema(user_id);
CREATE INDEX idx_concept_schema_type ON concept_schema(user_id, concept_type);
CREATE INDEX idx_concept_schema_importance ON concept_schema(user_id, importance_score DESC);
CREATE INDEX idx_concept_schema_embedding ON concept_schema
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Concept hierarchy (parent-child relationships)
CREATE TABLE concept_hierarchy (
    hierarchy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    parent_concept_id UUID REFERENCES concept_schema(concept_id) ON DELETE CASCADE,
    child_concept_id UUID REFERENCES concept_schema(concept_id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'is_a', -- 'is_a', 'part_of', 'instance_of', 'subclass_of'
    confidence_score FLOAT DEFAULT 0.8 CHECK (confidence_score BETWEEN 0 AND 1),
    activation_count INT DEFAULT 0,
    last_activated TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, parent_concept_id, child_concept_id, relationship_type)
);

CREATE INDEX idx_hierarchy_user ON concept_hierarchy(user_id);
CREATE INDEX idx_hierarchy_parent ON concept_hierarchy(parent_concept_id);
CREATE INDEX idx_hierarchy_child ON concept_hierarchy(child_concept_id);
CREATE INDEX idx_hierarchy_confidence ON concept_hierarchy(confidence_score DESC);

-- Concept relationships (associative links between concepts)
CREATE TABLE concept_relationships (
    relationship_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    source_concept_id UUID REFERENCES concept_schema(concept_id) ON DELETE CASCADE,
    target_concept_id UUID REFERENCES concept_schema(concept_id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- 'similar_to', 'opposite_of', 'causes', 'related_to', 'property_of'
    strength FLOAT DEFAULT 0.5 CHECK (strength BETWEEN 0 AND 1),
    context_notes TEXT,
    activation_count INT DEFAULT 0,
    last_activated TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, source_concept_id, target_concept_id, relationship_type)
);

CREATE INDEX idx_relationships_user ON concept_relationships(user_id);
CREATE INDEX idx_relationships_source ON concept_relationships(source_concept_id);
CREATE INDEX idx_relationships_target ON concept_relationships(target_concept_id);
CREATE INDEX idx_relationships_type ON concept_relationships(relationship_type);
CREATE INDEX idx_relationships_strength ON concept_relationships(strength DESC);

-- Concept metadata (additional properties and attributes)
CREATE TABLE concept_metadata (
    metadata_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    concept_id UUID REFERENCES concept_schema(concept_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    key_name VARCHAR(100) NOT NULL,
    value_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    string_value TEXT,
    number_value FLOAT,
    boolean_value BOOLEAN,
    json_value JSONB,
    confidence_score FLOAT DEFAULT 1.0,
    source VARCHAR(100), -- 'learned', 'inferred', 'user_defined', 'imported'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(concept_id, key_name)
);

CREATE INDEX idx_metadata_concept ON concept_metadata(concept_id);
CREATE INDEX idx_metadata_user ON concept_metadata(user_id);
CREATE INDEX idx_metadata_key ON concept_metadata(key_name);

-- ============================================================================
-- USER MODEL & BELIEF TRACKING (Theory of Mind)
-- ============================================================================

CREATE TABLE user_model (
    model_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    model_type VARCHAR(50) DEFAULT 'belief_system', -- 'belief_system', 'value_system', 'goal_hierarchy', 'mental_state'
    model_name VARCHAR(255) NOT NULL,
    model_data JSONB NOT NULL, -- Flexible storage for different model types
    confidence_level FLOAT DEFAULT 0.5 CHECK (confidence_level BETWEEN 0 AND 1),
    evidence_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, model_type, model_name)
);

-- Indexes for user model operations
CREATE INDEX idx_user_model_user ON user_model(user_id);
CREATE INDEX idx_user_model_type ON user_model(model_type);
CREATE INDEX idx_user_model_confidence ON user_model(confidence_level DESC);

-- User beliefs (specific beliefs extracted from conversations)
CREATE TABLE user_beliefs (
    belief_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    belief_statement TEXT NOT NULL,
    belief_category VARCHAR(100), -- 'religious', 'political', 'scientific', 'personal', 'ethical', etc.
    confidence_level FLOAT DEFAULT 0.5 CHECK (confidence_level BETWEEN 0 AND 1),
    evidence_sources UUID[], -- References to episodic_memory IDs that support this belief
    contradicting_evidence UUID[], -- References to memories that contradict this belief
    first_expressed TIMESTAMP,
    last_reinforced TIMESTAMP DEFAULT NOW(),
    belief_strength FLOAT DEFAULT 1.0, -- How strongly held (0-1)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_beliefs_user ON user_beliefs(user_id);
CREATE INDEX idx_user_beliefs_category ON user_beliefs(belief_category);
CREATE INDEX idx_user_beliefs_strength ON user_beliefs(belief_strength DESC);

-- User goals and objectives
CREATE TABLE user_goals (
    goal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    goal_description TEXT NOT NULL,
    goal_category VARCHAR(100), -- 'career', 'personal', 'learning', 'relationship', 'health', etc.
    priority_level INT DEFAULT 5 CHECK (priority_level BETWEEN 1 AND 10), -- 1=lowest, 10=highest
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'abandoned', 'on_hold'
    progress_percentage FLOAT DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    target_completion_date DATE,
    prerequisites UUID[], -- Other goal IDs that must be completed first
    success_criteria TEXT, -- How to measure completion
    obstacles_identified TEXT[], -- Known challenges
    strategies_planned TEXT[], -- Planned approaches
    first_mentioned TIMESTAMP,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_goals_user ON user_goals(user_id);
CREATE INDEX idx_user_goals_category ON user_goals(goal_category);
CREATE INDEX idx_user_goals_priority ON user_goals(priority_level DESC);
CREATE INDEX idx_user_goals_status ON user_goals(status);

-- User values and principles
CREATE TABLE user_values (
    value_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    value_name VARCHAR(255) NOT NULL,
    value_description TEXT,
    importance_level INT DEFAULT 5 CHECK (importance_level BETWEEN 1 AND 10),
    related_beliefs UUID[], -- References to user_beliefs that stem from this value
    behavioral_indicators TEXT[], -- How this value manifests in behavior
    conflict_resolution TEXT, -- How conflicts with this value are resolved
    first_expressed TIMESTAMP,
    last_reinforced TIMESTAMP DEFAULT NOW(),
    value_strength FLOAT DEFAULT 1.0, -- How strongly held (0-1)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_values_user ON user_values(user_id);
CREATE INDEX idx_user_values_importance ON user_values(importance_level DESC);

-- Mental state tracking (current emotional/cognitive state inference)
CREATE TABLE mental_states (
    state_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT NOW(),
    dominant_emotion VARCHAR(50),
    emotional_intensity FLOAT DEFAULT 0.5 CHECK (emotional_intensity BETWEEN 0 AND 1),
    cognitive_load VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'overwhelmed'
    attention_focus TEXT, -- What the user seems focused on
    decision_making_style VARCHAR(50), -- 'analytical', 'intuitive', 'emotional', 'practical'
    communication_style VARCHAR(50), -- 'direct', 'indirect', 'verbose', 'concise'
    stress_indicators TEXT[], -- Signs of stress or anxiety
    motivation_level VARCHAR(50) DEFAULT 'neutral', -- 'low', 'neutral', 'high', 'very_high'
    inferred_needs TEXT[], -- What the user might need right now
    contextual_factors JSONB, -- External factors affecting mental state
    confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score BETWEEN 0 AND 1),
    evidence_memories UUID[] -- Supporting memories for this state inference
);

CREATE INDEX idx_mental_states_user ON mental_states(user_id);
CREATE INDEX idx_mental_states_timestamp ON mental_states(timestamp DESC);
CREATE INDEX idx_mental_states_emotion ON mental_states(dominant_emotion);

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
-- CONCEPT SCHEMA FUNCTIONS
-- ============================================================================

-- Function to activate a concept (increases importance and tracks usage)
CREATE OR REPLACE FUNCTION activate_concept(target_concept_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE concept_schema
    SET activation_count = activation_count + 1,
        last_activated = NOW(),
        importance_score = LEAST(importance_score * 1.05, 5.0)
    WHERE concept_id = target_concept_id;
END;
$$ LANGUAGE plpgsql;

-- Function to strengthen concept relationships
CREATE OR REPLACE FUNCTION strengthen_relationship(rel_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE concept_relationships
    SET strength = LEAST(strength * 1.1, 1.0),
        activation_count = activation_count + 1,
        last_activated = NOW()
    WHERE relationship_id = rel_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decay unused concepts and relationships
CREATE OR REPLACE FUNCTION decay_concept_schema(target_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Decay concept importance for inactive concepts
    UPDATE concept_schema
    SET importance_score = GREATEST(importance_score * 0.95, 0.1)
    WHERE user_id = target_user_id
    AND last_activated < NOW() - INTERVAL '30 days';

    -- Decay relationship strength for inactive relationships
    UPDATE concept_relationships
    SET strength = GREATEST(strength * 0.95, 0.1)
    WHERE user_id = target_user_id
    AND last_activated < NOW() - INTERVAL '30 days';

    -- Remove very weak relationships
    DELETE FROM concept_relationships
    WHERE user_id = target_user_id
    AND strength < 0.1
    AND activation_count < 2;

    -- Remove very weak concepts (but keep core concepts)
    DELETE FROM concept_schema
    WHERE user_id = target_user_id
    AND importance_score < 0.2
    AND activation_count < 3
    AND concept_type != 'core';
END;
$$ LANGUAGE plpgsql;

-- Function to find similar concepts using embeddings
CREATE OR REPLACE FUNCTION find_similar_concepts(target_user_id UUID, target_embedding VECTOR(1536), similarity_threshold FLOAT DEFAULT 0.7)
RETURNS TABLE(concept_id UUID, concept_name VARCHAR(255), similarity_score FLOAT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cs.concept_id,
        cs.concept_name,
        1 - (cs.embedding <=> target_embedding) as similarity_score
    FROM concept_schema cs
    WHERE cs.user_id = target_user_id
    AND cs.embedding IS NOT NULL
    AND 1 - (cs.embedding <=> target_embedding) > similarity_threshold
    ORDER BY cs.embedding <=> target_embedding;
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
