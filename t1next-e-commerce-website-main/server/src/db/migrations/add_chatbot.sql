-- AI Chatbot Tables
-- Note: Reuse existing chat_sessions and chat_messages tables

-- Add columns to existing chat_sessions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='chat_sessions' AND column_name='guest_id') THEN
    ALTER TABLE chat_sessions ADD COLUMN guest_id VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='chat_sessions' AND column_name='metadata') THEN
    ALTER TABLE chat_sessions ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Chat feedback for AI chatbot
CREATE TABLE IF NOT EXISTS chatbot_feedback (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  message_id TEXT,
  session_id TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge base for RAG (optional, for future)
CREATE TABLE IF NOT EXISTS chatbot_knowledge (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100), -- product, policy, faq, etc
  tags TEXT[], -- for filtering
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_guest_id ON chat_sessions(guest_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_session_id ON chatbot_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_category ON chatbot_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_is_active ON chatbot_knowledge(is_active);
