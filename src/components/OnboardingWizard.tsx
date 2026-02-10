import React, { useEffect, useMemo, useState } from 'react';

declare global {
  interface Window {
    lumi?: any;
  }
}

type Step = 0 | 1 | 2 | 3;

type OllamaStatus = {
  status: 'checking' | 'online' | 'offline' | 'error';
  message?: string;
};

const STORAGE_KEY = 'lumi_onboarding_complete';

export const OnboardingWizard: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({ status: 'checking' });
  const [lastCheck, setLastCheck] = useState<number | null>(null);

  const stepTitles = useMemo(() => [
    'Welcome',
    'Setup',
    'Features',
    'Done'
  ], []);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (done !== 'true') setVisible(true);
    } catch (_e) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    function onStart() {
      setStep(0);
      setVisible(true);
    }
    function onClose() {
      setVisible(false);
    }
    window.addEventListener('lumi-onboarding-start', onStart as any);
    window.addEventListener('lumi-onboarding-close', onClose as any);
    return () => {
      window.removeEventListener('lumi-onboarding-start', onStart as any);
      window.removeEventListener('lumi-onboarding-close', onClose as any);
    };
  }, []);

  async function checkOllama() {
    setOllamaStatus({ status: 'checking' });
    try {
      if (window.lumi && typeof window.lumi.ollamaStatus === 'function') {
        const res = await window.lumi.ollamaStatus();
        if (res && res.ok && res.available) {
          setOllamaStatus({ status: 'online' });
        } else {
          setOllamaStatus({ status: 'offline', message: res && res.error ? res.error : undefined });
        }
      } else {
        setOllamaStatus({ status: 'error', message: 'Ollama status API unavailable.' });
      }
    } catch (e: any) {
      setOllamaStatus({ status: 'error', message: e?.message || String(e) });
    } finally {
      setLastCheck(Date.now());
    }
  }

  useEffect(() => {
    if (!visible || step !== 1) return;
    checkOllama();
    const interval = setInterval(() => {
      if (ollamaStatus.status !== 'online') {
        checkOllama();
      }
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, step]);

  function completeOnboarding() {
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch (_e) { }
    setVisible(false);
  }

  function skipOnboarding() {
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch (_e) { }
    setVisible(false);
  }

  function goNext() {
    setStep((prev) => (prev < 3 ? ((prev + 1) as Step) : prev));
  }

  function goBack() {
    setStep((prev) => (prev > 0 ? ((prev - 1) as Step) : prev));
  }

  function runChatDemo() {
    try {
      const input = document.getElementById('question') as HTMLTextAreaElement | null;
      const askBtn = document.getElementById('ask') as HTMLButtonElement | null;
      if (input) {
        input.value = 'Show me a quick TypeScript helper for formatting dates.';
        input.focus();
      }
      if (askBtn) askBtn.click();
    } catch (_e) { }
  }

  function runCodeDemo() {
    try {
      const openCode = document.getElementById('openCode') as HTMLButtonElement | null;
      if (openCode) openCode.click();
    } catch (_e) { }
  }

  function runSelfLearnDemo() {
    try {
      const toggle = document.getElementById('selflearnToggle') as HTMLButtonElement | null;
      if (toggle) toggle.click();
    } catch (_e) { }
  }

  if (!visible) return null;

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="onboarding-step">Step {step + 1} of 4</div>
          <div className="onboarding-title">{stepTitles[step]}</div>
        </div>

        {step === 0 && (
          <div className="onboarding-body">
            <div className="onboarding-hero">Meet Lumi</div>
            <p>Lumi is your local AI coding companion. She learns from your workspace, keeps knowledge organized, and helps you ship faster.</p>
            <div className="onboarding-callout">
              <div className="onboarding-callout-title">What you get</div>
              <ul>
                <li>Private local-first chat and KB</li>
                <li>Self-learning from your project files</li>
                <li>Security curator for safe suggestions</li>
              </ul>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-body">
            <div className="onboarding-hero">Connect Ollama</div>
            <p>We will check your local Ollama service so Lumi can respond with AI-generated answers.</p>
            <div className={`onboarding-status status-${ollamaStatus.status}`}>
              <div className="status-pill">
                {ollamaStatus.status === 'online' && 'Ollama is online'}
                {ollamaStatus.status === 'checking' && 'Checking Ollama...'}
                {ollamaStatus.status === 'offline' && 'Ollama is offline'}
                {ollamaStatus.status === 'error' && 'Ollama check failed'}
              </div>
              {ollamaStatus.message ? <div className="status-note">{ollamaStatus.message}</div> : null}
              {lastCheck ? <div className="status-note">Last check: {new Date(lastCheck).toLocaleTimeString()}</div> : null}
            </div>
            <div className="onboarding-callout">
              <div className="onboarding-callout-title">If Ollama is not running</div>
              <ol>
                <li>Download and install: <a href="https://ollama.ai" target="_blank" rel="noreferrer">https://ollama.ai</a></li>
                <li>Install the model: <code>ollama pull gemma3:4b</code></li>
                <li>Leave Ollama running, then this wizard will auto-retry.</li>
              </ol>
            </div>
            <button className="onboarding-secondary" onClick={checkOllama}>Check again</button>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-body">
            <div className="onboarding-hero">Tour the features</div>
            <p>Try a quick demo of Lumi's core tools.</p>
            <div className="onboarding-demo-grid">
              <div className="demo-card">
                <div className="demo-title">Chat</div>
                <div className="demo-text">Ask Lumi a coding question and get a fast reply.</div>
                <button className="onboarding-secondary" onClick={runChatDemo}>Try chat</button>
              </div>
              <div className="demo-card">
                <div className="demo-title">Code Sandbox</div>
                <div className="demo-text">Open the editor and analyze or fix code.</div>
                <button className="onboarding-secondary" onClick={runCodeDemo}>Open sandbox</button>
              </div>
              <div className="demo-card">
                <div className="demo-title">Self-Learning</div>
                <div className="demo-text">Let Lumi scan and learn from your files.</div>
                <button className="onboarding-secondary" onClick={runSelfLearnDemo}>Toggle learning</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-body">
            <div className="onboarding-hero">You are ready</div>
            <p>Set up is complete. You can restart this tour anytime from Settings.</p>
            <div className="onboarding-callout">
              <div className="onboarding-callout-title">Next steps</div>
              <ul>
                <li>Ask Lumi for help on your current task.</li>
                <li>Review suggestions in the Security Curator.</li>
                <li>Adjust persona settings to your liking.</li>
              </ul>
            </div>
          </div>
        )}

        <div className="onboarding-footer">
          <button className="onboarding-ghost" onClick={skipOnboarding}>Skip</button>
          <div className="onboarding-nav">
            <button className="onboarding-secondary" onClick={goBack} disabled={step === 0}>Back</button>
            {step < 3 && <button className="onboarding-primary" onClick={goNext}>Continue</button>}
            {step === 3 && <button className="onboarding-primary" onClick={completeOnboarding}>Get Started</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
