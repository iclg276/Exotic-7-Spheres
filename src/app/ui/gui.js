import GUI from 'lil-gui';

/**
 * lil-gui panel: bundle toggles, sliders, Apply/Reset, fiber/tube/unlink.
 */
export function setupGui(params, state, rebuildAll) {
    const gui = new GUI({ title: 'Controls' });

    Object.defineProperty(params, 'i_display', {
        get: () => params.i - 1,
        set: (val) => { params.i = val; },
    });

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
    gui.add(params, 'unlink', 0, 0.4, 0.001).name('Unlink').onChange(rebuildAll);

    return gui;
}
