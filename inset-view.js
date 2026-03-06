(function attachInsetView(global) {
    const App = global.App || (global.App = {});

    // Inset view uses its own renderer + canvas so it can be higher-DPI
    // without making the main scene more expensive (no scissor/viewport hacks).
    function init(opts = {}) {
        const size = opts.size ?? 200;
        // Cap DPR to avoid huge GPU cost on very high-density displays.
        const pixelRatio = opts.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2);

        const container = document.getElementById('inset-container');
        if (!container) throw new Error('inset-container element not found');

        // Separate renderer (transparent) so the inset can be overlaid via CSS.
        const insetRenderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        insetRenderer.setSize(size, size);
        insetRenderer.setPixelRatio(pixelRatio);
        // Keep background transparent; CSS provides the panel styling.
        insetRenderer.setClearColor(0x000000, 0);
        container.appendChild(insetRenderer.domElement);

        const orthScene = new THREE.Scene();
        orthScene.background = null;

        orthScene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const dlight = new THREE.DirectionalLight(0xffffff, 0.6);
        dlight.position.set(2, 2, 3);
        orthScene.add(dlight);

        const orthCam = new THREE.PerspectiveCamera(40, 1, 0.1, 10);
        orthCam.position.set(0, 0, 3);
        orthCam.lookAt(0, 0, 0);

        const baseGroup = new THREE.Group();
        orthScene.add(baseGroup);

        // Pointer handling: rotate the inset group on drag.
        // We attach listeners to this canvas (not the main one) so OrbitControls
        // for the main view doesn’t steal the gesture.
        const canvas = insetRenderer.domElement;
        let dragging = false;
        let prevClientX = 0;
        let prevClientY = 0;
        const rotateSpeed = 0.005;

        function isInInset(clientX, clientY) {
            const r = canvas.getBoundingClientRect();
            return clientX >= r.left && clientX < r.right && clientY >= r.top && clientY < r.bottom;
        }

        canvas.addEventListener('mousedown', function (e) {
            if (!isInInset(e.clientX, e.clientY)) return;
            e.preventDefault();
            e.stopPropagation();
            dragging = true;
            prevClientX = e.clientX;
            prevClientY = e.clientY;
        }, true);

        document.addEventListener('mousemove', function (e) {
            const inInset = isInInset(e.clientX, e.clientY);
            canvas.style.cursor = dragging ? 'grabbing' : inInset ? 'grab' : '';
            if (!dragging) return;
            const dx = e.clientX - prevClientX;
            const dy = e.clientY - prevClientY;
            baseGroup.rotation.y += dx * rotateSpeed;
            baseGroup.rotation.x += dy * rotateSpeed;
            prevClientX = e.clientX;
            prevClientY = e.clientY;
        });

        document.addEventListener('mouseup', function () {
            dragging = false;
        });

        function render() {
            // Clear color+depth each frame to avoid ghosting when alpha is enabled.
            insetRenderer.clear(true, true, false);
            insetRenderer.render(orthScene, orthCam);
        }

        return {
            orthScene,
            orthCam,
            baseGroup,
            render,
        };
    }

    App.insetView = { init };
})(window);
