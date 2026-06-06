# Router Agent - On-Device Content Classification

StudentOS now includes a sophisticated Router Agent that uses **WebLLM** to classify uploaded content directly on the user's device before sending it to backend workflows.

## Overview

The Router Agent is an AI-powered classifier that automatically categorizes user-uploaded content into different types so that the appropriate specialized agents can process it. It runs entirely on-device for privacy and performance, with an intelligent fallback to cloud classification.

## How It Works

### 1. **Upload Flow**
When a user uploads content (OCR text, documents, images):
```
Upload → OCR Extraction → Router Agent → Intent Classification
```

### 2. **Router Classification**
The Router Agent classifies content into one of 7 categories:

| Intent | Description | Recommended Agents |
|--------|-------------|-------------------|
| **assignment** | School/university assignments | Study, Schedule |
| **notes** | Study notes or lecture notes | Study, Schedule |
| **receipt** | Expense receipts or invoices | Expense |
| **job_post** | Job postings or career opportunities | Schedule |
| **event** | Events, meetings, calendar items | Schedule |
| **mess_menu** | Food menus or meal information | Health |
| **general** | Other content | Content |

### 3. **Output Format**
```json
{
  "intent": "assignment",
  "confidence": 0.95,
  "recommendedAgents": ["study", "schedule"],
  "processedLocally": true
}
```

## Architecture

### Two-Tier Processing

#### Tier 1: On-Device (WebLLM)
- **Model**: Mistral-7B-Instruct-v0.2-q4f32_1
- **Processing**: 100% on user's device
- **Privacy**: No data sent to servers
- **Speed**: Fast inference after model loads
- **Reliability**: Fallback to cloud if load fails

#### Tier 2: Cloud Fallback
- **Endpoint**: `/api/router`
- **Method**: Keyword-based classification
- **Processing**: Fast keyword matching
- **Accuracy**: ~60-70% (good for fallback)
- **Availability**: Always available as backup

### Graceful Degradation

If WebLLM:
- Takes too long to initialize (>3 seconds) → Fall back to cloud
- Fails to load → Immediately use cloud router
- Returns parse errors → Cloud router handles it
- User has weak device → Cloud provides instant classification

## Implementation Details

### Router Service (`lib/services/RouterService.ts`)

The `RouterService` provides a clean abstraction over the routing logic:

```typescript
// Route content locally with cloud fallback
const result = await routeContentLocally(content)

// Result includes:
{
  intent: 'assignment',           // Detected intent
  confidence: 0.95,               // Confidence score
  recommendedAgents: ['study', 'schedule'],
  processedLocally: true,         // Was it on-device or cloud?
  error?: 'string'                // Optional error message
}
```

### Cloud Router (`app/api/router/route.ts`)

Simple keyword-based classifier that runs on the server:

```typescript
POST /api/router
{
  "content": "Physics assignment about motion forces..."
}

Response:
{
  "intent": "assignment",
  "confidence": 0.6,
  "recommendedAgents": ["study", "schedule"]
}
```

### Router Flow Component (`components/agents/RouterFlow.tsx`)

Visual display of the routing process:

```
📥 Upload Received
↓
🔀 On-Device Router  
↓
🎯 Intent Detected
↓
🤖 Agents Selected
↓
⚙️ Processing
```

Shows:
- Real-time animation of each step
- Detected intent and confidence
- Recommended agents
- "Processed Locally on Device" badge

## Features

### ✅ On-Device Processing
- No data leaves user's device during routing
- Fast inference after model download
- Works offline after initial load
- Privacy-first approach

### ✅ Intelligent Fallback
- Automatic fallback to cloud if WebLLM unavailable
- 3-second timeout prevents UI freeze
- User sees results either way
- Transparent processing indicator

### ✅ User Feedback
- Real-time animation showing routing steps
- Clear badge indicating "Processed Locally"
- Confidence scores displayed
- Recommended agents listed

### ✅ Extensible Design
- Easy to add new intent categories
- Custom prompt for different classification tasks
- Pluggable model selection
- Cloud endpoint remains simple keyword-based

## Integration with Workflows

After routing, content flows to specialized agents:

```
🔀 Router Agent (Classifies)
   ↓
🤖 Specialized Agents (Process based on intent)
   ├─ Study Agent (assignments, notes)
   ├─ Schedule Agent (events, deadlines)
   ├─ Expense Agent (receipts)
   ├─ Health Agent (menus)
   └─ Content Agent (general)
```

Each agent receives:
- Original content
- Detected intent
- Confidence score
- Previously recommended agents

## Performance

| Metric | On-Device | Cloud Fallback |
|--------|-----------|----------------|
| **Speed** | ~1-2s after model loads | ~200ms |
| **Model Size** | ~4GB (Q4 quantized) | - |
| **Processing** | Entirely local | Server-side |
| **Privacy** | Complete | Standard |
| **Network** | None needed | 1 request |

