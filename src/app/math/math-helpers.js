import * as THREE from 'three';

/**
 * Quaternion helpers, stereographic projection, and fiber helpers.
 * Depends on params and u_base (injected when creating helpers).
 */
export function createMathHelpers(params, u_base) {
    // --- Quaternion helpers ---
    function quatMul(a, b) {
        return {
            w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
            x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
            y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
            z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
        };
    }

    function quatConj(q) {
        return { w: q.w, x: -q.x, y: -q.y, z: -q.z };
    }

    function powQuat(q, n) {
        if (n === 0) return { w: 1, x: 0, y: 0, z: 0 }; // identity
        let base = (n > 0) ? q : quatConj(q); // inverse if negative
        let r = { w: 1, x: 0, y: 0, z: 0 };
        for (let k = 0; k < Math.abs(n); k++) r = quatMul(r, base);
        return r;
    }

    // Generate quaternion u(t) = cos t + n sin t
    //  function U(t, n) {
    //      return { w: Math.cos(t), x: n.x * Math.sin(t), y: n.y * Math.sin(t), z: n.z * Math.sin(t) };
    //  }

    // action: u^h v u^j
    function applyIJ(v, u, i, j) {
        const uh = powQuat(u, i);
        const uj = powQuat(u, j);
        return quatMul(quatMul(uh, v), uj);
    }

    // --- e^{i*tau} subgroup (i = x-axis imaginary unit) ---
    function eIT(tau) {
        return { w: Math.cos(tau), x: Math.sin(tau), y: 0, z: 0 };
    }

    // Rotor R(m): sends i -> m, where m=(mx,my,mz) is unit on S^2 ---
    function rotorFromBasepoint(mx, my, mz) {
        if (mx === -1 && my === 0 && mz === 0) return { w: 0, x: 0, y: 0, z: 1 }; // 180° about k
        const w = Math.sqrt((1 + mx) / 2);
        const d = Math.sqrt(2 * (1 + mx));
        return { w, x: 0, y: mz / d, z: -my / d }; // (x,y,z,w) ordering for our plain object
    }

    // --- Multiply plain {w,x,y,z} quats. Recover the Hopf fiber of choosen base point ---
    function u_on_fiber(m, tau) {
        const R = rotorFromBasepoint(m.x, m.y, m.z);
        return quatMul(R, eIT(tau)); // u(tau) = R(m) * e^{i*tau}
    }

    // --- helpers for the stack view
    function currentDenomFactor(q) {
        return params.stackView ? 0.25 : (1 - q.w);
    }

    function currentTheta(b, a, t) {
        return params.stackView
            ? Math.atan2(b, -a) / 4
            : Math.atan2(b, -a) - t;
    }

    //U fiber action on each V fiber at specific degree f
    // tauOffset is the offset of the U fiber from the base point
    // I no longer use tauOffset, because I can make the U fiber rotation angle independent of the base point.

    // f is the degree of the base point on S^2 on equator
    function currentU(tauOffset, f) {
        return params.stackView
            ? u_on_fiber(u_base, tauOffset + f / 2)
            : u_on_fiber(u_base, tauOffset + f);
    }

    // Stereographic projection from S^3 to R^3
    function stereographic(q, R = 1.0, scale = 1.0) {
        let denom = currentDenomFactor(q) * scale;
        if (Math.abs(denom) < 1e-6) denom = (denom < 0 ? -1 : 1) * 1e-6;
        return new THREE.Vector3((q.x / denom) * R, (q.y / denom) * R, (q.z / denom) * R);
    }

    return {
        quatMul,
        quatConj,
        powQuat,
        applyIJ,
        eIT,
        rotorFromBasepoint,
        u_on_fiber,
        currentDenomFactor,
        currentTheta,
        currentU,
        stereographic,
    };
}
