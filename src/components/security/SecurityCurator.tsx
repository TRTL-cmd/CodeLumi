import React, { useEffect, useState } from 'react';

declare global {
  interface Window {
    lumi?: any;
  }
}

type StagingItem = any;

export const SecurityCurator: React.FC = () => {
  const [items, setItems] = useState<StagingItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      if (window.lumi && window.lumi.listStaging) {
        const list = await window.lumi.listStaging();
        setItems(list || []);
      } else {
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function showDuplicates() {
    if (!window.lumi || !window.lumi.selflearn || !window.lumi.selflearn.listDuplicates) return;
    setLoading(true);
    try {
      const res = await window.lumi.selflearn.listDuplicates();
      if (res && res.ok) {
        // Keep groups structure so curator can choose per-group which index to keep
        const groups = res.groups || {};
        const grouped: any[] = [];
        for (const k of Object.keys(groups)) {
          const members = groups[k] || [];
          // members are log entries; ensure we attach original index
          grouped.push({ key: k, members: members.map((m: any) => Object.assign({}, m)) });
        }
        // Represent groups as items where each item has .groupKey and .members
        setItems(grouped as any);
      } else {
        console.warn('listDuplicates failed', res && res.error);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  async function approve(item: StagingItem) {
    if (!window.lumi || !window.lumi.approveStaging) return;
    await window.lumi.approveStaging(String(item.id));
    await refresh();
  }

  async function reject(item: StagingItem) {
    if (!window.lumi || !window.lumi.rejectStaging) return;
    const reason = await askInput('Rejection reason (optional):', 'manual');
    await window.lumi.rejectStaging(String(item.id), reason || 'manual');
    await refresh();
  }

  // Fallback prompt that works even when window.prompt is disabled (e.g., sandboxed renderer)
  async function askInput(message: string, defaultValue = ''): Promise<string | null> {
    // Always use DOM modal (avoids sandboxed prompt issues)
    return await new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed'; overlay.style.left = '0'; overlay.style.top = '0'; overlay.style.right = '0'; overlay.style.bottom = '0';
      overlay.style.background = 'rgba(0,0,0,0.4)'; overlay.style.display = 'flex'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
      overlay.style.zIndex = '10000';

      const box = document.createElement('div');
      box.style.background = '#fff'; box.style.padding = '12px'; box.style.borderRadius = '6px'; box.style.minWidth = '320px'; box.style.boxShadow = '0 6px 24px rgba(0,0,0,0.2)';

      const label = document.createElement('div'); label.textContent = message; label.style.marginBottom = '8px';
      const input = document.createElement('input'); input.type = 'text'; input.value = defaultValue; input.style.width = '100%'; input.style.boxSizing = 'border-box'; input.style.padding = '6px';
      const btnRow = document.createElement('div'); btnRow.style.marginTop = '8px'; btnRow.style.textAlign = 'right';
      const ok = document.createElement('button'); ok.textContent = 'OK'; ok.style.marginRight = '8px';
      const cancel = document.createElement('button'); cancel.textContent = 'Cancel';

      btnRow.appendChild(ok); btnRow.appendChild(cancel);
      box.appendChild(label); box.appendChild(input); box.appendChild(btnRow); overlay.appendChild(box);
      document.body.appendChild(overlay);
      input.focus();

      function cleanup() { try { overlay.remove(); } catch (_) {} }
      ok.addEventListener('click', () => { const v = input.value; cleanup(); resolve(v); });
      cancel.addEventListener('click', () => { cleanup(); resolve(null); });
      overlay.addEventListener('keydown', (ev: any) => {
        if (ev.key === 'Enter') { ev.preventDefault(); ok.click(); }
        if (ev.key === 'Escape') { ev.preventDefault(); cancel.click(); }
      });
    });
  }

  return (
    <div style={{ padding: 12 }}>
      <h3>Security Curator</h3>
      <button onClick={refresh} disabled={loading}>Refresh</button>
      <button onClick={showDuplicates} style={{ marginLeft: 8 }} disabled={loading}>Show Duplicates</button>
      <div style={{ marginTop: 12 }}>
        {loading && <div>Loading…</div>}
        {!loading && items.length === 0 && <div>No pending items</div>}
        <div>
          {items.map((group: any, gi: number) => (
            <div key={group.key || String(gi)} style={{ marginBottom: 12, border: '1px solid #ddd', padding: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><strong>Group:</strong> {String(group.key)}</div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>{(group.members||[]).length} duplicates</div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Choose which entry to keep</div>
                {(group.members || []).map((m: any, mi: number) => (
                  <label key={mi} style={{ display: 'block', marginBottom: 6 }}>
                    <input type="radio" name={`keep_${gi}`} value={String(m.index)} defaultChecked={mi===0} />
                    <span style={{ marginLeft: 8 }}><strong>Index:</strong> {String(m.index)} <strong>Sim:</strong> {Number(m.sim||0).toFixed(3)}</span>
                    <div style={{ marginLeft: 28, marginTop: 4, fontSize: '0.9rem' }}>{String(m.entry && (m.entry.q || m.entry.a) ? (m.entry.q || m.entry.a) : JSON.stringify(m.entry || {})).slice(0, 280)}</div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <button disabled={loading} onClick={async ()=>{
              // build removeIndices: for each group, remove all members except the one chosen
              try{
                const remove: number[] = [];
                for (let gi = 0; gi < items.length; gi++){
                  const group = items[gi];
                  const radios = document.getElementsByName(`keep_${gi}`) as NodeListOf<HTMLInputElement>;
                  let keepIndex: number | null = null;
                  for (let r = 0; r < radios.length; r++){ if(radios[r].checked) { keepIndex = Number(radios[r].value); break; } }
                  for (const m of group.members || []){
                    const idx = Number(m.index);
                    if (keepIndex === null) continue;
                    if (idx !== keepIndex) remove.push(idx);
                  }
                }
                // confirm
                if (!confirm(`Apply group decisions and remove ${remove.length} entries from training KB? This will create a backup.`)) return;
                // call main
                const res = await (window.lumi && window.lumi.selflearn && window.lumi.selflearn.applyGroups ? window.lumi.selflearn.applyGroups(remove) : (window.lumi && (window as any).lumi.applyGroups ? (window as any).lumi.applyGroups(remove) : null));
                if (res && res.ok) {
                  alert(`Applied; removed ${res.removed} entries. Kept ${res.kept}.`);
                  await refresh();
                } else {
                  alert('Apply failed: ' + (res && res.error ? res.error : 'unknown'));
                }
              }catch(e){ console.warn('apply groups failed', e); alert('Apply groups failed'); }
            }}>Apply Group Decisions</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityCurator;

/*
Integration notes:
- Expose the following preload IPC helpers for renderer:
  - window.lumi.listStaging(): Promise<StagingItem[]>
  - window.lumi.approveStaging(id: string): Promise<void>
  - window.lumi.rejectStaging(id: string, reason?: string): Promise<void>
- Wire those IPC handlers in `src/main.ts` calling `StagingManager`.
*/
