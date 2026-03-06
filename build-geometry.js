(function attachBuilders(global) {
    const App = global.App || (global.App = {});
    const { params, u_base, helpers } = App;
    const {
        currentTheta,
        currentU,
        stereographic,
        applyIJ,
        u_on_fiber,
    } = helpers;

    // Dispose geometries/materials inside a group
    function disposeGroup(g) {
        g.traverse(obj => {
            if (obj.isMesh) {
                obj.geometry?.dispose();
                (Array.isArray(obj.material) ? obj.material : [obj.material])
                    .forEach(m => m && m.dispose && m.dispose());
            }
        });
    }

    // --- Draw base-space sphere + points ---
    function disposeBaseSpace(baseGroup) {
        while (baseGroup.children.length) {
            const obj = baseGroup.children.pop();
            if (obj.geometry) obj.geometry.dispose?.();
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach(m => m && m.dispose && m.dispose());
        }
    }

    function buildBaseSpace(baseGroup) {
        disposeBaseSpace(baseGroup);

        const R = 0.5;

        // --- Main gray sphere ---
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(R, 32, 32),
            new THREE.MeshLambertMaterial({
                color: 0x888888,
                transparent: true,
                opacity: 0.8
            })
        );
        baseGroup.add(sphere);

        // --- Blue guide ring (V base circle on S^2) ---
        // const phi = Math.PI / 2;  // fixed equator
        const N = params.fibers;
        const pos = new Float32Array(N * 3);
        const col = new Float32Array(N * 3);
        const vPhi = params.vLatitude * Math.PI / 180;

        for (let idx = 0; idx < N; idx++) {
            const lon = 2 * Math.PI * (idx / N);
            // const x = Math.cos(lon) * Math.sin(phi);
            // const y = Math.sin(lon) * Math.sin(phi);
            // const z = Math.cos(phi);
            const x = Math.cos(lon) * Math.sin(vPhi);
            const y = Math.sin(lon) * Math.sin(vPhi);
            const z = Math.cos(vPhi);
            const v = new THREE.Vector3(x, y, z).multiplyScalar(R * 1.01);

            pos[3 * idx + 0] = v.x;
            pos[3 * idx + 1] = v.y;
            pos[3 * idx + 2] = v.z;

            const c = new THREE.Color(0x0000ff);
            col[3 * idx + 0] = c.r;
            col[3 * idx + 1] = c.g;
            col[3 * idx + 2] = c.b;
        }

        const vGeom = new THREE.BufferGeometry();
        vGeom.addAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        vGeom.addAttribute('color', new THREE.Float32BufferAttribute(col, 3));

        const vPts = new THREE.Points(
            vGeom,
            new THREE.PointsMaterial({
                size: 6.0,
                sizeAttenuation: false,
                vertexColors: true,
                depthTest: false
            })
        );
        baseGroup.add(vPts);

        // --- Red dot (basepoint from longitude + latitude) ---
        const redPhi = params.latitude * Math.PI / 180;
        const redLon = 2 * Math.PI * (params.longitude / params.fibers);
        const redX = Math.cos(redLon) * Math.sin(redPhi);
        const redY = Math.sin(redLon) * Math.sin(redPhi);
        const redZ = Math.cos(redPhi);

        u_base.set(redX, redY, redZ).normalize(); // update global u_base

        const redDot = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        redDot.position.set(redX * R * 1.05, redY * R * 1.05, redZ * R * 1.05);
        baseGroup.add(redDot);

        // --- Green point (fixed north pole) ---
        const baseM = new THREE.Vector3(0, 0, 1).multiplyScalar(R * 1.05);
        const greenDot = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x008000 })
        );
        greenDot.position.copy(baseM);
        baseGroup.add(greenDot);

        // --- Tilt the whole inset view ---
        // Preserve user rotation (inset drag) across rebuildAll().
        // Only set the initial tilt once.
        if (!baseGroup.userData._tiltInitialized) {
            baseGroup.rotation.x = -Math.PI / 6;
            baseGroup.rotation.y = -Math.PI / 6;
            baseGroup.userData._tiltInitialized = true;
        }
    }


    function buildVFibers(scene, fiberGroup) {
        scene.remove(fiberGroup);            // clear previous fiber set
        disposeGroup(fiberGroup);            // free GPU resources
        const nextFiberGroup = new THREE.Group();      // new container for fibers + markers
        scene.add(nextFiberGroup);

        const twoPi = 2 * Math.PI;
        const tauOffset = params.theta * Math.PI / 180;  // theta = fiber phase in radians

        const fiberMat = new THREE.MeshPhongMaterial({ color: 0x0000ff, shininess: 80 }); // blue
        //const axis = { x: 0, y: 0, z: 1 }; // j-axis for u

        const markGeom = new THREE.SphereGeometry(0.07, 12, 12);
        const markMat = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Yellow markers

        const centers = [];

        // V fibers base-circle latitude (degrees to radians)
        // hardcoded latitude of the v fiber circle, 0.75 which really close to the latitude, visually
        const vPhi = params.vLatitude * Math.PI / 180;
        const c = Math.cos(vPhi);
        // const c = Math.sqrt(1 - a * a - b * b);  // old: fixed by 0.75 ring

        for (let f = 0; f < twoPi; f += twoPi / params.fibers) {
            const a = 0.75 * Math.cos(f);
            const b = 0.75 * Math.sin(f);

            //const u = U(params.theta + f/2, m); // THE CORE OF THIS PROJECT // no longer
            //const u = u_on_fiber(u_base, params.theta + f);
            // const u = u_on_fiber(u_base, tauOffset + f / 2); // fiber-phase-shifted quaternion
            const u = currentU(tauOffset, f);
            const alpha = Math.sqrt((1 + c) / 2);
            const beta = Math.sqrt((1 - c) / 2);

            const points = [];
            for (let t = 0; t <= twoPi + 1e-6; t += 0.05) {
                //const theta = Math.atan2(b, -a) / 4;
                const theta = currentTheta(b, a, t);

                const w = alpha * Math.cos(theta);
                const x = alpha * Math.sin(theta);
                const y = beta * Math.cos(t);
                const z = beta * Math.sin(t);

                // Quaternion action. Hopf: j = 1-i; Trivial bundle: j = 2-i.
                const p = { w: w, x: x, y: y, z: z };
                const j = params.trivialBundle ? (2 - params.i) : (1 - params.i);
                // p is just the v fiber, we apply the quaternion action from a u fiber (red circle)
                const pT = applyIJ(p, u, params.i - 1, j);

                points.push(stereographic(pT, 1.0, 6)); // Adjust scale for a better-looking stereographic projection
            }

            // --- Morph function: Hopf bundle collapses at the guessed center of each of their circle fiber "centerGuess" ---
            const centerGuess = new THREE.Vector3();
            for (let p of points) centerGuess.add(p);

            const fiberPts = [];
            for (let p of points) {
                const dir = p.clone().sub(centerGuess).normalize();
                const hopfP = p;
                const unlinkedP = centerGuess.clone().add(dir.multiplyScalar(0));
                const finalP = hopfP.clone().lerp(unlinkedP, params.unlink);
                fiberPts.push(finalP);
            }

            const curve = new THREE.CatmullRomCurve3(fiberPts, true);
            nextFiberGroup.add(new THREE.Mesh(
                new THREE.TubeGeometry(curve, params.tubularSegs, params.tubeRadius, params.radialSegs, true),
                fiberMat
            ));

            // --- Compute, or more accurately, 'guess' the center of morphed circle ---
            const finalCenter = new THREE.Vector3();
            for (let p of fiberPts) finalCenter.add(p);
            finalCenter.divideScalar(fiberPts.length);

            // --- Push the center circle outward a bit ---
            const adjustedCenter = finalCenter.clone().multiplyScalar(params.centerScale);
            centers.push(adjustedCenter);

            // --- Yellow markers ---
            const dirVec = fiberPts[0].clone().sub(finalCenter).normalize();
            const markPos = finalCenter.clone().add(dirVec.multiplyScalar((1 - params.unlink) * fiberPts[0].distanceTo(finalCenter)));
            const mark = new THREE.Mesh(markGeom, markMat);
            mark.position.copy(markPos);
            nextFiberGroup.add(mark);

            // // --- Draw u(tau) fiber (red circle) ---
            // const redPts = [];
            // const steps = 128;
            // for (let t = 0; t <= 2 * Math.PI + 1e-6; t += 2 * Math.PI / steps) {
            //     const uTau = u_on_fiber(u_base, t);
            //     redPts.push(stereographic(uTau));
            // }

            // const redCurve = new THREE.CatmullRomCurve3(redPts, true);
            // const redGeom = new THREE.TubeGeometry(redCurve, 200, 0.04, 8, true);
            // const redMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            // nextFiberGroup.add(new THREE.Mesh(redGeom, redMat));

            // In above way the V fiber phase parameter theta will slightly change U(tau) fiber, so NO.
        }

        // Green circle through adjusted centers
        const centerCurve = new THREE.CatmullRomCurve3(centers, true);
        const centerTubeGeom = new THREE.TubeGeometry(centerCurve, 200, 0.05, 8, true);
        const centerTubeMat = new THREE.MeshPhongMaterial({ color: 0x00ff00, shininess: 80 });
        const centerTube = new THREE.Mesh(centerTubeGeom, centerTubeMat);
        nextFiberGroup.add(centerTube);

        return nextFiberGroup;
    }

    function buildUFiber(fiberGroup) {
        const independentBase = new THREE.Vector3(
            u_base.x, u_base.y, u_base.z
        ); // frozen snapshot of the basepoint

        const redPts = [];
        const steps = 128;
        for (let t = 0; t <= 2 * Math.PI + 1e-6; t += 2 * Math.PI / steps) {
            const uTau = u_on_fiber(independentBase, t);
            redPts.push(stereographic(uTau));
        }

        const redCurve = new THREE.CatmullRomCurve3(redPts, true);
        const redGeom = new THREE.TubeGeometry(redCurve, 200, 0.04, 8, true);
        const redMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        fiberGroup.add(new THREE.Mesh(redGeom, redMat));
    }

    App.builders = {
        disposeGroup,
        disposeBaseSpace,
        buildBaseSpace,
        buildVFibers,
        buildUFiber,
    };
})(window);
