require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { ClaudeService } = require('./services/claudeService');
const { OpenAIService } = require('./services/openaiService');
const { GeminiService } = require('./services/geminiService');
const { PerplexityService } = require('./services/perplexityService');
const { ResponseNormalizer } = require('./utils/responseNormalizer');
const { ComparisonGenerator } = require('./utils/comparisonGenerator');
const { ErrorHandler } = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Validate API keys on startup
const apiValidation = ErrorHandler.validateAPIKeys();
if (!apiValidation.valid) {
  console.warn('API key validation warning:', apiValidation.missingKeys);
}

// Initialize services
const claudeService = new ClaudeService();
const openaiService = new OpenAIService();
const geminiService = new GeminiService();
const perplexityService = new PerplexityService();

const services = {
  claudeService,
  openaiService, 
  geminiService,
  perplexityService
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/api/compare', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Record start time for latency measurement
    const startTime = Date.now();

    // Execute prompts on all LLMs in parallel with individual error handling and fallbacks
    const responses = {};
    
    // Process each service with potential fallback
    const serviceCalls = [
      executeWithFallback('claude', claudeService, prompt, services),
      executeWithFallback('openai', openaiService, prompt, services),
      executeWithFallback('gemini', geminiService, prompt, services),
      executeWithFallback('perplexity', perplexityService, prompt, services)
    ];
    
    const results = await Promise.allSettled(serviceCalls);
    
    // Map results to responses object
    const serviceNames = ['claude', 'openai', 'gemini', 'perplexity'];
    serviceNames.forEach((name, index) => {
      if (results[index].status === 'fulfilled') {
        responses[name] = results[index].value;
      } else {
        responses[name] = { error: results[index].reason };
      }
    });

    const endTime = Date.now();
    const totalLatency = endTime - startTime;

    // Normalize responses for comparison
    const normalizedResponses = ResponseNormalizer.normalizeResponses(responses);
    
    // Generate comprehensive comparison
    const comparison = ComparisonGenerator.generateComparison(normalizedResponses);

    res.json({ 
      responses, 
      normalizedResponses,
      comparison,
      totalLatency,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error processing comparison:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const validation = ErrorHandler.validateAPIKeys();
  res.json({ 
    status: 'OK', 
    apiKeysValid: validation.valid,
    missingKeys: validation.missingKeys,
    timestamp: new Date().toISOString() 
  });
});

// Helper function to execute a service call with fallback
async function executeWithFallback(serviceName, service, prompt, allServices) {
  try {
    const result = await service.generate(prompt);
    return result;
  } catch (error) {
    console.warn(`${serviceName} service failed, attempting fallback:`, error.message);
    
    // Try to get a fallback response
    const fallbackResult = await ErrorHandler.applyFallback(prompt, serviceName, allServices);
    
    if (fallbackResult) {
      console.log(`Fallback successful using ${fallbackResult.provider} for ${serviceName} request`);
      return fallbackResult;
    } else {
      console.error(`All fallbacks failed for ${serviceName}`);
      throw error;
    }
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API key validation: ${apiValidation.valid ? 'PASSED' : 'WARNING - Check .env file'}`);
});