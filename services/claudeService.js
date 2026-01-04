const Anthropic = require('@anthropic-ai/sdk');
const { ErrorHandler } = require('../utils/errorHandler');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generate(prompt, options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate API key first
      if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
        throw new Error('Anthropic API key is not configured');
      }
      
      const response = await this.client.messages.create({
        model: options.model || 'claude-3-5-sonnet-20240620', // Using the latest Claude model
        max_tokens: options.max_tokens || 1024,
        temperature: options.temperature || 0.7,
        system: options.systemPrompt || "You are an expert business advisor helping people turn their hobbies into viable business ideas. Provide clear, practical advice focused on market testing and revenue generation.",
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const endTime = Date.now();
      
      return {
        model: options.model || 'Claude 3.5 Sonnet',
        response: response.content[0]?.text || 'No response generated',
        usage: {
          input_tokens: response.usage?.input_tokens || 0,
          output_tokens: response.usage?.output_tokens || 0,
        },
        timestamp: new Date().toISOString(),
        latency: endTime - startTime
      };
    } catch (error) {
      const standardizedError = ErrorHandler.standardizeError(error, 'claude');
      console.error('Claude API error:', standardizedError);
      
      throw {
        ...standardizedError,
        originalError: error
      };
    }
  }
}

module.exports = { ClaudeService };