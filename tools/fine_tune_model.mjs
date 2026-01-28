import { NodeIO } from '@gltf-transform/core';
import fs from 'fs';
import sharp from 'sharp';

async function processModel(inputPath, outputPath) {
  const io = new NodeIO();
  const doc = await io.read(inputPath);

  const textures = doc.getRoot().listTextures();
  console.log(`Found ${textures.length} textures`);

  for (const tex of textures) {
    const image = tex.getImage();
    if (!image) continue;
    const buf = Buffer.from(image);
    try {
      const processed = await sharp(buf)
        .sharpen(1.0)
        .modulate({ saturation: 1.15, brightness: 1.02 })
        .png()
        .toBuffer();

      tex.setImage(processed);
      console.log(`Processed texture: ${tex.getName() || '<unnamed>'}`);
    } catch (err) {
      console.warn('Failed to process texture', err.message);
    }
  }

  const materials = doc.getRoot().listMaterials();
  for (const mat of materials) {
    // Try to adjust base color factor regardless of internal PBR accessor
    const getBase = typeof mat.getBaseColorFactor === 'function' ? mat.getBaseColorFactor.bind(mat) : null;
    const setBase = typeof mat.setBaseColorFactor === 'function' ? mat.setBaseColorFactor.bind(mat) : null;
    const col = getBase ? getBase() : [1, 1, 1, 1];
    const scale = 1.06;
    const newCol = [
      Math.min(1, col[0] * scale),
      Math.min(1, col[1] * scale),
      Math.min(1, col[2] * scale),
      col[3] !== undefined ? col[3] : 1
    ];
    if (setBase) setBase(newCol);
  }

  io.write(outputPath, doc);
  console.log('Wrote tuned model to', outputPath);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node fine_tune_model.mjs input.glb output.glb');
  process.exit(1);
}

processModel(args[0], args[1]).catch((err) => {
  console.error('Error processing model:', err);
  process.exit(1);
});
