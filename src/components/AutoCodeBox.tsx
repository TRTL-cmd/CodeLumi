import React, { useEffect } from 'react';

type Props = {
  assistantMessage?: string;
};

export default function AutoCodeBox({ assistantMessage }: Props) {
  useEffect(() => {
    if (!assistantMessage) return;
    if (!/```|function\s+|console\.log\(|def\s+\w+\(/.test(assistantMessage)) return;
    const m = assistantMessage.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/);
    const snippet = m ? m[1].trim() : assistantMessage;
    const langMatch = assistantMessage.match(/```(\w+)/);
    const lang = langMatch ? langMatch[1] : 'auto';
    try {
      const sandbox = (window as any).codeSandbox;
      if (sandbox && typeof sandbox.merge === 'function') {
        sandbox.merge(snippet, lang === 'auto' ? 'text' : lang);
        if (typeof sandbox.setLanguage === 'function') sandbox.setLanguage(lang === 'auto' ? 'text' : lang);
        if (typeof sandbox.open === 'function') sandbox.open();
      }
    } catch (e) {
      // ignore sandbox routing failures
    }
  }, [assistantMessage]);

  function threeWayMerge(base: string, local: string, remote: string) {
    const b = (base || '').split('\n');
    const l = (local || '').split('\n');
    const r = (remote || '').split('\n');
    const max = Math.max(b.length, l.length, r.length);
    const out: string[] = [];
    for (let i = 0; i < max; i++) {
      const bb = b[i] === undefined ? '' : b[i];
      const ll = l[i] === undefined ? '' : l[i];
      const rr = r[i] === undefined ? '' : r[i];
      if (ll === rr) { out.push(ll); continue; }
      if (ll === bb && rr !== bb) { out.push(rr); continue; }
      if (rr === bb && ll !== bb) { out.push(ll); continue; }
      out.push('<<<<<<< LOCAL');
      out.push(ll);
      out.push('=======');
      out.push(rr);
      out.push('>>>>>>> REMOTE');
    }
    return out.join('\n');
  }

  return null;
}
