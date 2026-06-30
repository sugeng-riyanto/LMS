export interface AIProvider {
  id: string;
  provider_name: string;
  display_name: string;
  provider_type: "openai" | "groq" | "gemini" | "opencodeai";
  api_key: string;
  base_url: string | null;
  default_model: string;
  available_models: string[];
  is_active: boolean;
  priority: number;
  config: {
    temperature: number;
    max_tokens: number;
    [key: string]: unknown;
  };
  last_tested_at: string | null;
  test_status: "untested" | "working" | "failed";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const PROVIDER_DEFAULTS: Record<string, { base_url: string; models: string[] }> = {
  openai: {
    base_url: "https://api.openai.com/v1",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  groq: {
    base_url: "https://api.groq.com/openai/v1",
    models: ["llama2-70b-4096", "mixtral-8x7b-32768", "gemma-7b-it", "llama3-70b-8192", "llama3-8b-8192"],
  },
  gemini: {
    base_url: "https://generativelanguage.googleapis.com/v1beta",
    models: ["gemini-2.0-flash", "gemini-2.0-pro", "gemini-1.5-pro", "gemini-1.5-flash"],
  },
  opencodeai: {
    base_url: "https://api.opencode.ai/v1",
    models: ["opencode-v4-flash", "opencode-v4-pro"],
  },
};

export const PROVIDER_LABELS: Record<string, string> = {
  openai: "ChatGPT (OpenAI)",
  groq: "Groq",
  gemini: "Gemini",
  opencodeai: "OpenCode AI",
};

export const PROVIDER_LOGOS: Record<string, string> = {
  openai: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  groq: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  gemini: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  opencodeai: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export const PROVIDER_INSTRUCTIONS: Record<string, { key_source: string; key_url: string; notes: string }> = {
  openai: {
    key_source: "OpenAI Platform",
    key_url: "https://platform.openai.com/api-keys",
    notes:
      "Create an API key at platform.openai.com. Select a model such as gpt-4o or gpt-4o-mini. Ensure your account has sufficient credits.",
  },
  groq: {
    key_source: "Groq Console",
    key_url: "https://console.groq.com/keys",
    notes:
      "Register for free at console.groq.com and create an API key. Groq provides free inference for models such as llama3 and mixtral. Suitable for development.",
  },
  gemini: {
    key_source: "Google AI Studio",
    key_url: "https://aistudio.google.com/apikey",
    notes:
      "Create an API key at Google AI Studio (free tier available). Use the gemini-2.0-flash model for faster responses. Base URL: https://generativelanguage.googleapis.com/v1beta",
  },
  opencodeai: {
    key_source: "OpenCode AI Dashboard",
    key_url: "https://opencode.ai",
    notes:
      "AI platform from opencode.ai. Use the opencode-v4-flash model for faster responses or opencode-v4-pro for higher quality output.",
  },
};
