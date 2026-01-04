/**
 * Comprehensive error handling for LLM API calls
 */
class ErrorHandler {
  /**
   * Standardize error responses from different LLM providers
   * @param {Error} error - The error object
   * @param {string} provider - The LLM provider name
   * @returns {Object} Standardized error object
   */
  static standardizeError(error, provider) {
    let standardizedError = {
      provider,
      message: error.message || 'Unknown error occurred',
      type: 'unknown',
      code: null,
      retryable: false,
      timestamp: new Date().toISOString()
    };

    // Handle specific error types from different providers
    if (provider === 'claude') {
      standardizedError = this.handleClaudeError(error, standardizedError);
    } else if (provider === 'openai') {
      standardizedError = this.handleOpenAIError(error, standardizedError);
    } else if (provider === 'gemini') {
      standardizedError = this.handleGeminiError(error, standardizedError);
    } else if (provider === 'perplexity') {
      standardizedError = this.handlePerplexityError(error, standardizedError);
    }

    return standardizedError;
  }

  static handleClaudeError(error, baseError) {
    baseError.type = 'claude_api_error';
    
    if (error.status) {
      baseError.code = error.status;
      if (error.status === 429) {
        baseError.type = 'rate_limit_exceeded';
        baseError.retryable = true;
      } else if (error.status >= 500) {
        baseError.type = 'server_error';
        baseError.retryable = true;
      } else if (error.status === 401) {
        baseError.type = 'authentication_error';
      } else if (error.status === 400) {
        baseError.type = 'invalid_request';
      }
    }
    
    return baseError;
  }

  static handleOpenAIError(error, baseError) {
    baseError.type = 'openai_api_error';
    
    if (error.status) {
      baseError.code = error.status;
      if (error.status === 429) {
        baseError.type = 'rate_limit_exceeded';
        baseError.retryable = true;
      } else if (error.status >= 500) {
        baseError.type = 'server_error';
        baseError.retryable = true;
      } else if (error.status === 401) {
        baseError.type = 'authentication_error';
      } else if (error.status === 400) {
        baseError.type = 'invalid_request';
      }
    } else if (error.error && error.error.type) {
      baseError.type = error.error.type;
    }
    
    return baseError;
  }

  static handleGeminiError(error, baseError) {
    baseError.type = 'gemini_api_error';
    
    // Google Generative AI errors may not have consistent structure
    if (error.message && error.message.includes('quota')) {
      baseError.type = 'quota_exceeded';
      baseError.retryable = false;
    } else if (error.message && error.message.includes('rate')) {
      baseError.type = 'rate_limit_exceeded';
      baseError.retryable = true;
    } else if (error.message && (error.message.includes('401') || error.message.includes('auth'))) {
      baseError.type = 'authentication_error';
    }
    
    return baseError;
  }

  static handlePerplexityError(error, baseError) {
    baseError.type = 'perplexity_api_error';
    
    if (error.status) {
      baseError.code = error.status;
      if (error.status === 429) {
        baseError.type = 'rate_limit_exceeded';
        baseError.retryable = true;
      } else if (error.status >= 500) {
        baseError.type = 'server_error';
        baseError.retryable = true;
      } else if (error.status === 401) {
        baseError.type = 'authentication_error';
      } else if (error.status === 400) {
        baseError.type = 'invalid_request';
      }
    }
    
    return baseError;
  }

  /**
   * Apply fallback logic when primary LLM fails
   * @param {string} prompt - The original prompt
   * @param {string} failedProvider - The provider that failed
   * @param {Object} services - Available LLM services
   * @returns {Object|null} Fallback response or null if no fallback available
   */
  static async applyFallback(prompt, failedProvider, services) {
    // Define fallback priority order
    const fallbackOrder = {
      'claude': ['openai', 'gemini', 'perplexity'],
      'openai': ['claude', 'gemini', 'perplexity'],
      'gemini': ['openai', 'claude', 'perplexity'],
      'perplexity': ['openai', 'claude', 'gemini']
    };

    const providers = fallbackOrder[failedProvider] || [];

    for (const provider of providers) {
      try {
        let service;
        switch(provider) {
          case 'claude':
            service = services.claudeService;
            break;
          case 'openai':
            service = services.openaiService;
            break;
          case 'gemini':
            service = services.geminiService;
            break;
          case 'perplexity':
            service = services.perplexityService;
            break;
          default:
            continue;
        }

        if (service) {
          const fallbackResponse = await service.generate(prompt);
          return {
            ...fallbackResponse,
            fallbackFrom: failedProvider,
            provider: provider
          };
        }
      } catch (fallbackError) {
        console.warn(`Fallback to ${provider} also failed:`, fallbackError.message);
        continue; // Try next fallback
      }
    }

    return null; // No fallback succeeded
  }

  /**
   * Validate API keys before making requests
   */
  static validateAPIKeys() {
    const requiredKeys = [
      { key: process.env.ANTHROPIC_API_KEY, name: 'Anthropic (Claude)' },
      { key: process.env.OPENAI_API_KEY, name: 'OpenAI' },
      { key: process.env.GOOGLE_API_KEY, name: 'Google (Gemini)' },
      { key: process.env.PERPLEXITY_API_KEY, name: 'Perplexity' }
    ];

    const missingKeys = requiredKeys
      .filter(item => !item.key || item.key === 'your_anthropic_api_key_here')
      .map(item => item.name);

    if (missingKeys.length > 0) {
      console.warn('Warning: Missing or default API keys for:', missingKeys.join(', '));
      return { valid: false, missingKeys };
    }

    return { valid: true, missingKeys: [] };
  }
}

module.exports = { ErrorHandler };