import React from 'react';
import ReactDOM from 'react-dom';
import OnboardingWizard from './components/OnboardingWizard';

declare global {
  interface Window {
    lumiOnboarding?: {
      start: () => void;
      close: () => void;
    };
  }
}

const STYLE_ID = 'lumi-onboarding-style';

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');

.onboarding-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at top left, rgba(255,122,182,0.18), rgba(7,16,26,0.95) 45%),
              radial-gradient(circle at 20% 80%, rgba(122,233,255,0.18), rgba(7,16,26,0.95) 55%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1002000;
  padding: 24px;
  animation: onboardingFade 350ms ease;
}

.onboarding-card {
  width: min(720px, 92vw);
  max-height: 90vh;
  overflow: auto;
  background: linear-gradient(160deg, rgba(16,26,42,0.98), rgba(7,16,26,0.98));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 26px;
  color: #e6eef8;
  box-shadow: 0 24px 80px rgba(2,6,23,0.7);
  font-family: 'Space Grotesk', 'Segoe UI', sans-serif;
}

.onboarding-header { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
.onboarding-step { text-transform: uppercase; font-size: 12px; letter-spacing: 0.16em; color: rgba(230,238,248,0.6); }
.onboarding-title { font-size: 28px; font-weight: 700; }
.onboarding-hero { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
.onboarding-body p { color: rgba(230,238,248,0.86); line-height: 1.6; }
.onboarding-callout { margin-top: 16px; padding: 14px 16px; border-radius: 12px; background: rgba(15,23,36,0.9); border: 1px solid rgba(255,255,255,0.05); }
.onboarding-callout-title { font-weight: 600; margin-bottom: 8px; }
.onboarding-callout ul, .onboarding-callout ol { margin: 8px 0 0 16px; color: rgba(230,238,248,0.82); }
.onboarding-status { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.status-pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; width: fit-content; }
.status-checking .status-pill { background: rgba(122,233,255,0.15); color: #7ae9ff; }
.status-online .status-pill { background: rgba(115,255,173,0.16); color: #73ffad; }
.status-offline .status-pill { background: rgba(255,169,122,0.2); color: #ffb98a; }
.status-error .status-pill { background: rgba(255,120,145,0.2); color: #ff7891; }
.status-note { font-size: 12px; color: rgba(230,238,248,0.7); }
.onboarding-demo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 16px; }
.demo-card { background: rgba(12,20,32,0.9); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.demo-title { font-weight: 600; }
.demo-text { font-size: 13px; color: rgba(230,238,248,0.7); line-height: 1.4; }

.onboarding-footer { margin-top: 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.onboarding-nav { display: flex; gap: 10px; }
.onboarding-primary { background: #ff7ab6; color: #0b1220; border: none; padding: 8px 16px; border-radius: 10px; font-weight: 600; cursor: pointer; }
.onboarding-secondary { background: rgba(255,255,255,0.08); color: #e6eef8; border: 1px solid rgba(255,255,255,0.1); padding: 8px 14px; border-radius: 10px; cursor: pointer; }
.onboarding-ghost { background: transparent; color: rgba(230,238,248,0.7); border: none; cursor: pointer; font-weight: 600; }

.onboarding-secondary:disabled { opacity: 0.45; cursor: not-allowed; }

@keyframes onboardingFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 640px) {
  .onboarding-card { padding: 20px; }
  .onboarding-title { font-size: 22px; }
}
`;
  document.head.appendChild(style);
}

function ensureMount() {
  let mount = document.getElementById('onboardingMount');
  if (!mount) {
    mount = document.createElement('div');
    mount.id = 'onboardingMount';
    document.body.appendChild(mount);
  }
  return mount;
}

function mountOnboarding() {
  ensureStyles();
  const mount = ensureMount();
  const maybeCreateRoot = (ReactDOM as any).createRoot;
  if (typeof maybeCreateRoot === 'function') {
    const root = maybeCreateRoot(mount);
    root.render(React.createElement(OnboardingWizard));
  } else {
    (ReactDOM as any).render(React.createElement(OnboardingWizard), mount);
  }
}

function setupGlobal() {
  window.lumiOnboarding = {
    start: () => window.dispatchEvent(new CustomEvent('lumi-onboarding-start')),
    close: () => window.dispatchEvent(new CustomEvent('lumi-onboarding-close'))
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupGlobal();
    mountOnboarding();
  });
} else {
  setupGlobal();
  mountOnboarding();
}
