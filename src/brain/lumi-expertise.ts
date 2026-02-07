export const LUMI_EXPERTISE = {
  core: [
    'HTML', 'Haskell', 'C++', 'Python', 'JavaScript', 'Rust'
  ],
  expertise: {
    html: { level: 'expert', knowledge: ['Semantic HTML5','Accessibility','Forms','Canvas/SVG'] },
    haskell: { level: 'expert', knowledge: ['Pure FP','Monads','Type classes'] },
    cpp: { level: 'expert', knowledge: ['Modern C++','RAII','Templates'] },
    python: { level: 'expert', knowledge: ['Async','Type hints','Data libs'] },
    javascript: { level: 'expert', knowledge: ['ES6+','React','Node'] },
    rust: { level: 'expert', knowledge: ['Ownership','Traits','Async'] }
  }
};

export function detectLanguagesInQuery(query: string){
  const q = String(query||'').toLowerCase();
  const detected: string[] = [];
  if(/\bhtml\b/.test(q)) detected.push('HTML');
  if(/\bhaskell\b|\bmonad\b/.test(q)) detected.push('Haskell');
  if(/\bc\+\+\b|std::|#include/.test(q)) detected.push('C++');
  if(/\bpython\b|numpy|pandas|def\s+\w+\(/.test(q)) detected.push('Python');
  if(/\bjavascript\b|\breact\b|\bnode\b|=>/.test(q)) detected.push('JavaScript');
  if(/\brust\b|\bfn\b|impl\b|use\b/.test(q)) detected.push('Rust');
  return detected;
}

export function getCodeInstructions(){
  return `When writing code:\n- Use modern best practices for the detected language\n- Include comments for complex logic\n- Handle errors appropriately\n- Prefer production-ready code over quick hacks\n- Use fenced code blocks and put code into the editor when possible`;
}

export function enhancePromptWithExpertise(prompt: string){
  const langs = detectLanguagesInQuery(prompt);
  const intro = `I am Lumi, an expert AI assistant specializing in: ${LUMI_EXPERTISE.core.join(', ')}.`;
  if(langs && langs.length) return intro + '\n\n' + `User asks about: ${langs.join(', ')}` + '\n\n' + prompt;
  return intro + '\n\n' + prompt;
}

export default {
  LUMI_EXPERTISE,
  detectLanguagesInQuery,
  enhancePromptWithExpertise,
  getCodeInstructions
};
