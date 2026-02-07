import * as fs from 'fs';
import * as path from 'path';

type KBEntry = { id?: string; title?: string; text: string };

async function loadTrainingKB(): Promise<KBEntry[]> {
	try {
		const base = process.cwd();
		const candidates = [
			path.join(base, 'training', 'lumi_knowledge.json'),
			path.join(base, 'training', 'codelumi_knowledge.json'),
		];
		const out: KBEntry[] = [];
		for (const p of candidates) {
					try {
						if (!fs.existsSync(p)) continue;
						// Prefer a compact companion file if present
						const compact = p.replace('.json', '.compact.json');
						let raw: string | undefined;
						if (fs.existsSync(compact)) {
							raw = await fs.promises.readFile(compact, 'utf8');
						} else {
							const stat = await fs.promises.stat(p);
							// If file is large, parse with a reviver to strip embeddings
							if (stat.size > 2 * 1024 * 1024) {
								raw = await fs.promises.readFile(p, 'utf8');
								try {
									const parsed = JSON.parse(raw, (k, v) => (k === 'embedding' ? undefined : v));
									if (Array.isArray(parsed)) {
										for (const it of parsed) {
											if (!it) continue;
											const entry: KBEntry = { id: it.id || undefined, title: it.title || it.input || undefined, text: (it.output || it.answer || it.text || it.a || it).toString() };
											out.push(entry);
										}
									}
									continue;
								} catch (e) {
									// fall back to full read
									raw = await fs.promises.readFile(p, 'utf8');
								}
							} else {
								raw = await fs.promises.readFile(p, 'utf8');
							}
						}

						const parsed = JSON.parse(raw as string);
						if (Array.isArray(parsed)) {
							for (const it of parsed) {
								if (!it) continue;
								const entry: KBEntry = { id: it.id || undefined, title: it.title || it.input || undefined, text: (it.output || it.answer || it.text || it.a || it).toString() };
								out.push(entry);
							}
						}
					} catch (_e) {
						// ignore per-file errors
					}
		}
		return out;
	} catch (_e) {
		return [];
	}
}

export async function searchKB(query: string, limit = 5): Promise<KBEntry[]> {
	if (!query) return [];
	const kb = await loadTrainingKB();
	const q = query.toLowerCase();
	const scored = kb.map((e) => {
		const hay = ((e.title || '') + ' ' + (e.text || '')).toLowerCase();
		const idx = hay.indexOf(q);
		const score = idx === -1 ? 0 : 1 / (1 + idx);
		return { e, score };
	});
	scored.sort((a, b) => b.score - a.score);
	return scored.filter(s => s.score > 0).slice(0, limit).map(s => s.e as KBEntry);
}

export async function searchKBWithRerank(query: string, limit = 5): Promise<KBEntry[]> {
	// placeholder: for now, just call searchKB. A real reranker can be plugged in later.
	return searchKB(query, limit);
}

export default {
	searchKB,
	searchKBWithRerank,
};

