import { NodeIO } from '@gltf-transform/core';
import fs from 'fs';

function computeBoundingBox(doc) {
  const min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];

  const meshes = doc.getRoot().listMeshes();
  for (const mesh of meshes) {
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      if (!pos) continue;
      const array = pos.getArray();
      for (let i = 0; i < array.length; i += 3) {
        for (let k = 0; k < 3; k++) {
          const v = array[i + k];
          if (v < min[k]) min[k] = v;
          if (v > max[k]) max[k] = v;
        }
      }
    }
  }
  if (min[0] === Number.POSITIVE_INFINITY) return null;
  return { min, max };
}

function vec3Sub(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
function vec3Scale(a, s) { return [a[0]*s, a[1]*s, a[2]*s]; }

async function normalize(inputPath, outputPath) {
  const io = new NodeIO();
  const doc = await io.read(inputPath);

  // Remove likely enclosing box nodes by name heuristics
  const root = doc.getRoot();
  const scenes = root.listScenes();
  for (const scene of scenes) {
    for (const node of scene.listChildren()) {
      const name = (node.getName() || '').toLowerCase();
      if (/box|cube|bounding|collision|container/.test(name)) {
        console.log('Removing node by name heuristic:', node.getName());
        node.dispose();
      }
    }
  }

  // Recompute bounding box
  const bbox = computeBoundingBox(doc);
  if (!bbox) {
    console.warn('No position attributes found; skipping normalization.');
    await io.write(outputPath, doc);
    return;
  }

  const center = [(bbox.min[0]+bbox.max[0])/2, (bbox.min[1]+bbox.max[1])/2, (bbox.min[2]+bbox.max[2])/2];
  const size = vec3Sub(bbox.max, bbox.min);
  const maxDim = Math.max(size[0], size[1], size[2]);
  const targetMax = 1.6; // target maximum size in glTF units
  const scaleFactor = targetMax / maxDim;

  console.log('Model bbox center:', center, 'maxDim:', maxDim, 'scaleFactor:', scaleFactor);

  // Apply transform: for each root node, set translation = -center, and scale
  for (const scene of root.listScenes()) {
    for (const node of scene.listChildren()) {
      // apply only to non-empty nodes
      const children = node.listChildren();
      // set translation and scale on node
      const t = node.getTranslation() || [0,0,0];
      const s = node.getScale() || [1,1,1];
      const newT = vec3Sub(t, center);
      const newS = vec3Scale(s, scaleFactor);
      node.setTranslation(newT);
      node.setScale(newS);
    }
  }

  await io.write(outputPath, doc);
  console.log('Normalized model written to', outputPath);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node normalize_model.mjs input.glb output.glb');
  process.exit(1);
}

normalize(args[0], args[1]).catch(err => { console.error(err); process.exit(1); });
