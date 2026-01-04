# LLM Business Idea Comparator

A backend prototype to compare different LLM providers for hobby-to-business idea generation. This application evaluates how well various LLMs structure ideas for small business contexts and support early-stage entrepreneurs with practical framing.

## Features

- Compare responses from Claude, OpenAI, Gemini, and Perplexity
- Normalize responses for consistent comparison
- Calculate metrics for clarity, feasibility, structure, and relevance
- Fallback logic when primary LLMs fail
- Cost and latency analysis
- Simple web interface for testing

## Prerequisites

- Node.js 16+ 
- API keys for the LLM providers you want to use:
  - Anthropic (Claude)
  - OpenAI (GPT-4)
  - Google (Gemini)
  - Perplexity

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with your API keys:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
PORT=3000
```

## Usage

1. Start the server:

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

2. Open your browser to `http://localhost:3000`
3. Enter your prompt and click "Compare LLM Responses"
4. View the comparison results

## API Endpoints

- `GET /` - Web interface
- `POST /api/compare` - Compare LLM responses
- `GET /api/health` - Health check

## Architecture

### Core Components

- **Services**: Individual LLM API integrations in `/services/`
- **Utils**: Response normalization and comparison logic in `/utils/`
- **Server**: Express.js server with API endpoints

### Response Normalization

The system normalizes responses by:
1. Parsing structured elements (target markets, testing approaches, skills)
2. Calculating metrics for clarity, feasibility, structure, and relevance
3. Generating comparative analysis

### Error Handling & Fallbacks

- Comprehensive error handling for each LLM provider
- Standardized error responses
- Fallback logic when primary LLMs fail
- API key validation

## Sample Prompt

The application includes a sample prompt focused on graphic design hobby-to-business transformation:

> A college student enjoys graphic design and makes posters for college events. They are unsure whether this can become a reliable income source. Suggest: Five alternative target markets, Three low-risk ways to test if this can become a business, One skill they should focus on learning next to improve their income potential. Write as if advising someone with limited capital and high uncertainty.

## Analysis & Comparison

The application includes documentation comparing:
- Cost per provider
- Latency characteristics
- Reliability metrics
- Quality of responses
- Production considerations

See `analysis.md` for detailed comparison and `scaling.md` for production considerations.

## Project Structure

```
.
├── server.js                 # Main Express server
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
├── services/                # LLM API integrations
│   ├── claudeService.js
│   ├── openaiService.js
│   ├── geminiService.js
│   └── perplexityService.js
├── utils/                   # Utilities
│   ├── responseNormalizer.js
│   ├── comparisonGenerator.js
│   └── errorHandler.js
├── public/                  # Web interface
│   └── index.html
├── analysis.md              # LLM comparison analysis
└── scaling.md               # Production considerations
```

## Trade-offs and Assumptions

1. **API Costs**: Different providers have different pricing models - costs are estimated based on token usage
2. **Latency**: Online models (like Perplexity) may have higher latency due to web search
3. **Response Quality**: Quality varies by provider and prompt complexity
4. **Rate Limits**: Each provider has different rate limiting policies
5. **Fallback Logic**: When a primary LLM fails, the system attempts to use alternatives

## Production Considerations

For production use, consider:
- Implementing response caching
- Adding authentication and user management
- Setting up proper monitoring and alerting
- Using secure vaults for API keys
- Implementing proper rate limiting
- Adding database storage for historical comparisons
- Setting up proper logging and observability

See `scaling.md` for detailed production considerations.

## License

MIT