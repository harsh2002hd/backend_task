/**
 * Utility to generate comprehensive comparisons between LLM responses
 */
class ComparisonGenerator {
  /**
   * Generate a comparative analysis of responses from different models
   * @param {Object} normalizedResponses - Normalized responses from different models
   * @returns {Object} Comparative analysis
   */
  static generateComparison(normalizedResponses) {
    const models = Object.keys(normalizedResponses);
    const comparison = {
      summary: {
        totalModels: models.length,
        successfulResponses: models.filter(m => !normalizedResponses[m].error).length,
        failedResponses: models.filter(m => normalizedResponses[m].error).length
      },
      rankings: {
        clarity: this.getRankingByMetric(normalizedResponses, 'clarity'),
        feasibility: this.getRankingByMetric(normalizedResponses, 'feasibility'),
        structure: this.getRankingByMetric(normalizedResponses, 'structure'),
        relevance: this.getRankingByMetric(normalizedResponses, 'relevance')
      },
      analysis: {
        bestForClarity: this.getBestModelByMetric(normalizedResponses, 'clarity'),
        bestForFeasibility: this.getBestModelByMetric(normalizedResponses, 'feasibility'),
        bestForStructure: this.getBestModelByMetric(normalizedResponses, 'structure'),
        bestForRelevance: this.getBestModelByMetric(normalizedResponses, 'relevance')
      },
      detailedComparison: this.createDetailedComparison(normalizedResponses),
      costAnalysis: this.estimateCosts(normalizedResponses),
      latencyComparison: this.compareLatency(normalizedResponses)
    };

    return comparison;
  }

  /**
   * Get ranking of models by a specific metric
   */
  static getRankingByMetric(normalizedResponses, metric) {
    const rankings = [];
    
    for (const [model, data] of Object.entries(normalizedResponses)) {
      if (!data.error) {
        rankings.push({
          model: data.model,
          score: data.metrics[metric],
          rank: 0 // Will be set after sorting
        });
      }
    }
    
    // Sort by score descending and assign ranks
    rankings.sort((a, b) => b.score - a.score);
    rankings.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    return rankings;
  }

  /**
   * Get the best model for a specific metric
   */
  static getBestModelByMetric(normalizedResponses, metric) {
    let bestModel = null;
    let bestScore = -1;
    
    for (const [model, data] of Object.entries(normalizedResponses)) {
      if (!data.error && data.metrics[metric] > bestScore) {
        bestScore = data.metrics[metric];
        bestModel = {
          model: data.model,
          score: bestScore,
          response: data.normalizedOutput
        };
      }
    }
    
    return bestModel;
  }

  /**
   * Create detailed comparison showing strengths and weaknesses of each model
   */
  static createDetailedComparison(normalizedResponses) {
    const detailed = {};
    
    for (const [model, data] of Object.entries(normalizedResponses)) {
      if (data.error) {
        detailed[model] = {
          model: data.model,
          error: data.error,
          strengths: [],
          weaknesses: ['API Error - No response generated'],
          summary: 'Failed to generate response'
        };
        continue;
      }
      
      const strengths = [];
      const weaknesses = [];
      
      // Determine strengths based on high scores
      if (data.metrics.clarity >= 80) strengths.push('Excellent clarity and readability');
      else if (data.metrics.clarity >= 60) strengths.push('Good clarity');
      
      if (data.metrics.feasibility >= 80) strengths.push('Highly practical and feasible advice');
      else if (data.metrics.feasibility >= 60) strengths.push('Reasonably practical advice');
      
      if (data.metrics.structure >= 80) strengths.push('Well-structured response');
      else if (data.metrics.structure >= 60) strengths.push('Good structure');
      
      if (data.metrics.relevance >= 80) strengths.push('Highly relevant to business context');
      else if (data.metrics.relevance >= 60) strengths.push('Relevant to business context');
      
      // Determine weaknesses based on low scores
      if (data.metrics.clarity < 50) weaknesses.push('Poor clarity or readability');
      if (data.metrics.feasibility < 50) weaknesses.push('Lacks practical feasibility');
      if (data.metrics.structure < 50) weaknesses.push('Poorly structured response');
      if (data.metrics.relevance < 50) weaknesses.push('Low relevance to business context');
      
      // Default to some feedback if no specific strengths/weaknesses
      if (strengths.length === 0) {
        strengths.push('Adequate response');
      }
      if (weaknesses.length === 0) {
        weaknesses.push('No major weaknesses identified');
      }
      
      detailed[model] = {
        model: data.model,
        strengths,
        weaknesses,
        summary: this.generateModelSummary(data)
      };
    }
    
    return detailed;
  }

