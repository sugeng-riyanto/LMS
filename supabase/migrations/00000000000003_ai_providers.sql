-- AI Provider configurations for content generation
-- Each row stores API key, model, and endpoint for a supported AI service

CREATE TABLE public.ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('openai', 'groq', 'gemini', 'opencodeai')),
    api_key TEXT NOT NULL,
    base_url TEXT,
    default_model TEXT NOT NULL,
    available_models JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    priority INT DEFAULT 0,
    config JSONB DEFAULT '{"temperature": 0.7, "max_tokens": 4096}',
    last_tested_at TIMESTAMPTZ,
    test_status TEXT CHECK (test_status IN ('untested', 'working', 'failed')),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only super_admin can manage AI providers"
    ON public.ai_providers FOR ALL
    USING (public.is_admin());

CREATE POLICY "Teachers can read active AI providers"
    ON public.ai_providers FOR SELECT
    USING (public.is_admin_or_teacher() AND is_active = true);

CREATE INDEX idx_ai_providers_active ON public.ai_providers(is_active, priority);

CREATE TRIGGER update_ai_providers_updated_at
    BEFORE UPDATE ON public.ai_providers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
