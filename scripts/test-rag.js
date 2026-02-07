(async function(){
  try {
    const path = require('path');
    const os = require('os');
    const userData = path.join(os.homedir(), 'AppData', 'Roaming', 'lumi-desktop');
    console.log('Using userData (test):', userData);

    const rag = require('../dist/core/rag/rag-retriever.js');
    const brain = require('../dist/core/brain/brain-rag-integration.js');

    console.log('Indexing knowledge...');
    const idx = await rag.indexKnowledge(userData).catch(e=>({ok:false,error:String(e)}));
    console.log('Index result:', idx);

    console.log('Searching for "authentication"...');
    const sr = await rag.searchKnowledge('authentication', 5).catch(e=>({ok:false,error:String(e)}));
    console.log('Search result:', sr);

    console.log('Initializing RAG via brain module...');
    try { const init = await brain.initializeRAG(userData); console.log('Brain initialize:', init); } catch(e){ console.warn('brain init failed', e); }

    console.log('Calling thinkWithRAG sample...');
    try {
      const out = await brain.thinkWithRAG('How does authentication work in the project?', { ragTopK: 3, maxTokens: 500 });
      console.log('thinkWithRAG output:', String(out).slice(0,2000));
    } catch (e){ console.warn('thinkWithRAG failed:', e); }

    process.exit(0);
  } catch (e) { console.error('Test script failed:', e); process.exit(2); }
})();