  /**
   * Generate a summary for a model's response
   */
  static generateModelSummary(data) {
    if (data.error) {
      return `Failed to generate response: ${data.error.message || data.error}`;
    }
    
    const { targetMarkets, testingApproaches, nextSkill } = data.normalizedOutput;
    
    return `Markets: ${targetMarkets.length}, Testing approaches: ${testingApproaches.length}, Next skill: ${nextSkill ? 'Yes' : 'None'}`;
  }

  /**
   * Estimate costs based on token usage (approximate)
   */
  static estimateCosts(normalizedResponses) {
    const costEstimates = {};
    let totalEstimatedCost = 0;
    
    for (const [model, data] of Object.entries(normalizedResponses)) {
      if (data.error) {
        costEstimates[model] = {
          estimatedCost: 0,
          details: 'No cost (API error)'
        };
        continue;
      }
      
      // Approximate costs based on typical pricing (per 1K tokens)
      let cost = 0;
      let details = '';
      
      if (model.includes('Claude')) {
        // Claude 3: ~$0.015/1K input tokens, ~$0.075/1K output tokens
        const inputTokens = data.usage?.input_tokens || 0;
        const outputTokens = data.usage?.output_tokens || 0;
        cost = (inputTokens * 0.015 / 1000) + (outputTokens * 0.075 / 1000);
        details = `${inputTokens} input + ${outputTokens} output tokens`;
      } else if (model.includes('GPT-4')) {
        // GPT-4: ~$0.03/1K input tokens, ~$0.06/1K output tokens
        const promptTokens = data.usage?.prompt_tokens || 0;
        const completionTokens = data.usage?.completion_tokens || 0;
        cost = (promptTokens * 0.03 / 1000) + (completionTokens * 0.06 / 1000);
        details = `${promptTokens} prompt + ${completionTokens} completion tokens`;
      } else {
        // Default estimation for other models
        const totalTokens = (data.usage?.total_tokens || data.usage?.input_tokens || 0) + 
                           (data.usage?.completion_tokens || data.usage?.output_tokens || 0);
        cost = totalTokens * 0.0001; // Generic estimate
        details = `${totalTokens} total tokens (est.)`;
      }
      
      costEstimates[model] = {
        estimatedCost: parseFloat(cost.toFixed(6)),
        details
      };
      
      totalEstimatedCost += cost;
    }
    
    return {
      perModel: costEstimates,
      totalEstimatedCost: parseFloat(totalEstimatedCost.toFixed(6))
    };
  }

  /**
   * Compare latency between models
   */
  static compareLatency(normalizedResponses) {
    const latencies = [];
    
    for (const [model, data] of Object.entries(normalizedResponses)) {
      if (!data.error && data.latency) {
        latencies.push({
          model: data.model,
          latency: data.latency,
          relativeSpeed: 1 // Will be calculated after sorting
        });
      }
    }
    
    // Sort by latency (fastest first) and calculate relative speeds
    latencies.sort((a, b) => a.latency - b.latency);
    
    if (latencies.length > 0) {
      const fastest = latencies[0].latency;
      latencies.forEach(item => {
        item.relativeSpeed = parseFloat((fastest / item.latency).toFixed(2));
      });
    }
    
    return {
      fastestModel: latencies.length > 0 ? latencies[0] : null,
      allLatencies: latencies
    };
  }
}

module.exports = { ComparisonGenerator };