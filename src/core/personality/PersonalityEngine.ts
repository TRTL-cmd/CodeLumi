// Simple PersonalityEngine: lightweight sentiment tracking and tone application
export type Mood = 'happy' | 'excited' | 'playful' | 'neutral' | 'annoyed' | 'frustrated';

export default class PersonalityEngine {
  private _mood: Mood = 'neutral';
  private _intensity = 0.5; // 0.0 - 1.0
  private _history: Array<{t:number,type:string,source?:string,score?:number}> = [];

  constructor(init?: { mood?: Mood, intensity?: number }){
    if(init?.mood) this._mood = init.mood;
    if(typeof init?.intensity === 'number') this._intensity = Math.max(0, Math.min(1, init.intensity));
  }

  getStats(){
    return { mood: this._mood, intensity: this._intensity, historyLen: this._history.length };
  }

  // lightweight sentiment heuristics (no external deps)
  analyzeSentiment(text: string){
    if(!text) return 0;
    const pos = ['good','great','awesome','thanks','thank','nice','love','awesome','cool','amazing','well','excellent','yay','wonderful'];
    const neg = ['bad','hate','stupid','suck','sucks','terrible','nope','wrong','annoy','angry','frustrat','idiot','useless','trash'];
    const t = (text||'').toLowerCase();
    let score = 0;
    for(const p of pos) if(t.includes(p)) score += 1;
    for(const n of neg) if(t.includes(n)) score -= 1;
    // normalize
    if(score > 0) return Math.min(1, score/4);
    if(score < 0) return Math.max(-1, score/4);
    return 0;
  }

  feed(text: string, source = 'user'){
    try{
      const s = this.analyzeSentiment(text);
      this._history.push({ t: Date.now(), type: 'feed', source, score: s });
      if(s >= 0.3) this.recordPositive(Math.min(0.25, s));
      else if(s <= -0.3) this.recordNegative(Math.min(0.3, Math.abs(s)));
    }catch(e){ }
  }

  recordPositive(weight = 0.1){
    this._history.push({ t: Date.now(), type: 'positive', score: weight });
    this._intensity = Math.min(1, this._intensity + weight);
    // nudge mood upward
    if(this._intensity > 0.75) this._mood = 'excited';
    else if(this._intensity > 0.55) this._mood = 'happy';
    else this._mood = 'playful';
  }

  recordNegative(weight = 0.12){
    this._history.push({ t: Date.now(), type: 'negative', score: -weight });
    this._intensity = Math.max(0, this._intensity - weight);
    // nudge mood downward
    if(this._intensity < 0.2) this._mood = 'frustrated';
    else if(this._intensity < 0.4) this._mood = 'annoyed';
    else this._mood = 'neutral';
  }

  // Apply a lightweight tone transformation to assistant text
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
