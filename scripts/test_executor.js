const executor = require('../src/brain/executor_stub');
const fs = require('fs').promises;
const path = require('path');

async function run(){
  const tmpDir = path.join(process.cwd(), 'tmp');
  await fs.mkdir(tmpDir, { recursive: true });
  const target = path.join('tmp','executor_test.txt');
  const abs = path.join(process.cwd(), target);
  await fs.writeFile(abs, 'original content', 'utf8');
  console.log('Wrote original file:', abs);
  const sim = await executor.simulateChange(target, 'new content from executor');
  console.log('Simulate:', sim.file, 'existed=', sim.existed);
  const exec = await executor.executeChange(sim);
  console.log('Execute result:', exec);
  const after = await fs.readFile(abs, 'utf8');
  console.log('After content:', after);
  const revert = await executor.revertBackup(exec.runDir);
  console.log('Revert result:', revert);
  const final = await fs.readFile(abs, 'utf8');
  console.log('Final content:', final);
}
run().catch(e=>{ console.error('Test failed', e); process.exit(2); });
