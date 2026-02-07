import React, { useEffect, useState, useRef } from 'react';
import CodeEditorEnhanced from './CodeEditorEnhanced';

type Props = {
  assistantMessage?: string;
};

export default function AutoCodeBox({ assistantMessage }: Props) {
  const [visible, setVisible] = useState(false);
  const [code, setCode] = useState('');
  const [lang, setLang] = useState<'auto' | string>('auto');
  const lastAnalysisRef = useRef<{ base: string; fixed: string; language: string } | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const mainPath = ((window as any).editorRuntime && (window as any).editorRuntime.mainPath) || 'main.js';

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

  useEffect(() => {
    if (!assistantMessage) return;
    // crude detection: if assistant mentions "```" or returns code-like blocks, open
    if (/```/.test(assistantMessage) || /function\s+|console\.log\(|def\s+\w+\(/.test(assistantMessage)) {
      // extract between fences if present
      const m = assistantMessage.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/);
      const snippet = m ? m[1].trim() : assistantMessage;
      setCode(snippet);
      if (m && m[0].startsWith('```')) {
        const langMatch = assistantMessage.match(/```(\w+)/);
        if (langMatch) setLang(langMatch[1]);
      }
      setVisible(true);
    }
  }, [assistantMessage]);

  // Mount editor runtime and wire two-way sync
  useEffect(() => {
    const er = (window as any).editorRuntime;
    let mounted = false;
    if (er && typeof er.mount === 'function') {
      try{
        er.mount(mountRef.current, { path: mainPath }).then?.(() => { mounted = true; });
      }catch(e){ console.warn('editorRuntime.mount failed', e); }
    }

    // host -> react updates
    try{
      if (er && typeof er.onFileChange === 'function'){
        er.onFileChange((path: string, newCode: string) => {
          if (path === mainPath) setCode(newCode || '');
        });
      }
    }catch(e){ console.warn('editorRuntime.onFileChange hookup failed', e); }

    return () => {
      // no-op cleanup for now
    };
  }, []);

  if (!visible) return null;

  return (
    <div style={{ position: 'relative', border: '1px solid #e6e6e6', borderRadius: 6, padding: 8, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <strong>Code Sandbox</strong>
        <div>
          <button onClick={() => setVisible(false)} style={{ marginLeft: 8 }}>Close</button>
        </div>
      </div>
      <div ref={mountRef}>
        <CodeEditorEnhanced value={code} language={lang} onChange={(v:string)=>{
          setCode(v);
          // notify host about file changes
          try{
            const er = (window as any).editorRuntime;
            if (er && typeof er.updateFiles === 'function'){
              er.updateFiles([{ path: mainPath, code: v, lang }]);
            }
          }catch(e){ console.warn('editorRuntime.updateFiles failed', e); }
        }} />
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={async () => {
          try{
            const er = (window as any).editorRuntime;
            const res = er && typeof er.requestAnalyze === 'function' ? er.requestAnalyze(mainPath) : await (window as any).lumi.code.analyze(code, lang);
            console.log('Analyze result', res);
            if(res && res.issues){ alert('Analysis:\n' + (res.issues||[]).join('\n')); }
            if (res && res.fixed) {
              lastAnalysisRef.current = { base: code, fixed: res.fixed, language: res.language || lang || 'auto' };
            }
          }catch(e){ console.warn(e); }
        }}>Analyze</button>
        <button onClick={async () => {
          try{
            // prefer host-provided analyze/fix through editorRuntime
            const er = (window as any).editorRuntime;
            let res = null;
            if(er && typeof er.requestAnalyze === 'function') res = er.requestAnalyze(mainPath);
            if(!res && (window as any).lumi && (window as any).lumi.code && typeof (window as any).lumi.code.fix === 'function'){
              res = await (window as any).lumi.code.fix(code, lang);
            }
            if(res && res.fixed){
              const base = (lastAnalysisRef.current && lastAnalysisRef.current.base) || code;
              let merged = res.fixed;
              if (base && code && code !== base) {
                merged = threeWayMerge(base, code, res.fixed);
              }
              if (/<<<<<<< LOCAL/.test(merged)) {
                alert('Fix applied with conflicts. Please review conflict markers.');
              }
              setCode(merged);
              lastAnalysisRef.current = { base: merged, fixed: res.fixed, language: res.language || lang || 'auto' };
              try{
                const er2 = (window as any).editorRuntime;
                if(er2 && typeof er2.updateFiles === 'function') er2.updateFiles([{ path: mainPath, code: merged, lang }]);
              }catch(_){ }
            }
          }catch(e){ console.warn(e); }
        }} style={{ marginLeft: 8 }}>Fix</button>
      </div>
    </div>
  );
}
