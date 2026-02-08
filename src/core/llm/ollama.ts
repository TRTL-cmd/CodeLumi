// Copyright (c) 2026 Tortol studios. All rights reserved.
// Contact: Tortolcoin@gmail.com
// Proprietary — do not reproduce, distribute, or sell without permission.

export type Message = { role: 'system' | 'user' | 'assistant'; content: string };

export class OllamaClient {
  baseUrl: string;
  model: string;

  private async fetchWithTimeout(url: string, options: Record<string, any> = {}, timeoutMs = 30000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }

  constructor(baseUrl = 'http://localhost:11434', model = 'gemma3:4b') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/tags`, {}, 3000);
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/tags`, {}, 5000);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  setModel(model: string) {
    this.model = model;
  }

  async generate(prompt: string, options: Record<string, any> = {}): Promise<string> {
    const body = { model: this.model, prompt, stream: true, ...options };
    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, options.timeoutMs || 30000);
    if (!res.ok) throw new Error(`Ollama generate failed: ${res.status}`);
    
    // Aggregate streamed NDJSON response: accumulate all "response" fields into one string
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');
    
    const decoder = new TextDecoder();
    let aggregated = '';
    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        // Split by newlines and parse complete JSON objects
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // keep incomplete line in buffer
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line);
            if (obj.response) aggregated += obj.response;
          } catch (e) {
            // skip malformed lines
          }
        }
      }
      
      // Process any remaining buffer content
      if (buffer.trim()) {
        try {
          const obj = JSON.parse(buffer);
          if (obj.response) aggregated += obj.response;
        } catch (e) {
          // skip malformed data
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    return aggregated || 'No response received';
  }

  async chat(messages: Message[], options: Record<string, any> = {}): Promise<string> {
    const body = { model: this.model, messages, stream: options.stream === true, ...options };
    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, options.timeoutMs || 30000);
    if (!res.ok) throw new Error(`Ollama chat failed: ${res.status}`);

    // If the response is a stream (NDJSON / chunked), aggregate like generate()
    const reader = (res.body as any)?.getReader?.();
    if (reader) {
      const decoder = new TextDecoder();
      let buffer = '';
      let aggregated = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const obj = JSON.parse(line);
              // support multiple possible fields across Ollama versions
              if (obj.response) aggregated += obj.response;
              else if (obj.message && obj.message.content) aggregated += obj.message.content;
              else if (obj.output) aggregated += obj.output;
              else if (obj.text) aggregated += obj.text;
              else if (obj.delta && obj.delta.content) aggregated += obj.delta.content;
            } catch (e) {
              // not JSON; append raw chunk as fallback
              aggregated += line;
            }
          }
        }

        if (buffer.trim()) {
          try {
            const obj = JSON.parse(buffer);
            if (obj.response) aggregated += obj.response;
            else if (obj.message && obj.message.content) aggregated += obj.message.content;
            else if (obj.output) aggregated += obj.output;
            else if (obj.text) aggregated += obj.text;
            else if (obj.delta && obj.delta.content) aggregated += obj.delta.content;
          } catch (_e) {
            aggregated += buffer;
          }
        }
      } finally {
        try { reader.releaseLock(); } catch (_e) { }
      }
      return aggregated || 'No response received';
    }

    // Non-streaming JSON response
    try {
      const data = await res.json();
      if (data.message && data.message.content) return data.message.content;
      if (data.response) return data.response;
      if (data.output) return data.output;
      if (data.text) return data.text;
      return JSON.stringify(data);
    } catch (e) {
      // fallback: return empty indicator
      return 'No response received';
    }
  }

  // Chat stream generator: posts to /api/chat with stream=true and yields assistant content chunks
  async *chatStream(messages: Message[], options: Record<string, any> = {}) {
    const body = { model: this.model, messages, stream: true, ...options };
    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, options.timeoutMs || 30000);
    if (!res.ok) throw new Error(`Ollama chat stream failed: ${res.status}`);
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line);
            // Ollama chat stream may emit { message: { content: '...' } } or { response: '...' }
            if (obj.message && obj.message.content) yield obj.message.content;
            else if (obj.response) yield obj.response;
          } catch (e) {
            // not a JSON line; yield raw chunk as fallback
            yield line;
          }
        }
      }

      if (buffer.trim()) {
        try {
          const obj = JSON.parse(buffer);
          if (obj.message && obj.message.content) yield obj.message.content;
          else if (obj.response) yield obj.response;
        } catch (e) {
          // ignore
        }
      }
    } finally {
      try { reader.releaseLock(); } catch (e) {}
    }
  }

  // Stream generator: yields text chunks from response body
  async *generateStream(prompt: string, options: Record<string, any> = {}) {
    const body = { model: this.model, prompt, stream: true, ...options };
    const res = await this.fetchWithTimeout(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, options.timeoutMs || 30000);
    if (!res.ok) throw new Error(`Ollama stream failed: ${res.status}`);
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const ollama = new OllamaClient();
