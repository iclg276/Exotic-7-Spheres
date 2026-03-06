import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { params, state, u_base } from '../state/app-state.js';
import { createMathHelpers } from '../math/math-helpers.js';
import { createBuilders } from '../geometry/build-geometry.js';
import { createInsetView } from './inset-view.js';
import { setupGui } from '../ui/gui.js';
import { createSubtitleUpdater } from '../ui/subtitle.js';

/**
 * Core Three.js scene setup, render loop, and wiring of builders + GUI.
 */
export function initApp() {
    const helpers = createMathHelpers(params, u_base);
    const builders = createBuilders(params, u_base, helpers);
    const insetView = createInsetView();

    // Core Three.js scene setup
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    // --- Inset: separate high-DPI canvas (no scissor on main) ---
    const inset = insetView.init({ size: 200, pixelRatio: Math.min(window.devicePixelRatio || 1, 2) });
    const { baseGroup } = inset;

    document.getElementById('app-canvas').appendChild(renderer.domElement);

    // Main camera + controls
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.set(0, 3, 6);
    new OrbitControls(camera, renderer.domElement);

    // Main scene lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(3, 3, 5);
    scene.add(dir);

    // Handle viewport resizing
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    let fiberGroup = new THREE.Group();
    scene.add(fiberGroup);

    const updateSubtitle = createSubtitleUpdater(params);

    function rebuildAll() {
        builders.buildBaseSpace(baseGroup);
        fiberGroup = builders.buildVFibers(scene, fiberGroup);
        builders.buildUFiber(fiberGroup);
        updateSubtitle();
    }

    // --- GUI panel ---
    setupGui(params, state, rebuildAll);

    rebuildAll();

    (function render() {
        requestAnimationFrame(render);

        renderer.setClearColor(0x000000, 1);
        renderer.clear(true, true, false);
        renderer.render(scene, camera);

        inset.render();
    })();
}
