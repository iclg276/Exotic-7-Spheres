# Exotic Seven Spheres

Interactive visualization of **Milnor's exotic 7-spheres**: Hopf fibration and trivial bundle.  
Source code and slides for the video project on exotic 7-spheres. Includes Three.js interactive scenes.

## Project structure (modular)

```
├── index.html              # Entry HTML + project header
├── package.json
├── vite.config.js
├── src/
│   ├── main.js             # App entry (imports CSS + initApp)
│   ├── styles/
│   │   └── main.css        # Layout, GUI, inset, YouTube link
│   └── app/
│       ├── state/
│       │   └── app-state.js    # params, state, u_base
│       ├── math/
│       │   └── math-helpers.js # Quaternions, stereographic, fiber helpers
│       ├── geometry/
│       │   └── build-geometry.js # Base space, V fibers, U fiber builders
│       ├── scene/
│       │   ├── main-scene.js   # Scene setup, camera, lights, render loop
│       │   └── inset-view.js  # Inset 3D canvas (high-DPI)
│       └── ui/
│           ├── gui.js          # lil-gui controls
│           └── subtitle.js     # M(h,j) subtitle
├── styles.css              # (legacy; see src/styles/main.css)
├── main.js                 # (legacy; see src/main.js + src/app/)
├── app-state.js
├── math-helpers.js
├── build-geometry.js
├── inset-view.js
└── ...
```

The **live app** is built from `src/` and wired by Vite. The root-level `*.js` and `styles.css` are the original flat files kept for reference.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL shown (e.g. `http://localhost:5173`).

## Build for production

```bash
npm run build
```

Output is in `dist/`. Preview with `npm run preview`.

## Tech stack

- **Vite** — dev server and production build
- **Three.js** — 3D scene, stereographic projection, tubes
- **lil-gui** — parameter panel

## License

Same as the original project.
