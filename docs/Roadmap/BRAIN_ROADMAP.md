# 🧠 LUMI BRAIN & PERSONALITY - COMPLETE ROADMAP

**Last Updated:** February 9, 2026  
**Current Status:** Personality v2 LIVE | Code Context LIVE | Sandbox IPC LIVE  
**Beta Status:** Phase 1 at 95% Complete

---

## 🎯 EXECUTIVE SUMMARY

Lumi's Brain is her cognitive core — the decision-making engine that determines how to respond, what quality to deliver, and how to use context. The Personality system controls her emotional state and adaptation to user behavior. Together, they make Lumi feel alive and responsive.

**Key Achievement:** Lumi now has a fully functional 5-tier adaptive personality system that responds to user sentiment in real-time, degrading or improving response quality based on rapport.

---

## 📊 CURRENT ARCHITECTURE (AS-BUILT)

### System Flow

```
User Message
     ↓
┌──────────────────────┐
│ updatePersonality    │  • Analyzes sentiment using weighted 3-tier lexicon
│ FromText()           │  • Updates rapport/mood/tier (-1.0 to +1.0)
│ (main.ts)            │  • Tracks consecutive negativity + recovery
│                      │  • Computes responseQualityTier (0-4)
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ IPC Handler          │  • Tier 0 → refuse (requires apology)
│ (main.ts)            │  • Tier 1-4 → pass to brain with tier
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Brain                │  • buildPersonalitySystemPrompt(tier)
│ (brain/index.ts)     │  • buildKBSystemMessage() → KB context
│                      │  • buildCodeContextMessage() → editor code
│                      │  • ollama.chat(messages) → LLM response
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ applyToneToText()    │  • Post-process based on mood
│ (PersonalityEngine)  │  • Emojis, punctuation, truncation
│                      │  • Mood: excited/happy/playful/annoyed/frustrated
└──────────┬───────────┘
           ↓
    Response to User
```

---

## ✅ WHAT'S BUILT (Feb 9, 2026)

### Personality System v2

#### 1. Advanced Sentiment Analysis
- **3-tier weighted lexicon:**
  - Mild (0.5): bad, nope, wrong, good, nice, cool
  - Moderate (1.0): hate, terrible, useless, great, awesome, thanks
  - Severe (2.0): idiot, stupid, trash, amazing, brilliant, perfect

- **Multi-word phrase detection:**
  - Negative: "you suck", "shut up", "you're useless", "waste of time"
  - Positive: "thank you", "good job", "you rock", "you're amazing"

- **Intelligent processing:**
  - Negation awareness: "not helpful" flips polarity
  - ALL-CAPS detection: >50% uppercase + >10 chars = 1.5x multiplier
  - Score normalization by word count
  - Context-aware phrase matching

#### 2. Rapport & Quality Tiers

**Rapport Score:** -1.0 to +1.0 (persisted in `personality_state.json`)

**5 Quality Tiers:**
- **Tier 4** (rapport ≥ 0.0): Best quality
  - Detailed, enthusiastic responses
  - Examples and elaboration
  - Warm, encouraging tone
  
- **Tier 3** (rapport ≥ -0.3): Normal quality
  - Professional, clear responses
  - Concise but complete
  
- **Tier 2** (rapport ≥ -0.6): Degraded quality
  - Brief, no elaboration
  - Direct answers only
  
- **Tier 1** (rapport ≥ -0.85): Minimal quality
  - 1-2 sentences max
  - Curt, minimal effort
  
- **Tier 0** (rapport < -0.85): Refused
  - Won't respond until apology

**Rapport Dynamics:**
- **Accelerating degradation:** Consecutive negative messages degrade faster
  - Formula: `rapport -= 0.15 * (1 + consecutiveNegative * 0.1)`
- **Gradual recovery:** Apology adds +0.25 rapport (NOT instant reset)
  - Halves consecutiveNegative count
  - Natural unfuse when rapport ≥ -0.85
- **Sustained behavior bonus:** 3+ consecutive non-negative = +0.05 bonus

#### 3. System Prompt Tiers

