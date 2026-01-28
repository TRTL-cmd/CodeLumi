import { remember, searchText, queryByType } from './core/memory/db';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const promptEl = $('prompt') as HTMLTextAreaElement;
const outEl = $('output') as HTMLPreElement;
const memEl = $('memory') as HTMLPreElement;

let streaming = false;

function appendOut(line: string) {
  outEl.textContent += line;
  outEl.scrollTop = outEl.scrollHeight;
}

async function invokeThink() {
  const p = promptEl.value;
  appendOut('\n>>> Thinking...\n');
  try {
    if ((window as any).lumi && (window as any).lumi.think) {
      const res = await (window as any).lumi.think(p, {});
      appendOut('\n' + (res?.output ?? JSON.stringify(res)) + '\n');
    } else {
      appendOut('\n[lumi.think unavailable in this environment]\n');
    }
  } catch (e: any) {
    appendOut('\n[Error] ' + (e?.message || String(e)) + '\n');
  }
}

function startStream() {
  const p = promptEl.value;
  appendOut('\n>>> Stream start...\n');
  if (!(window as any).lumi || !(window as any).lumi.startThinkStream) {
    appendOut('\n[lumi streaming not available]\n');
    return;
  }
  streaming = true;
  (window as any).lumi.onThinkChunk((chunk: string) => appendOut(chunk));
  (window as any).lumi.onThinkDone(() => appendOut('\n[stream done]\n'));
  (window as any).lumi.onThinkError((err: string) => appendOut('\n[stream error] ' + err + '\n'));
  (window as any).lumi.startThinkStream(p, {});
}

function stopStream() {
  // This simple harness does not implement a cancel token; reload will stop.
  appendOut('\n[stop requested — restart renderer to cancel]\n');
}

async function doRemember() {
  const text = (document.getElementById('memContent') as HTMLInputElement).value;
  if (!text) return;
  const id = await remember({ type: 'note', content: text, tags: [] });
  memEl.textContent = 'Remembered id: ' + id + '\n';
}

async function doSearch() {
  const q = (document.getElementById('memContent') as HTMLInputElement).value;
  const hits = await searchText(q || '');
  memEl.textContent = JSON.stringify(hits, null, 2);
}

document.getElementById('btnThink')?.addEventListener('click', invokeThink);
document.getElementById('btnStream')?.addEventListener('click', startStream);
document.getElementById('btnStopStream')?.addEventListener('click', stopStream);
document.getElementById('btnRemember')?.addEventListener('click', doRemember);
document.getElementById('btnSearch')?.addEventListener('click', doSearch);

// show lumi presence
if ((window as any).lumi) {
  appendOut('[lumi API available]\n');
} else {
  appendOut('[lumi API NOT available — preload may be missing]\n');
}
