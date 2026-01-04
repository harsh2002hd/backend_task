const OpenAI = require('openai');
const { ErrorHandler } = require('../utils/errorHandler');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generate(prompt, options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate API key first
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        throw new Error('OpenAI API key is not configured');
      }
      
      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-4-turbo', // Using GPT-4 Turbo for better performance
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
        model: options.model || 'GPT-4 Turbo',
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
      const standardizedError = ErrorHandler.standardizeError(error, 'openai');
      console.error('OpenAI API error:', standardizedError);
      
      throw {
        ...standardizedError,
        originalError: error
      };
    }
  }
}

module.exports = { OpenAIService };