import * as fs from 'fs/promises';
import * as path from 'path';

export type Tone = {
  id: string;
  name: string;
  description?: string;
};

export default class PersonalityManager {
  private filePath: string;
  private defaultTones: Tone[] = [
    { id: 'friendly', name: 'Friendly', description: 'Warm, helpful and concise' },
    { id: 'teacher', name: 'Teacher', description: 'Detailed explanations and examples' },
    { id: 'concise', name: 'Concise', description: 'Short, to-the-point replies' }
  ];

  constructor(userDataPath: string) {
    this.filePath = path.join(userDataPath, 'personality.json');
  }

  private async readState(): Promise<any> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(raw || '{}');
    } catch (e: any) {
      return { current: this.defaultTones[0].id, tones: this.defaultTones };
    }
  }

  private async writeState(state: any) {
    try {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
      // noop
    }
  }

  async listTones(): Promise<Tone[]> {
    const st = await this.readState();
    return st.tones || this.defaultTones;
  }

  async getCurrentTone(): Promise<string> {
    const st = await this.readState();
    return st.current || this.defaultTones[0].id;
  }

  async setCurrentTone(toneId: string): Promise<{ ok: boolean; tone?: string }>{
    const st = await this.readState();
    const tones: Tone[] = st.tones || this.defaultTones;
    const found = tones.find(t => t.id === toneId);
    if (!found) return { ok: false };
    st.current = toneId;
    await this.writeState(st);
    return { ok: true, tone: toneId };
  }
}
