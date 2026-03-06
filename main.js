document.addEventListener('DOMContentLoaded', () => {
    const App = window.App;
    const { params, state, u_base, builders } = App;

    // Core Three.js scene setup
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    // --- Inset: separate high-DPI canvas (no scissor on main) ---
    const inset = App.insetView.init({ size: 200, pixelRatio: Math.min(window.devicePixelRatio || 1, 2) });
    const { baseGroup } = inset;

    document.body.appendChild(renderer.domElement);

    // Main camera + controls
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.set(0, 3, 6);
    new THREE.OrbitControls(camera, renderer.domElement);

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

    // --- GUI panel ---
    const gui = new lil.GUI({ title: 'Controls' });

    Object.defineProperty(params, 'i_display', {
        get: () => params.i - 1,
        set: (val) => { params.i = val; },
    });

    function rebuildAll() {
        builders.buildBaseSpace(baseGroup);
        fiberGroup = builders.buildVFibers(scene, fiberGroup);
        builders.buildUFiber(fiberGroup);
        updateSubtitle();
    }

    // --- Controls (no folders) ---
    params.toggleTrivialBundle = () => {
        params.trivialBundle = !params.trivialBundle;
        trivialCtrl.name(params.trivialBundle ? 'Trivial bundle ' : 'Hopf bundle ');
        trivialCtrl.domElement.classList.toggle('bundle-active', params.trivialBundle);
        rebuildAll();
    };
    const trivialCtrl = gui.add(params, 'toggleTrivialBundle').name(params.trivialBundle ? 'Trivial bundle ✓' : 'Hopf bundle ✓');
    trivialCtrl.domElement.classList.add('bundle-toggle');

    params.toggleStackView = () => {
        params.stackView = !params.stackView;
        stackCtrl.name(params.stackView ? 'Stack view OFF' : 'Stack view ON');
        rebuildAll();
    };
    const stackCtrl = gui.add(params, 'toggleStackView').name(params.stackView ? 'Stack view OFF' : 'Stack view ON');

    gui.add(params, 'longitude', -4 * Math.PI, 4 * Math.PI, 0.01).name('Longitude').onChange(rebuildAll);
    gui.add(params, 'latitude', -180, 180, 1).name('Latitude').onChange(rebuildAll);
    gui.add(params, 'vLatitude', -180, 180, 1).name('V circle latitude').onChange(rebuildAll);
    gui.add(params, 'theta', -180, 180, 1).name('Theta').onChange(rebuildAll);

    const iChoices = Object.fromEntries([...Array(8)].map((_, k) => [k + 1, k + 2]));
    gui.add(params, 'i_pending', iChoices).name('Quat power i');

    params.applyI = () => {
        params.i = params.i_pending;
        state.hasInteracted = true;
        rebuildAll();
    };
    params.resetBundle = () => {
        params.i = 1;
        params.i_pending = 2;
        state.hasInteracted = false;
        rebuildAll();
    };

    const applyCtrl = gui.add(params, 'applyI').name('Apply');
    const resetCtrl = gui.add(params, 'resetBundle').name('Reset');
    applyCtrl.domElement.classList.add('gui-btn', 'gui-btn-primary', 'inline-button');
    resetCtrl.domElement.classList.add('gui-btn', 'gui-btn-secondary', 'inline-button');

    gui.add(params, 'fibers', 6, 300, 1).name('Fiber count').onChange(rebuildAll);
    gui.add(params, 'tubeRadius', 0.01, 0.1, 0.005).name('Tube thickness').onChange(rebuildAll);
    gui.add(params, 'unlink', 0, 0.1, 0.001).name('Unlink').onChange(rebuildAll);

    // === M(h, j) Subtitle ===
    const subtitle = document.getElementById('subtitle');
    function updateSubtitle() {
        if (!subtitle) return;
        const j = params.trivialBundle ? ( 1 - params.i) : (2 - params.i);
        subtitle.textContent = `M(${params.i - 1}, ${j})`;
    }

    rebuildAll();

    (function render() {
        requestAnimationFrame(render);

        renderer.setClearColor(0x000000, 1);
        renderer.clear(true, true, false);
        renderer.render(scene, camera);

        inset.render();
    })();
});
