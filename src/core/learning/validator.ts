export interface CandidateLike { [key: string]: any }

export class CandidateValidator {
  // Very small validator: ensures q/a exist and returns a simple confidence score
  async validate(candidate: CandidateLike): Promise<{ valid: boolean; score: number }>{
    try{
      if(!candidate || !candidate.q || !candidate.a) return { valid: false, score: 0 };
      const base = typeof candidate.confidence === 'number' ? candidate.confidence : 0.6;
      // give slight penalty for short answers/questions
      const len = Math.max(1, (String(candidate.q||'') + String(candidate.a||'')).length);
      const score = Math.min(1, base * (Math.min(1, len / 40)) );
      return { valid: score >= 0.5, score };
    }catch(_){ return { valid: false, score: 0 }; }
  }
}

export default CandidateValidator;