### First Load Time
- Model download: ~2-3 minutes (one-time, cached)
- Initialization: ~3-5 seconds
- Inference: ~1-2 seconds
- **Fallback kicks in after 3 seconds if needed**

## Usage Examples

### Basic Usage
```typescript
import { routeContentLocally } from '@/lib/services/RouterService'

const content = 'Physics assignment on quantum mechanics. Due Friday.'
const result = await routeContentLocally(content)

console.log(result.intent) // "assignment"
console.log(result.recommendedAgents) // ["study", "schedule"]
```

### With Error Handling
```typescript
try {
  const result = await routeContentLocally(userContent)
  
  if (result.error) {
    // Cloud fallback was used
    console.log('Used cloud fallback:', result.error)
  } else if (result.processedLocally) {
    // Show "Processed Locally" badge
    showBadge('Processed Locally on Device')
  }
  
  // Use the intent regardless of source
  const agents = result.recommendedAgents
} catch (err) {
  // Final fallback if both fail
  showError('Routing service unavailable')
}
```

### In Components
```typescript
const [routingResult, setRoutingResult] = useState(null)

useEffect(() => {
  const route = async () => {
    const result = await routeContentLocally(uploadedContent)
    setRoutingResult(result)
  }
  route()
}, [uploadedContent])

return (
  <RouterFlow
    intent={routingResult?.intent}
    processedLocally={routingResult?.processedLocally}
    recommendedAgents={routingResult?.recommendedAgents}
  />
)
```

## Configuration

### Model Selection
Edit `lib/services/RouterService.ts` to change the WebLLM model:

```typescript
// Faster model (smaller, quicker)
engine = await CreateMLCEngine('TinyLlama-1.1B-Chat-v1.0-q4f16_1')

// More accurate (larger, slower)
engine = await CreateMLCEngine('Mistral-7B-Instruct-v0.2-q4f32_1')

// Or specify your own model from MLC-LLM
```

### Custom Intents
To add new intent categories:

1. Update `ContentIntent` type in `RouterService.ts`
2. Add to `recommendedAgentMap`
3. Update prompt in `intentPrompt`
4. Test with keyword fallback in `/api/router`

### Prompt Engineering
The router uses this system prompt. Customize it for different classification needs:

```
Classify the following content into ONE of these categories:
- assignment: School or university assignments
- notes: Study notes or lecture notes
...

Return ONLY a JSON object with this format:
{"intent": "...", "confidence": 0.95}
```

## Future Enhancements

1. **Custom Models**: Support user-specified models
2. **Streaming**: Stream classification results as user uploads
3. **Confidence Thresholds**: Different handling for low-confidence results
4. **Multi-Intent**: Detect multiple intents in one document
5. **Learning**: Improve classification based on user feedback
6. **Batch Processing**: Route multiple documents efficiently
7. **Metrics**: Track router accuracy and performance

## Troubleshooting

### "Processed Locally" badge not showing?
- WebLLM model is still downloading (first time)
- Device is using cloud fallback
- Check browser console for errors

### Classification seems inaccurate?
- Cloud fallback is using keyword matching only
- WebLLM model may need more context
- Try providing longer content samples
- Check if intent category matches your content

### Slow performance?
- WebLLM model needs time to load (first time only)
- Subsequent requests should be faster
- Cloud fallback provides instant results
- Consider reducing content length

### Browser compatibility?
- WebLLM requires WebGPU or WebAssembly
- Check browser support: https://webgpu.dev/
- Cloud fallback works on all browsers
- Mobile devices may use cloud fallback due to resource constraints

## Privacy & Security

✅ **Privacy Guarantees:**
- On-device processing: 0% data sent to servers during routing
- No model parameters leak user content
- Cloud fallback only sends content for classification
- No logs or tracking of classifications
- User data never stored on servers

✅ **Security:**
- Content sanitization before prompt injection
- JSON parsing validated
- Timeout prevents infinite loops
- Error boundaries prevent crashes
- Graceful degradation if components fail

## API Reference

### routeContentLocally(content: string): Promise<RouterResult>

Routes content using WebLLM with cloud fallback.

**Parameters:**
- `content` (string): Text to classify (max 500 chars after truncation)

**Returns:**
```typescript
{
  intent: ContentIntent,           // Detected category
  confidence: number,              // 0-1 confidence score
  recommendedAgents: string[],     // Suggested agents
  processedLocally: boolean,       // Whether on-device or cloud
  error?: string                   // Optional error message
}
```

### unloadEngine(): void

Manually unload the WebLLM engine to free memory.

```typescript
import { unloadEngine } from '@/lib/services/RouterService'

// When user leaves app or wants to free memory
unloadEngine()
```

## Contributing

To improve the router:

1. Add test cases with example content
2. Update the prompt for better accuracy
3. Add new intent categories
4. Improve keyword matching in cloud fallback
5. Report accuracy issues with examples

---

**Built with WebLLM for StudentOS** - Intelligent content routing at the edge.