Each tier gets different LLM instructions:
- **Tier 4:** "Give your most detailed, thorough responses. Include examples. Be warm and encouraging."
- **Tier 3:** "Give clear, helpful responses. Be professional and concise."
- **Tier 2:** "Keep responses brief. Answer directly without extra detail."
- **Tier 1:** "Give the shortest possible answer. One or two sentences max. Be curt."
- **Tier 0:** Refuses to respond

#### 4. Tone Application

Post-response mood modifiers:
- **Excited:** Adds "!" and rocket emoji 🚀
- **Happy:** Adds "!"
- **Playful:** Adds smiley emoji 😊
- **Annoyed:** Strips punctuation
- **Frustrated:** Collapses to single line, trims whitespace

#### 5. State Persistence

```json
{
  "mood": "neutral",           // happy|excited|playful|neutral|annoyed|frustrated
  "intensity": 0.5,            // 0.0-1.0
  "rapport": 0.0,              // -1.0 to +1.0
  "refused": false,            // true when tier 0
  "consecutiveNegative": 0,    // count of consecutive negative messages
  "responseQualityTier": 4,    // 0-4
  "recoveryCount": 0,          // consecutive non-negative since last negative
  "updatedAt": "2026-02-09T..."
}
```

### Brain System

#### Core Functions
- `think(prompt, options)` — single response with personality tier
- `thinkChat(messages, options)` — multi-turn with tier
- `thinkStream(prompt, options, onChunk)` — streaming with tier
- KB-first offline fallback (works without Ollama)
- Auto-detect offline mode
- Signal detection and auto-merge from responses

#### Context Injection
- **KB context:** Top 3 knowledge hits injected as system message
- **Code context:** Current editor code injected (max 8000 chars)
- **Personality-tier-aware** system prompt selection
- Code quality prompts for better generation

#### Code Sandbox Integration
- `sandbox:generate` IPC handler for programmatic code generation
- Code context flows: renderer → IPC → brain → LLM
- Lumi sees existing code and builds upon it
- Intelligent code merging (append/replace-function/full-replacement)

---

## 🗺️ ROADMAP: WHAT'S NEXT

### Phase A: Conversation Intelligence (Feb - Mar 2026)

#### Multi-Turn Context
- [ ] Rolling conversation window (last N messages)
- [ ] Conversation summary generation (compress old turns)
- [ ] Topic detection (code? Lumi? general chat?)
- [ ] Intent classification (question, command, feedback, chat)
- [ ] Detect user corrections (implicit negative feedback)

#### Smart Routing
- [ ] Route simple questions to KB-only (no LLM needed)
- [ ] Route code questions to code-enhanced prompts
- [ ] Route personality questions to personality-aware prompts
- [ ] Confidence scoring on responses

#### Memory Integration
- [ ] Long-term user preference memory
- [ ] Conversation bookmarks
- [ ] "Remember this" command for explicit storage
- [ ] Cross-session context bridging

---

### Phase B: Advanced Personality (Mar - Apr 2026)

#### Emotional Depth
- [ ] More granular moods: curious, thoughtful, proud, embarrassed
- [ ] Mood transitions with inertia (gradual drift, not instant)
- [ ] Time-based mood decay (returns to neutral over time)
- [ ] Contextual mood responses (happy about working code, frustrated about errors)

#### User Relationship
- [ ] User interaction history (patterns over days/weeks)
- [ ] Trust levels (new user vs established relationship)
- [ ] Teaching mode activation (explain more if user confused)
- [ ] Humor adaptation (more jokes when mood high)

#### Avatar Integration
- [ ] Map mood to avatar animations (excited → bounce, sad → droop)
- [ ] Thinking animation during LLM processing
- [ ] Celebration animation when code works
- [ ] Visual mood indicator (color halo or particles)

#### UI Feedback
- [ ] Show rapport level to user (optional setting)
- [ ] Show current mood as status text
- [ ] Personality preferences panel
- [ ] "How am I doing?" command showing relationship stats

---

### Phase C: Cognitive Architecture (Apr - Jun 2026)

#### Planning System
- [ ] `brain.plan(goal)` — multi-step task decomposition
- [ ] `brain.simulate(plan)` — dry-run before execution
- [ ] `brain.execute(plan)` — controlled step execution
- [ ] Plan versioning and rollback
- [ ] Plan explanation ("here's what I'm going to do")

