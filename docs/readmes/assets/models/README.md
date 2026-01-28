````markdown
# ARCHIVE: docs/readmes/assets/models/README.md

This file has been archived to docs/organized/archive/readmes/assets/models/README.md

See: docs/organized/archive/readmes/assets/models/README.md

This folder is intended to contain example GLB models you can use to test animation playback.

Provided (download via the `tools/fetch_sample_models.js` script):

- Fox.glb — from the Khronos glTF Sample Models. Contains walk/run animations.
- CesiumMan.glb — simple skinned character with basic animation.
- Monster.glb — example monster with animation clips.

How to fetch the samples:

1. From the project root run:

```bash
node tools/fetch_sample_models.js
```

2. After download, open the app and open the Persona editor (Personality), choose a sample from the "samples" dropdown, and click "Load Sample".

Notes:
- If you prefer, place your own GLB files in `assets/models/` and select them from the samples dropdown.
- The app will populate the clip selector if the GLB contains named animation clips.

License:
- See the project-level `ASSETS_LICENSE.md` for terms governing 3D models and persona assets.


````
