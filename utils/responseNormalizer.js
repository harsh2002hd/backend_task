/**
 * Utility to normalize LLM responses for comparison
 */
class ResponseNormalizer {
  /**
   * Normalize responses from different LLMs to a comparable schema
   * @param {Object} responses - Object containing responses from different models
   * @returns {Object} Normalized responses with consistent schema
   */
  static normalizeResponses(responses) {
    const normalized = {};
    
    for (const [modelName, response] of Object.entries(responses)) {
      if (response.error) {
        normalized[modelName] = {
          model: modelName,
          error: response.error,
          normalizedOutput: null,
          metrics: {
            clarity: 0,
            feasibility: 0,
            structure: 0,
            relevance: 0
          }
        };
        continue;
      }

      // Extract structured information from response
      const parsed = this.parseBusinessIdeaResponse(response.response);
      
      normalized[modelName] = {
        model: response.model || modelName,
        rawResponse: response.response,
        normalizedOutput: parsed,
        metrics: {
          clarity: this.calculateClarityScore(parsed),
          feasibility: this.calculateFeasibilityScore(parsed),
          structure: this.calculateStructureScore(parsed),
          relevance: this.calculateRelevanceScore(parsed, response.response)
        },
        usage: response.usage,
        timestamp: response.timestamp,
        latency: response.latency
      };
    }
    
    return normalized;
  }

  /**
   * Parse the business idea response to extract structured information
   * @param {string} response - Raw response from LLM
   * @returns {Object} Structured business idea information
   */
  static parseBusinessIdeaResponse(response) {
    const result = {
      targetMarkets: [],
      testingApproaches: [],
      nextSkill: '',
      advice: '',
      strengths: [],
      weaknesses: []
    };

    // Extract target markets (look for patterns like "1.", "2.", "3." or bullet points)
    const marketRegex = /(?:^|\n)\s*[0-9]+\.?\s*(.*?)(?=\n[0-9]+\.?|$)/gi;
    const marketMatches = [...response.matchAll(marketRegex)];
    
    // Filter for market-related content
    const marketKeywords = ['market', 'customer', 'target', 'audience', 'client'];
    for (const match of marketMatches) {
      const text = match[1].trim();
      if (this.containsAnyKeyword(text, marketKeywords) || text.toLowerCase().includes('alternative')) {
        result.targetMarkets.push(text);
      }
    }

    // If no markets found with numbers, try keyword-based extraction
    if (result.targetMarkets.length === 0) {
      const alternativeMarketRegex = /(?:markets?|targets?|customers?|audiences?):?\s*(.*?)(?=\n\n|$)/gi;
      const altMatches = [...response.matchAll(alternativeMarketRegex)];
      for (const match of altMatches) {
        const text = match[1].trim();
        result.targetMarkets.push(text);
      }
    }

    // Extract testing approaches
    const testRegex = /(?:testing|test|ways?|methods?):?\s*(.*?)(?=\n\n|$)/gi;
    const testMatches = [...response.matchAll(testRegex)];
    for (const match of testMatches) {
      result.testingApproaches.push(match[1].trim());
    }

    // Look for numbered lists for testing approaches
    const testApproachRegex = /(?:^|\n)\s*[0-9]+\.?\s*(.*?)(?=\n[0-9]+\.?|$)/gi;
    const testApproachMatches = [...response.matchAll(testApproachRegex)];
    
    // Filter for testing-related content
    const testKeywords = ['test', 'try', 'experiment', 'validate', 'check', 'verify', 'low-risk', 'experiment'];
    for (const match of testApproachMatches) {
      const text = match[1].trim();
      if (this.containsAnyKeyword(text, testKeywords) || text.toLowerCase().includes('risk')) {
        result.testingApproaches.push(text);
      }
    }

    // Extract next skill
    const skillRegex = /(?:skill|learn|focus|develop):?\s*(.*?)(?=\n|$)/gi;
    const skillMatches = [...response.matchAll(skillRegex)];
    if (skillMatches.length > 0) {
      result.nextSkill = skillMatches[0][1].trim();
    } else {
      // Look for skill-related phrases
      const skillPhraseRegex = /(?:should\s+)?learn\s+(.*?)(?:\s+next|\.|\n|$)/gi;
      const skillPhraseMatches = [...response.matchAll(skillPhraseRegex)];
      if (skillPhraseMatches.length > 0) {
        result.nextSkill = skillPhraseMatches[0][1].trim();
      }
    }

    // Extract general advice
    result.advice = response.substring(0, Math.min(response.length, 500)); // First 500 chars as summary

    return result;
  }

  /**
   * Check if text contains any of the keywords
   * @param {string} text - Text to check
   * @param {string[]} keywords - Array of keywords to look for
   * @returns {boolean} True if any keyword is found
   */
  static containsAnyKeyword(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  /**
   * Calculate clarity score based on structure and readability
   */
  static calculateClarityScore(parsed) {
    let score = 0;
    
    // Points for having structured elements
    if (parsed.targetMarkets.length > 0) score += 25;
    if (parsed.testingApproaches.length > 0) score += 25;
    if (parsed.nextSkill) score += 25;
    
    // Points for clear formatting (numbered lists, etc.)
    const responseText = JSON.stringify(parsed);
    if (responseText.includes('1.') || responseText.includes('2.') || responseText.includes('3.')) score += 15;
    if (responseText.includes('- ') || responseText.includes('* ')) score += 10;
    
    return Math.min(100, score);
  }

  /**
   * Calculate feasibility score based on practical advice
   */
  static calculateFeasibilityScore(parsed) {
    let score = 0;
    
    // Points for specific, actionable advice
    if (parsed.testingApproaches.length >= 2) score += 30;
    if (parsed.targetMarkets.length >= 3) score += 25;
    
    // Check for practical elements
    const responseText = JSON.stringify(parsed).toLowerCase();
    if (responseText.includes('low-risk') || responseText.includes('minimal investment')) score += 15;
    if (responseText.includes('test') || responseText.includes('validate')) score += 15;
    if (responseText.includes('capital') || responseText.includes('budget')) score += 15;
    
    return Math.min(100, score);
  }

  /**
   * Calculate structure score based on organization
   */
  static calculateStructureScore(parsed) {
    let score = 0;
    
    // Points for having all required sections
    if (parsed.targetMarkets.length > 0) score += 25;
    if (parsed.testingApproaches.length > 0) score += 25;
    if (parsed.nextSkill) score += 25;
    if (parsed.advice) score += 25;
    
    return score;
  }

  /**
   * Calculate relevance score based on topic alignment
   */
  static calculateRelevanceScore(parsed, rawResponse) {
    let score = 0;
    
    const responseLower = rawResponse.toLowerCase();
    
    // Points for addressing key business elements
    if (responseLower.includes('business') || responseLower.includes('income')) score += 20;
    if (responseLower.includes('market') || responseLower.includes('customer')) score += 20;
    if (responseLower.includes('test') || responseLower.includes('validate')) score += 20;
    if (responseLower.includes('skill') || responseLower.includes('learn')) score += 20;
    if (responseLower.includes('capital') || responseLower.includes('investment')) score += 20;
    
    return Math.min(100, score);
  }
}

module.exports = { ResponseNormalizer };