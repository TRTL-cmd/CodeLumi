// Copyright (c) 2026 Tortol studios. All rights reserved.
// Contact: Tortolcoin@gmail.com
// Proprietary — do not reproduce, distribute, or sell without permission.

import React from 'react';
import './styles.css';

// Codelumi uses index.html directly - no React rendering needed
console.log('Codelumi renderer loaded - using index.html');

window.addEventListener('error', (ev) => {
  console.error('Global error', ev.error || ev.message);
  const r = document.getElementById('root');
  if (r) r.innerHTML = '<div style="padding:24px;font-family:Arial;color:#333"><h2>Codelumi encountered an error</h2><p>Open developer tools to see details.</p></div>';
});

// --- Self-learn controls UI (minimal DOM-based) ---
(() => {
  try {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.right = '12px';
    container.style.top = '12px';
    container.style.zIndex = '9999';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '6px';

    const panel = document.createElement('div');
    panel.style.background = 'rgba(255,255,255,0.95)';
    panel.style.border = '1px solid #ddd';
    panel.style.padding = '8px';
    panel.style.borderRadius = '8px';
    panel.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
    panel.style.minWidth = '180px';

    const title = document.createElement('div');
    title.textContent = 'Self-Learn';
    title.style.fontSize = '12px';
    title.style.fontWeight = '600';
    title.style.marginBottom = '6px';
    panel.appendChild(title);

    // Personality small panel: show only current tone (read-only)
    const personaRow = document.createElement('div');
    personaRow.style.display = 'flex';
    personaRow.style.flexDirection = 'column';
    personaRow.style.marginBottom = '8px';
    const personaLabel = document.createElement('div');
    personaLabel.textContent = 'Personality (Lumi)';
    personaLabel.style.fontSize = '11px';
    personaLabel.style.fontWeight = '600';
    personaLabel.style.marginBottom = '4px';
    personaRow.appendChild(personaLabel);
    const personaDisplay = document.createElement('div');
    personaDisplay.style.fontSize = '12px';
    personaDisplay.style.color = '#222';
    personaDisplay.style.padding = '6px';
    personaDisplay.style.border = '1px solid #eee';
    personaDisplay.style.borderRadius = '6px';
    personaDisplay.textContent = 'Loading...';
    personaRow.appendChild(personaDisplay);
    panel.appendChild(personaRow);

    async function refreshPersonalityUI(){
      try{
        const cur: any = await (window as any).lumi.personality.getTone();
        const listRes: any = await (window as any).lumi.personality.list();
        const tones = (listRes && listRes.ok && Array.isArray(listRes.tones)) ? listRes.tones : [];
        if (cur && cur.ok && cur.tone) {
          const found = tones.find((t: any) => t.id === cur.tone);
          personaDisplay.textContent = found ? `${found.name} — ${found.description || ''}` : String(cur.tone);
        } else {
          personaDisplay.textContent = 'Default';
        }
      }catch(e){ personaDisplay.textContent = 'Unavailable'; }
    }

    // initial refresh of personality UI
    try{ refreshPersonalityUI(); }catch(_){ }

    // Toggle: enable/disable self-learn
    const toggleRow = document.createElement('div');
    toggleRow.style.display = 'flex';
    toggleRow.style.alignItems = 'center';
    toggleRow.style.gap = '8px';
    toggleRow.style.marginBottom = '8px';
    const toggleLabel = document.createElement('label');
    toggleLabel.textContent = 'Enabled';
    toggleLabel.style.fontSize = '12px';
    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.title = 'Toggle self-learning on/off (persisted)';
    toggleRow.appendChild(toggleInput);
    toggleRow.appendChild(toggleLabel);
    panel.appendChild(toggleRow);

    const statusEl = document.createElement('div');
    statusEl.textContent = 'Status: idle';
    statusEl.style.fontSize = '12px';
    statusEl.style.marginBottom = '6px';
    panel.appendChild(statusEl);

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '6px';

    const startBtn = document.createElement('button');
    startBtn.textContent = 'Start';
    const pauseBtn = document.createElement('button');
    pauseBtn.textContent = 'Pause';
    const undoBtn = document.createElement('button');
    undoBtn.textContent = 'Undo';
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';

    [startBtn, pauseBtn, undoBtn, resetBtn].forEach(b => { b.style.fontSize = '12px'; b.style.padding = '6px 8px'; });
    btnRow.appendChild(startBtn);
    btnRow.appendChild(pauseBtn);
    btnRow.appendChild(undoBtn);
    btnRow.appendChild(resetBtn);
    panel.appendChild(btnRow);

    const showSugBtn = document.createElement('button');
    showSugBtn.textContent = 'Show Suggestions';
    showSugBtn.style.fontSize = '12px';
    showSugBtn.style.padding = '6px 8px';
    btnRow.appendChild(showSugBtn);

    const rateRow = document.createElement('div');
    rateRow.style.marginTop = '8px';
    rateRow.style.display = 'flex';
    rateRow.style.gap = '6px';
    const rateInput = document.createElement('input');
    rateInput.type = 'number';
    rateInput.value = '60';
    rateInput.style.width = '64px';
    const setRateBtn = document.createElement('button');
    setRateBtn.textContent = 'Set rate';
    setRateBtn.style.fontSize = '12px';
    rateRow.appendChild(rateInput);
    rateRow.appendChild(setRateBtn);
    panel.appendChild(rateRow);

    const watchRow = document.createElement('div');
    watchRow.style.marginTop = '8px';
    watchRow.style.display = 'flex';
    watchRow.style.flexDirection = 'column';
    watchRow.style.gap = '6px';
    const watchLabel = document.createElement('div');
    watchLabel.textContent = 'Watch folder';
    watchLabel.style.fontSize = '11px';
    watchLabel.style.fontWeight = '600';
    const watchPath = document.createElement('div');
    watchPath.textContent = 'Loading...';
    watchPath.style.fontSize = '11px';
    watchPath.style.color = '#333';
    watchPath.style.border = '1px solid #eee';
    watchPath.style.borderRadius = '6px';
    watchPath.style.padding = '6px';
    const pickBtn = document.createElement('button');
    pickBtn.textContent = 'Choose Folder';
    pickBtn.style.fontSize = '12px';
    watchRow.appendChild(watchLabel);
    watchRow.appendChild(watchPath);
    watchRow.appendChild(pickBtn);
    panel.appendChild(watchRow);

    const allowRow = document.createElement('div');
    allowRow.style.marginTop = '8px';
    allowRow.style.display = 'flex';
    allowRow.style.gap = '6px';
    const allowInput = document.createElement('input');
    allowInput.type = 'text';
    allowInput.placeholder = './src, ./src/components';
    allowInput.style.flex = '1';
    const addAllowBtn = document.createElement('button');
    addAllowBtn.textContent = 'Add allow';
    addAllowBtn.style.fontSize = '12px';
    allowRow.appendChild(allowInput);
    allowRow.appendChild(addAllowBtn);
    panel.appendChild(allowRow);

    const allowList = document.createElement('div');
    allowList.style.marginTop = '8px';
    allowList.style.maxHeight = '120px';
    allowList.style.overflow = 'auto';
    allowList.style.borderTop = '1px solid #eee';
    panel.appendChild(allowList);

    async function refreshConfigUI() {
      try {
        const r: any = await (window as any).lumi.getSelflearnConfig();
        const cfg = r && r.ok ? (r.config || {}) : {};
        // update enabled toggle
        try { toggleInput.checked = !!cfg.enabled; } catch (e) { }
        const arr = (cfg.watchPaths && Array.isArray(cfg.watchPaths)) ? cfg.watchPaths : ['Documents/Lumi'];
        try { watchPath.textContent = arr && arr.length ? String(arr[0]) : 'Documents/Lumi'; } catch (_e) { }
        allowList.innerHTML = '';
        for (const p of arr) {
          const row = document.createElement('div');
          row.style.display = 'flex'; row.style.justifyContent = 'space-between'; row.style.padding = '4px 0';
          const t = document.createElement('div'); t.textContent = p; t.style.fontSize = '12px'; t.style.color = '#333';
          const del = document.createElement('button'); del.textContent = 'Remove'; del.style.fontSize = '12px';
          del.addEventListener('click', async () => {
            const newArr = arr.filter((x: any) => x !== p);
            await (window as any).lumi.setSelflearnConfig({ watchPaths: newArr });
            refreshConfigUI();
          });
          row.appendChild(t); row.appendChild(del); allowList.appendChild(row);
        }
      } catch (e) { }
    }

    addAllowBtn.addEventListener('click', async () => {
      const v = allowInput.value.trim(); if (!v) return; try {
        const r: any = await (window as any).lumi.getSelflearnConfig();
        const cfg = r && r.ok ? (r.config || {}) : {};
        const arr = (cfg.watchPaths && Array.isArray(cfg.watchPaths)) ? cfg.watchPaths.slice() : [];
        arr.push(v);
        await (window as any).lumi.setSelflearnConfig({ watchPaths: arr });
        allowInput.value = '';
        refreshConfigUI();
        toast('Allowlist updated');
      } catch (e) { toast('Failed to update'); }
    });

    pickBtn.addEventListener('click', async () => {
      try {
        const resp = await ((window as any).lumi.selflearn && (window as any).lumi.selflearn.pickFolder ? (window as any).lumi.selflearn.pickFolder() : Promise.resolve({ ok: false }));
        if (resp && resp.ok && resp.folder) {
          await (window as any).lumi.setSelflearnConfig({ watchPaths: [resp.folder] });
          refreshConfigUI();
          toast('Watch folder updated');
        }
      } catch (_e) { toast('Folder select failed'); }
    });

    // Toggle handler: persist enabled flag and let main start/stop agent
    toggleInput.addEventListener('change', async () => {
      try {
        const r: any = await (window as any).lumi.getSelflearnConfig();
        const cfg = r && r.ok ? (r.config || {}) : {};
        cfg.enabled = !!toggleInput.checked;
        await (window as any).lumi.setSelflearnConfig(cfg);
        toast(`Self-learn ${cfg.enabled ? 'enabled' : 'disabled'}`);
        refreshStatus();
      } catch (e) { toast('Failed to update setting'); }
    });

    // Run now button
    const runNowBtn = document.createElement('button'); runNowBtn.textContent = 'Run now'; runNowBtn.style.fontSize = '12px'; runNowBtn.style.marginLeft = '8px';
    rateRow.appendChild(runNowBtn);
    // Hide the one-shot "Run now" button in deep-learn mode (background-only learning)
    try { runNowBtn.style.display = 'none'; } catch (e) { }
    runNowBtn.addEventListener('click', async () => {
      const r: any = await (window as any).lumi.runSelflearnNow();
      if (r && r.ok) toast('Scan executed'); else toast('Scan failed');
      refreshStatus();
    });

    refreshConfigUI();

    container.appendChild(panel);

    // toast container
    const toastWrap = document.createElement('div');
    toastWrap.style.position = 'fixed';
    toastWrap.style.right = '12px';
    toastWrap.style.bottom = '12px';
    toastWrap.style.zIndex = '10000';
    document.body.appendChild(container);
    document.body.appendChild(toastWrap);

    // suggestion modal
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.display = 'none';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.background = 'rgba(0,0,0,0.4)';
    modal.style.zIndex = '20000';
    const modalInner = document.createElement('div');
    modalInner.style.background = '#fff';
    modalInner.style.padding = '16px';
    modalInner.style.borderRadius = '8px';
    modalInner.style.width = '720px';
    modalInner.style.maxHeight = '70vh';
    modalInner.style.overflow = 'auto';
    modal.appendChild(modalInner);
    document.body.appendChild(modal);

    function renderSuggestions(items: any[]) {
      modalInner.innerHTML = '';
      const h = document.createElement('div');
      h.style.fontWeight = '700';
      h.style.marginBottom = '8px';
      h.textContent = `Suggestions (${items.length})`;
      modalInner.appendChild(h);
      for (const it of items) {
        const row = document.createElement('div');
        row.style.borderTop = '1px solid #eee';
        row.style.padding = '8px 0';
        const meta = document.createElement('div');
        meta.style.fontSize = '12px';
        meta.style.color = '#666';
        meta.textContent = `${it.path.split('/').pop()}:${it.line || '?'} • ${it.date || ''}`;
        const msg = document.createElement('div');
        msg.style.marginTop = '6px';
        msg.textContent = it.message;
        const ackBtn = document.createElement('button');
        ackBtn.textContent = 'Acknowledge';
        ackBtn.style.marginTop = '8px';
        ackBtn.addEventListener('click', async () => {
          try {
            const r: any = await (window as any).lumi.ackSuggestion(it.id);
            if (r && r.ok) { toast('Acknowledged'); row.remove(); }
            else toast('Ack failed');
          } catch (e) { toast('Ack error'); }
        });
        row.appendChild(meta);
        row.appendChild(msg);
        row.appendChild(ackBtn);
        modalInner.appendChild(row);
      }
      const close = document.createElement('div');
      close.style.marginTop = '12px';
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Close';
      closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
      close.appendChild(closeBtn);
      modalInner.appendChild(close);
    }

    function toast(msg: string, timeout = 4000) {
      const t = document.createElement('div');
      t.textContent = msg;
      t.style.background = '#111';
      t.style.color = '#fff';
      t.style.padding = '8px 12px';
      t.style.marginTop = '8px';
      t.style.borderRadius = '6px';
      t.style.opacity = '0.95';
      toastWrap.appendChild(t);
      setTimeout(() => { t.remove(); }, timeout);
    }

    async function refreshStatus() {
      try {
        const s: any = await (window as any).lumi.selflearn.status();
        if (s && s.ok && s.status) {
          const st = s.status;
          statusEl.textContent = `Status: ${st.running ? (st.paused ? 'paused' : 'running') : 'stopped'} (tokens:${Math.floor(st.tokens)}/${st.capacity})`;
        }
      } catch (e) { /* ignore */ }
    }

    startBtn.addEventListener('click', async () => {
      const r: any = await (window as any).lumi.selflearn.start();
      if (r && r.ok) toast('Self-learn started'); else toast('Start failed');
      refreshStatus();
    });
    pauseBtn.addEventListener('click', async () => {
      // toggle pause/resume
      const s: any = await (window as any).lumi.selflearn.status();
      const running = s?.status?.running;
      const paused = s?.status?.paused;
      if (!running) {
        const r: any = await (window as any).lumi.selflearn.start();
        if (r && r.ok) toast('Started');
      } else if (!paused) {
        const r: any = await (window as any).lumi.selflearn.pause();
        if (r && r.ok) toast('Paused');
      } else {
        const r: any = await (window as any).lumi.selflearn.resume();
        if (r && r.ok) toast('Resumed');
      }
      refreshStatus();
    });
    undoBtn.addEventListener('click', async () => {
      const r: any = await (window as any).lumi.selflearn.undo(1);
      if (r && r.ok) toast(`Undo removed ${r.removedCount} items`); else toast('Undo failed');
      refreshStatus();
    });
    resetBtn.addEventListener('click', async () => {
      const ok = confirm('Reset self-learn data? This cannot be undone here.');
      if (!ok) return;
      const r: any = await (window as any).lumi.selflearn.reset();
      if (r && r.ok) toast('Reset OK'); else toast('Reset failed');
      refreshStatus();
    });
    setRateBtn.addEventListener('click', async () => {
      const rpm = Number(rateInput.value) || 60;
      const r: any = await (window as any).lumi.selflearn.setRate(rpm);
      if (r && r.ok) toast(`Rate set ${r.capacity}/min`); else toast('Rate set failed');
      refreshStatus();
    });

    showSugBtn.addEventListener('click', async () => {
      try {
        const r: any = await (window as any).lumi.listSuggestions();
        if (r && r.ok) {
          renderSuggestions(r.suggestions || []);
          modal.style.display = 'flex';
        } else toast('No suggestions available');
      } catch (e) { toast('Failed to load suggestions'); }
    });

    (window as any).lumi.onLearningEvent((p: any) => {
      try {
        if (p && p.type === 'learned') toast(`Learned: ${p.entry.path.split('/').pop()}`);
        if (p && p.type === 'suggestion' && Array.isArray(p.suggestions) && p.suggestions.length) {
          toast(`Suggestions found for ${p.path.split('/').pop()}`);
          renderSuggestions(p.suggestions || []);
          modal.style.display = 'flex';
        }
        refreshStatus();
      } catch (e) { }
    });

    // initial status
    setTimeout(refreshStatus, 800);
  } catch (e) { console.error('Self-learn UI init failed', e); }
})();
