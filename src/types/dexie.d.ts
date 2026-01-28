declare module 'dexie' {
  class Dexie {
    constructor(name?: string);
    version(versionNumber: number): { stores: (schema: any) => void };
    table<T = any>(name: string): Dexie.Table<T, any>;
    close(): void;
  }

  namespace Dexie {
    interface Table<T = any, Key = any> {
      add(item: T): Promise<Key>;
      get(key: Key): Promise<T | undefined>;
      where(index: string): { equals(val: any): { toArray(): Promise<T[]> } };
      toArray(): Promise<T[]>;
      clear(): Promise<void>;
    }
  }

  export default Dexie;
}
