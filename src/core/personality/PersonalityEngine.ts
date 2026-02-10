// PersonalityEngine: sentiment tracking, quality tiers, and tone application
export type Mood = 'happy' | 'excited' | 'playful' | 'neutral' | 'annoyed' | 'frustrated';

// Weighted sentiment lexicons — higher weight = stronger signal
const POSITIVE_WORDS: Array<[string, number]> = [
  // Tier 1 (mild, 0.5)
  ['good', 0.5], ['nice', 0.5], ['cool', 0.5], ['fine', 0.5], ['okay', 0.5], ['well', 0.5],
  // Tier 2 (moderate, 1.0)
  ['great', 1], ['awesome', 1], ['thanks', 1], ['thank', 1], ['helpful', 1], ['love', 1],
  ['appreciate', 1], ['yay', 1],
  // Tier 3 (strong, 2.0)
  ['amazing', 2], ['incredible', 2], ['brilliant', 2], ['best', 2], ['wonderful', 2],
  ['excellent', 2], ['perfect', 2], ['fantastic', 2], ['outstanding', 2],
];

const NEGATIVE_WORDS: Array<[string, number]> = [
  // Tier 1 (mild, 0.5)
  ['bad', 0.5], ['nope', 0.5], ['wrong', 0.5], ['annoying', 0.5], ['meh', 0.5],
  // Tier 2 (moderate, 1.0)
  ['hate', 1], ['terrible', 1], ['useless', 1], ['sucks', 1], ['suck', 1],
  ['awful', 1], ['horrible', 1], ['angry', 1], ['frustrated', 1],
  // Tier 3 (severe, 2.0)
  ['idiot', 2], ['stupid', 2], ['trash', 2], ['worthless', 2], ['garbage', 2],
  ['dumb', 2], ['pathetic', 2], ['moron', 2],
];

// Multi-word phrases scored at tier 3
const NEGATIVE_PHRASES: Array<[string, number]> = [
  ['you suck', 2], ["you're useless", 2], ['shut up', 2], ['go away', 2],
  ['waste of time', 2], ['i hate you', 2], ["you're dumb", 2], ["you're stupid", 2],
  ["you're trash", 2], ['screw you', 2], ['f you', 2], ['stfu', 2],
];

const POSITIVE_PHRASES: Array<[string, number]> = [
  ['thank you', 1.5], ['well done', 1.5], ['good job', 1.5], ['great job', 2],
  ['you rock', 2], ["you're amazing", 2], ["you're the best", 2], ['love it', 1.5],
  ['nice work', 1.5], ['keep it up', 1],
];

const NEGATION_WORDS = ['not', "don't", "doesn't", "didn't", 'never', 'no', "isn't", "aren't", "wasn't", "won't", "can't", "couldn't"];

export default class PersonalityEngine {
  private _mood: Mood = 'neutral';
  private _intensity = 0.5; // 0.0 - 1.0
  private _history: Array<{t:number,type:string,source?:string,score?:number}> = [];
  private _consecutiveNegativeCount = 0;
  private _responseQualityTier = 4; // 0-4 where 4 = best

  constructor(init?: { mood?: Mood, intensity?: number, consecutiveNegative?: number, responseQualityTier?: number }){
    if(init?.mood) this._mood = init.mood;
    if(typeof init?.intensity === 'number') this._intensity = Math.max(0, Math.min(1, init.intensity));
    if(typeof init?.consecutiveNegative === 'number') this._consecutiveNegativeCount = init.consecutiveNegative;
    if(typeof init?.responseQualityTier === 'number') this._responseQualityTier = init.responseQualityTier;
  }

  getStats(){
    return {
      mood: this._mood,
      intensity: this._intensity,
      historyLen: this._history.length,
      consecutiveNegative: this._consecutiveNegativeCount,
      responseQualityTier: this._responseQualityTier,
    };
  }

  analyzeSentiment(text: string): number {
    if(!text) return 0;
    const t = (text || '').toLowerCase();
    const words = t.split(/\s+/);
    let score = 0;

    // Check multi-word phrases first (higher priority)
    for (const [phrase, weight] of NEGATIVE_PHRASES) {
      if (t.includes(phrase)) score -= weight;
    }
    for (const [phrase, weight] of POSITIVE_PHRASES) {
      if (t.includes(phrase)) score += weight;
    }

    // Check individual words with negation awareness
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      // Check if preceded by negation (within 3 tokens)
      const hasNegation = words.slice(Math.max(0, i - 3), i).some(w => NEGATION_WORDS.includes(w));

      for (const [pos, weight] of POSITIVE_WORDS) {
        if (word.includes(pos)) {
          score += hasNegation ? -weight * 0.7 : weight; // negated positive → negative
          break;
        }
      }
      for (const [neg, weight] of NEGATIVE_WORDS) {
        if (word.includes(neg)) {
          score += hasNegation ? weight * 0.5 : -weight; // negated negative → mild positive
          break;
        }
      }
    }

    // ALL-CAPS detection: shouting/anger multiplier
    if (text.length > 10) {
      const alphaChars = text.replace(/[^a-zA-Z]/g, '');
      const upperChars = alphaChars.replace(/[^A-Z]/g, '');
      if (alphaChars.length > 5 && upperChars.length / alphaChars.length > 0.5) {
        // More than 50% uppercase = shouting
        if (score < 0) score *= 1.5; // amplify negativity
        else if (score === 0) score = -0.3; // neutral shouting reads as aggressive
      }
    }

    // Normalize based on word count
    const wordCount = Math.max(1, words.length);
    const normalized = score / (2 * Math.sqrt(wordCount));
    return Math.max(-1, Math.min(1, normalized));
  }

  feed(text: string, source = 'user'){
    try{
      const s = this.analyzeSentiment(text);
      this._history.push({ t: Date.now(), type: 'feed', source, score: s });

      if (s <= -0.2) {
        this._consecutiveNegativeCount++;
        // Accelerate degradation for consecutive negativity
        const accelWeight = Math.min(0.5, Math.abs(s) * (1 + this._consecutiveNegativeCount * 0.15));
        this.recordNegative(accelWeight);
      } else if (s >= 0.2) {
        this._consecutiveNegativeCount = 0;
        this.recordPositive(Math.min(0.3, s));
      } else {
        // Neutral — don't reset consecutive count, but don't increase it either
      }
    }catch(e){ }
  }

  recordPositive(weight = 0.1){
    this._history.push({ t: Date.now(), type: 'positive', score: weight });
    this._intensity = Math.min(1, this._intensity + weight);
    if(this._intensity > 0.75) this._mood = 'excited';
    else if(this._intensity > 0.55) this._mood = 'happy';
    else this._mood = 'playful';
  }

  recordNegative(weight = 0.12){
    this._history.push({ t: Date.now(), type: 'negative', score: -weight });
    this._intensity = Math.max(0, this._intensity - weight);
    if(this._intensity < 0.2) this._mood = 'frustrated';
    else if(this._intensity < 0.4) this._mood = 'annoyed';
    else this._mood = 'neutral';
  }

  applyToneToResponse(text: string){
    if(!text) return text;
    switch(this._mood){
      case 'excited': return text.replace(/\s*$/,'!') + ' 🚀';
      case 'happy': return text.replace(/\s*$/,'!');
      case 'playful': return text + (/[!?]$/.test(text) ? ' 😄' : ' 😉');
      case 'annoyed': return text.replace(/!+$/,'').replace(/\s*$/,'');
      case 'frustrated': return text.replace(/\s*$/,'').split('\n').map(l=>l.trim()).join(' ').replace(/\s+/g,' ').trim();
      default: return text;
    }
  }
}
