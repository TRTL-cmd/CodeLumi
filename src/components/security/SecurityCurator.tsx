import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    lumi?: any;
  }
}

type StagingItem = any;
type Archive = any;

type Tab = 'suggestions' | 'archives' | 'duplicates';

export const SecurityCurator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('suggestions');
  const activeTabRef = useRef<Tab>('suggestions');
  const [suggestions, setSuggestions] = useState<StagingItem[]>([]);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({});

  async function refreshSuggestions() {
    setLoading(true);
    try {
      if (window.lumi?.staging?.list) {
        const list = await window.lumi.staging.list();
        setSuggestions(Array.isArray(list) ? list : []);
        console.log('[SecurityCurator] Loaded suggestions:', list?.length || 0);
      } else {
        console.warn('[SecurityCurator] staging.list not available');
        setSuggestions([]);
      }

      if (window.lumi?.staging?.stats) {
        const statsRes = await window.lumi.staging.stats();
        if (statsRes?.ok) {
          setStats(statsRes);
          console.log('[SecurityCurator] Stats:', statsRes);
        }
      }
    } catch (e) {
      console.error('[SecurityCurator] refreshSuggestions failed:', e);
    } finally {
      setLoading(false);
    }
  }

  async function refreshArchives() {
    setLoading(true);
    try {
      if (window.lumi?.archives?.list) {
        const list = await window.lumi.archives.list();
        setArchives(Array.isArray(list) ? list : []);
        console.log('[SecurityCurator] Loaded archives:', list?.length || 0);
      } else {
        console.warn('[SecurityCurator] archives.list not available');
        setArchives([]);
      }
    } catch (e) {
      console.error('[SecurityCurator] refreshArchives failed:', e);
    } finally {
      setLoading(false);
    }
  }

  async function refreshDuplicates() {
    setLoading(true);
    try {
      if (window.lumi?.selflearn?.listDuplicates) {
        const res = await window.lumi.selflearn.listDuplicates();
        if (res?.ok) {
          const groups = res.groups || {};
          const grouped: any[] = [];
          for (const k of Object.keys(groups)) {
            const members = groups[k] || [];
            grouped.push({ key: k, members: members.map((m: any) => ({ ...m })) });
          }
          setDuplicates(grouped);
          console.log('[SecurityCurator] Loaded duplicates:', grouped.length, 'groups');
        }
      } else {
        console.warn('[SecurityCurator] selflearn.listDuplicates not available');
      }
    } catch (e) {
      console.error('[SecurityCurator] refreshDuplicates failed:', e);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    if (activeTab === 'suggestions') await refreshSuggestions();
    else if (activeTab === 'archives') await refreshArchives();
    else if (activeTab === 'duplicates') await refreshDuplicates();
  }

  useEffect(() => {
    refresh();
  }, [activeTab]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (!window.lumi?.onLearningEvent) return;
    const handler = (payload: any) => {
      try {
        if (!payload || !payload.type) return;
        const tab = activeTabRef.current;
        if (payload.type === 'staging-updated' && tab === 'suggestions') {
          refreshSuggestions();
        }
        if (payload.type === 'archives-updated' && tab === 'archives') {
          refreshArchives();
        }
        if ((payload.type === 'suggestions' || payload.type === 'suggestion') && tab === 'suggestions') {
          refreshSuggestions();
        }
      } catch (_e) { }
    };
    try { window.lumi.onLearningEvent(handler); } catch (_e) { }
  }, []);

  async function approveSuggestion(item: StagingItem) {
    if (!window.lumi?.staging?.approve) return;
    try {
      const res = await window.lumi.staging.approve(String(item.id));
      if (res?.ok) {
        console.log('[SecurityCurator] Approved:', item.id);
        await refreshSuggestions();
      } else {
        alert('Approve failed: ' + (res?.error || 'unknown'));
      }
    } catch (e) {
      console.error('[SecurityCurator] approveSuggestion failed:', e);
      alert('Approve failed');
    }
  }

  async function rejectSuggestion(item: StagingItem) {
    if (!window.lumi?.staging?.reject) return;
    const reason = await askInput('Rejection reason (optional):', 'manual');
    if (reason === null) return; // cancelled
    try {
      const res = await window.lumi.staging.reject(String(item.id), reason || 'manual');
      if (res?.ok) {
        console.log('[SecurityCurator] Rejected:', item.id);
        await refreshSuggestions();
      } else {
        alert('Reject failed: ' + (res?.error || 'unknown'));
      }
    } catch (e) {
      console.error('[SecurityCurator] rejectSuggestion failed:', e);
      alert('Reject failed');
    }
  }

  async function deleteSuggestion(item: StagingItem) {
    if (!window.lumi?.staging?.delete) return;
    const label = (item.q || item.title || item.message || item.suggestion || '').toString().slice(0, 50);
    if (!confirm(`Delete suggestion "${label}..."?`)) return;
    try {
      const res = await window.lumi.staging.delete(String(item.id));
      if (res?.ok) {
        console.log('[SecurityCurator] Deleted:', item.id);
        await refreshSuggestions();
      } else {
        alert('Delete failed: ' + (res?.error || 'unknown'));
      }
    } catch (e) {
      console.error('[SecurityCurator] deleteSuggestion failed:', e);
      alert('Delete failed');
    }
  }

  async function askInput(message: string, defaultValue = ''): Promise<string | null> {
    return await new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:10000';

      const box = document.createElement('div');
      box.style.cssText = 'background:#fff;padding:16px;border-radius:8px;min-width:320px;box-shadow:0 6px 24px rgba(0,0,0,0.2)';

      const label = document.createElement('div');
      label.textContent = message;
      label.style.marginBottom = '12px';

      const input = document.createElement('input');
      input.type = 'text';
      input.value = defaultValue;
      input.style.cssText = 'width:100%;box-sizing:border-box;padding:8px;border:1px solid #ddd;border-radius:4px';

      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'margin-top:12px;text-align:right';

      const ok = document.createElement('button');
      ok.textContent = 'OK';
      ok.style.cssText = 'margin-right:8px;padding:6px 16px;background:#007bff;color:#fff;border:none;border-radius:4px;cursor:pointer';

      const cancel = document.createElement('button');
      cancel.textContent = 'Cancel';
      cancel.style.cssText = 'padding:6px 16px;background:#6c757d;color:#fff;border:none;border-radius:4px;cursor:pointer';

      btnRow.appendChild(ok);
      btnRow.appendChild(cancel);
      box.appendChild(label);
      box.appendChild(input);
      box.appendChild(btnRow);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      input.focus();

      function cleanup() {
        try {
          overlay.remove();
        } catch (_) {}
      }
      ok.addEventListener('click', () => {
        const v = input.value;
        cleanup();
        resolve(v);
      });
      cancel.addEventListener('click', () => {
        cleanup();
        resolve(null);
      });
      input.addEventListener('keydown', (ev: any) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          ok.click();
        }
        if (ev.key === 'Escape') {
          ev.preventDefault();
          cancel.click();
        }
      });
    });
  }

  async function applyDuplicateDecisions() {
    try {
      const remove: number[] = [];
      for (let gi = 0; gi < duplicates.length; gi++) {
        const group = duplicates[gi];
        const radios = document.getElementsByName(`keep_${gi}`) as NodeListOf<HTMLInputElement>;
        let keepIndex: number | null = null;
        for (let r = 0; r < radios.length; r++) {
          if (radios[r].checked) {
            keepIndex = Number(radios[r].value);
            break;
          }
        }
        for (const m of group.members || []) {
          const idx = Number(m.index);
          if (keepIndex === null) continue;
          if (idx !== keepIndex) remove.push(idx);
        }
      }
      if (!confirm(`Remove ${remove.length} duplicate entries from KB? (backup will be created)`)) return;

      const res = await window.lumi?.selflearn?.applyGroups(remove);
      if (res?.ok) {
        alert(`Applied! Removed ${res.removed} entries, kept ${res.kept}.`);
        await refreshDuplicates();
      } else {
        alert('Apply failed: ' + (res?.error || 'unknown'));
      }
    } catch (e) {
      console.error('[SecurityCurator] applyDuplicateDecisions failed:', e);
      alert('Apply failed');
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ marginTop: 0 }}>🔒 Security Curator</h2>

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid #e0e0e0', marginBottom: 16 }}>
        <button
          onClick={() => setActiveTab('suggestions')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'suggestions' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'suggestions' ? '#fff' : '#333',
            border: 'none',
            borderBottom: activeTab === 'suggestions' ? '2px solid #007bff' : 'none',
            cursor: 'pointer',
            marginRight: 8,
          }}
        >
          📝 Suggestions {stats.quarantined > 0 ? `(${stats.quarantined})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('archives')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'archives' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'archives' ? '#fff' : '#333',
            border: 'none',
            borderBottom: activeTab === 'archives' ? '2px solid #007bff' : 'none',
            cursor: 'pointer',
            marginRight: 8,
          }}
        >
          📦 Archives ({archives.length})
        </button>
        <button
          onClick={() => setActiveTab('duplicates')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'duplicates' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'duplicates' ? '#fff' : '#333',
            border: 'none',
            borderBottom: activeTab === 'duplicates' ? '2px solid #007bff' : 'none',
            cursor: 'pointer',
          }}
        >
          🔄 Duplicates ({duplicates.length})
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={refresh}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div>
          <p style={{ color: '#666', fontSize: 14 }}>
            Review and approve quarantined suggestions. These are entries flagged for manual review.
          </p>
          {loading && <div>Loading suggestions...</div>}
          {!loading && suggestions.length === 0 && <div style={{ color: '#999' }}>✅ No threats detected</div>}
          <div>
            {suggestions.map((item: StagingItem, idx: number) => (
              <div
                key={item.id || idx}
                style={{
                  marginBottom: 16,
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  background: '#f9f9f9',
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <strong>Q:</strong> {item.q || item.title || item.message || item.suggestion || '(no question)'}
                </div>
                <div style={{ marginBottom: 8, color: '#666' }}>
                  <strong>A:</strong> {item.a || item.output || item.reasoning || item.note || '(no answer)'}
                </div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                  ID: {item.id} | Confidence: {item.confidence || 'N/A'} | Source: {item.source || 'unknown'}
                  {item.threat && <span style={{ color: '#dc3545', marginLeft: 8 }}>⚠️ {item.threat.reasons?.join(', ')}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => approveSuggestion(item)}
                    style={{
                      padding: '6px 12px',
                      background: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => rejectSuggestion(item)}
                    style={{
                      padding: '6px 12px',
                      background: '#ffc107',
                      color: '#000',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    ❌ Reject
                  </button>
                  <button
                    onClick={() => deleteSuggestion(item)}
                    style={{
                      padding: '6px 12px',
                      background: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Archives Tab */}
      {activeTab === 'archives' && (
        <div>
          <p style={{ color: '#666', fontSize: 14 }}>
            View and manage archived sessions. These are past conversation sessions.
          </p>
          {loading && <div>Loading archives...</div>}
          {!loading && archives.length === 0 && <div style={{ color: '#999' }}>📦 No archives found</div>}
          <div>
            {archives.map((archive: Archive, idx: number) => (
              <div
                key={archive.path || idx}
                style={{
                  marginBottom: 16,
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  background: '#f9f9f9',
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <strong>📄 {archive.name}</strong>
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  Size: {(archive.size / 1024).toFixed(1)} KB | Created: {new Date(archive.created).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>Path: {archive.displayPath || archive.path?.split('\\').pop() || archive.path?.split('/').pop() || ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duplicates Tab */}
      {activeTab === 'duplicates' && (
        <div>
          <p style={{ color: '#666', fontSize: 14 }}>
            Review duplicate knowledge base entries. Choose which version to keep for each group.
          </p>
          {loading && <div>Loading duplicates...</div>}
          {!loading && duplicates.length === 0 && <div style={{ color: '#999' }}>✅ No duplicates found</div>}
          <div>
            {duplicates.map((group: any, gi: number) => (
              <div
                key={group.key || gi}
                style={{
                  marginBottom: 16,
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  background: '#f9f9f9',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <strong>Group:</strong> {String(group.key)}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>{(group.members || []).length} duplicates</div>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Choose which entry to keep:</div>
                {(group.members || []).map((m: any, mi: number) => (
                  <label
                    key={mi}
                    style={{
                      display: 'block',
                      marginBottom: 8,
                      padding: 8,
                      background: '#fff',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <input type="radio" name={`keep_${gi}`} value={String(m.index)} defaultChecked={mi === 0} />
                    <span style={{ marginLeft: 8 }}>
                      <strong>Index {m.index}</strong> | Similarity: {Number(m.sim || 0).toFixed(3)}
                    </span>
                    <div style={{ marginLeft: 28, marginTop: 4, fontSize: 13, color: '#666' }}>
                      {String(m.entry?.q || m.entry?.a || JSON.stringify(m.entry || {})).slice(0, 200)}
                      {String(m.entry?.q || m.entry?.a || '').length > 200 && '...'}
                    </div>
                  </label>
                ))}
              </div>
            ))}
          </div>
          {duplicates.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <button
                onClick={applyDuplicateDecisions}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                ✅ Apply Group Decisions
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SecurityCurator;
