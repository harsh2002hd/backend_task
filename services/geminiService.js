const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ErrorHandler } = require('../utils/errorHandler');

class GeminiService {
  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    this.model = this.client.getGenerativeModel({ model: 'gemini-pro' }); // Using Gemini Pro
  }

  async generate(prompt, options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate API key first
      if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'your_google_api_key_here') {
        throw new Error('Google API key is not configured');
      }
      
      const result = await this.model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: `${options.systemPrompt || "You are an expert business advisor helping people turn their hobbies into viable business ideas. Provide clear, practical advice focused on market testing and revenue generation."}\n\n${prompt}`
          }]
        }],
        generationConfig: {
          maxOutputTokens: options.max_tokens || 1024,
          temperature: options.temperature || 0.7,
        }
      });

      const endTime = Date.now();
      const response = result.response;
      
      return {
        model: 'Gemini Pro',
        response: response.text() || 'No response generated',
        usage: {
          // Note: Google Generative AI doesn't provide detailed token usage in the free tier
          input_tokens: 0, // Not available in this SDK
          output_tokens: 0, // Not available in this SDK
        },
        timestamp: new Date().toISOString(),
        latency: endTime - startTime
      };
    } catch (error) {
      const standardizedError = ErrorHandler.standardizeError(error, 'gemini');
      console.error('Gemini API error:', standardizedError);
      
      throw {
        ...standardizedError,
        originalError: error
      };
    }
  }
}

module.exports = { GeminiService };