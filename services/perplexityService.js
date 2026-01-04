const OpenAI = require('openai');
const { ErrorHandler } = require('../utils/errorHandler');

class PerplexityService {
  constructor() {
    // Using OpenAI-compatible API for Perplexity
    this.client = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai', // Perplexity uses OpenAI-compatible API
    });
  }

  async generate(prompt, options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate API key first
      if (!process.env.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY === 'your_perplexity_api_key_here') {
        throw new Error('Perplexity API key is not configured');
      }
      
      const response = await this.client.chat.completions.create({
        model: options.model || 'llama-3-sonar-large-32k-online', // Using Perplexity's online model for current information
        messages: [
          {
            role: 'system',
            content: options.systemPrompt || 'You are an expert business advisor helping people turn their hobbies into viable business ideas. Provide clear, practical advice focused on market testing and revenue generation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.max_tokens || 1024,
        temperature: options.temperature || 0.7,
      });

      const endTime = Date.now();
      
      const choice = response.choices[0];
      return {
        model: options.model || 'Llama 3 Sonar Large 32K Online',
        response: choice?.message?.content || 'No response generated',
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0,
        },
        timestamp: new Date().toISOString(),
        latency: endTime - startTime
      };
    } catch (error) {
      const standardizedError = ErrorHandler.standardizeError(error, 'perplexity');
      console.error('Perplexity API error:', standardizedError);
      
      throw {
        ...standardizedError,
        originalError: error
      };
    }
  }
}

module.exports = { PerplexityService };