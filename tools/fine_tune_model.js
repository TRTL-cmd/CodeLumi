const { NodeIO } = require('@gltf-transform/core');
const fs = require('fs');
const sharp = require('sharp');

async function processModel(inputPath, outputPath) {
  const io = new NodeIO().registerExtensions();
  const doc = io.read(inputPath);

  const textures = doc.getRoot().listTextures();
  console.log(`Found ${textures.length} textures`);

  for (const tex of textures) {
    const image = tex.getImage();
    if (!image) continue;
    // image may be ArrayBuffer or Buffer
    const buf = Buffer.from(image);
    try {
      // sharpen, increase saturation and contrast a bit
      const processed = await sharp(buf)
        .sharpen(1.0)
        .modulate({ saturation: 1.15, brightness: 1.02, hue: 0 })
        .toFormat('png')
        .toBuffer();

      tex.setImage(processed);
      console.log(`Processed texture: ${tex.getName() || '<unnamed>'}`);
    } catch (err) {
      console.warn('Failed to process texture', err.message);
    }
  }

  // brighten base color factors slightly for all materials
  const materials = doc.getRoot().listMaterials();
  for (const mat of materials) {
    const pbr = mat.getPBRMetallicRoughness();
    if (!pbr) continue;
    const col = pbr.getBaseColorFactor() || [1, 1, 1, 1];
    // scale RGB up slightly but clamp <=1
    const scale = 1.06;
    const newCol = [
      Math.min(1, col[0] * scale),
      Math.min(1, col[1] * scale),
      Math.min(1, col[2] * scale),
      col[3] !== undefined ? col[3] : 1
    ];
    pbr.setBaseColorFactor(newCol);
  }

  io.write(outputPath, doc);
  console.log('Wrote tuned model to', outputPath);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node fine_tune_model.js input.glb output.glb');
  process.exit(1);
}

processModel(args[0], args[1]).catch((err) => {
  console.error('Error processing model:', err);
  process.exit(1);
});
