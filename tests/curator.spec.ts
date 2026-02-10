import { test, expect } from '@playwright/test';
import path from 'path';
import { pathToFileURL } from 'url';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const log: any[] = [];
    (window as any).__testLog = log;

    (window as any).lumi = {
      staging: {
        list: async () => ({
          ok: true,
          items: [
            { id: 's1', q: 'Q1', a: 'A1', tags: [] },
            { id: 's2', q: 'Q2', a: 'A2', tags: [] }
          ]
        }),
        approve: async (id: string) => { log.push({ type: 'approve', id }); return { ok: true }; },
        reject: async (id: string, reason?: string) => { log.push({ type: 'reject', id, reason }); return { ok: true }; },
        delete: async (id: string) => { log.push({ type: 'delete', id }); return { ok: true }; },
        bulkTag: async (ids: string[], tag: string) => { log.push({ type: 'bulkTag', ids, tag }); return { ok: true }; }
      },
      listSuggestions: async () => ({ suggestions: [
        { id: 'g1', path: 'src/a.ts', line: 10, suggestion: 'Fix issue', severity: 'low' }
      ]}),
      ackSuggestion: async (id: string) => { log.push({ type: 'ack', id }); return { ok: true }; },
      selflearn: {
        listDuplicates: async () => ({
          ok: true,
          groups: {
            seed: [
              { index: 0, sim: 0.95, entry: { q: 'Q1', a: 'A1' } },
              { index: 1, sim: 0.94, entry: { q: 'Q1b', a: 'A1b' } }
            ]
          }
        }),
        applyGroups: async (remove: number[]) => { log.push({ type: 'applyGroups', remove }); return { ok: true, removed: remove.length }; },
        runDedupe: async () => { log.push({ type: 'runDedupe' }); return { ok: true }; }
      },
      session: {
        listArchives: async () => ({ ok: true, archives: [] })
      }
    };
  });
});

test('curator staging bulk approve works', async ({ page }) => {
  const fileUrl = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).toString();
  await page.goto(fileUrl);

  await page.getByRole('button', { name: 'Security Curator' }).click();
  await page.locator('#curatorBulkBar').getByText('Select all').click();
  await page.locator('#curatorBulkBar').getByText('Approve selected').click();

  const log = await page.evaluate(() => (window as any).__testLog);
  expect(log.some((l: any) => l.type === 'approve')).toBeTruthy();
});

test('curator duplicates apply groups works', async ({ page }) => {
  const fileUrl = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).toString();
  await page.goto(fileUrl);

  await page.getByRole('button', { name: 'Security Curator' }).click();
  await page.getByRole('button', { name: 'Duplicates' }).click();
  await page.locator('#curatorBulkBar').getByText('Run semantic scan').click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#curatorBulkBar').getByText('Apply decisions').click();

  const log = await page.evaluate(() => (window as any).__testLog);
  expect(log.some((l: any) => l.type === 'runDedupe')).toBeTruthy();
  expect(log.some((l: any) => l.type === 'applyGroups')).toBeTruthy();
});
