Memory utilities for Codelumi (Dexie / IndexedDB)

Usage (renderer process):

```ts
import { remember, searchText, queryByType } from '../core/memory/db';

// store a short note
await remember({ type: 'note', content: 'Met with Alice about roadmap', tags: ['meeting','roadmap'] });

// search
const hits = await searchText('alice');

// list notes
const notes = await queryByType('note');
```

Notes:
- This module is intended to run in renderer (browser) context where IndexedDB is available.
- For Node/Electron main process testing, run inside the renderer or add an IndexedDB shim.