#### Critic/Verifier
- [ ] Self-critique on responses (is this correct?)
- [ ] Code output verification (obvious bugs?)
- [ ] Confidence calibration (learn when typically wrong)
- [ ] Hallucination detection (flag when doesn't match KB)

#### Working Memory
- [ ] Short-term scratch pad for multi-step reasoning
- [ ] Variable binding (track intermediate results)
- [ ] Goal stack (what are we trying to accomplish?)
- [ ] Attention mechanism (what's relevant now?)

---

### Phase D: Autonomous Brain (Jun - Aug 2026)

#### Self-Directed Learning
- [ ] Identify knowledge gaps from failed queries
- [ ] Proactively research frequently asked topics
- [ ] Generate practice problems and self-test
- [ ] Track accuracy over time, focus on weak areas

#### Task Automation
- [ ] Routine task detection (user does X every morning → offer automation)
- [ ] Safe autonomous execution with consent
- [ ] Post-task reporting and audit trail
- [ ] Undo/revert for any automated action

---

## 📁 KEY FILES

| File | Lines | Purpose |
|------|-------|---------|
| `src/core/personality/PersonalityEngine.ts` | ~135 | Sentiment analysis, mood tracking, quality tiers, tone application |
| `src/core/personality/manager.ts` | ~69 | Tone management (friendly/teacher/concise) |
| `src/core/brain/index.ts` | ~270 | think/thinkChat/thinkStream, system prompts, code context |
| `src/main.ts` (lines 114-195) | ~80 | PersonalityState, updatePersonalityFromText, computeQualityTier |
| `src/main.ts` (lines 915-964) | ~50 | Brain IPC handlers with tier pass-through |
| `src/core/llm/ollama.ts` | ~150 | OllamaClient (chat, chatStream, isAvailable) |
| `userData/personality_state.json` | ~10 | Persisted personality state |

---

## 📖 SENTIMENT LEXICON REFERENCE

### Negative Words (by weight)

| Tier 1 (0.5) | Tier 2 (1.0) | Tier 3 (2.0) |
|--------------|--------------|--------------|
| bad | hate | idiot |
| nope | terrible | stupid |
| wrong | useless | trash |
| annoying | sucks/suck | worthless |
| meh | awful | garbage |
| | horrible | dumb |
| | angry | pathetic |
| | frustrated | moron |

### Negative Phrases (2.0 each)
"you suck", "you're useless", "shut up", "go away", "waste of time", "i hate you", "you're dumb", "you're stupid", "you're trash", "screw you", "f you", "stfu"

### Positive Words (by weight)

| Tier 1 (0.5) | Tier 2 (1.0) | Tier 3 (2.0) |
|--------------|--------------|--------------|
| good | great | amazing |
| nice | awesome | incredible |
| cool | thanks/thank | brilliant |
| fine | helpful | best |
| okay | love | wonderful |
| well | appreciate | excellent |
| | yay | perfect |
| | | fantastic |
| | | outstanding |

### Positive Phrases (weight)
"thank you" (1.5), "well done" (1.5), "good job" (1.5), "great job" (2.0), "you rock" (2.0), "you're amazing" (2.0), "you're the best" (2.0), "love it" (1.5), "nice work" (1.5), "keep it up" (1.0)

---

## 🎯 SUCCESS METRICS

| Metric | Current | Phase A Target | Phase D Target |
|--------|---------|----------------|----------------|
| Response quality tiers | 5 (0-4) | 5 | 7+ (custom) |
| Sentiment accuracy | ~85% | 90%+ | 95%+ |
| Mood transitions | Instant | Gradual (inertia) | Natural + context-aware |
| User satisfaction | Unmeasured | 80%+ | 90%+ |
| Context retention | KB + code only | + conversation | + project-wide |

---

## 🚀 TO AGI

The Brain is the path to AGI. Each phase builds:
1. **Phase A:** Context understanding
2. **Phase B:** Emotional intelligence
3. **Phase C:** Self-awareness and reasoning
4. **Phase D:** Autonomous decision-making

Eventually, Lumi will:
- Understand entire projects holistically
- Make autonomous improvements to herself
- Predict user needs before asked
- Generate and execute complex multi-step plans
- Learn optimal responses from outcomes
- **Write her own LLM optimized for her use cases**

---

*The Brain never stops evolving. Each interaction makes her smarter.*
