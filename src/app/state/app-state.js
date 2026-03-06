import * as THREE from 'three';

/**
 * Global app parameters and state.
 * u_base is the current basepoint on S^2 (mutated when longitude/latitude change).
 */
export const params = {
    tubeRadius: 0.03,
    fibers: 24,
    tubularSegs: 100,
    radialSegs: 8,
    unlink: 0.01, // 0 = Hopf bundle, 1 = collapsed
    i: 1, // When you drawing a hopf fibration you actually already excuted a quaternion calculation once.
    i_pending: 2,
    centerScale: 1.1, // enlarge blue tube radius
    theta: 90,      // angle for fiber phase of selected v points
    vLatitude: 90,  // latitude (degrees) for the V base-circle on S^2 (90 = equator)
    longitude: 0,
    latitude: 90,   // latitude in degrees, default = equator
    stackView: false,
    trivialBundle: false,  // false = Hopf bundle, true = Trivial bundle
};

export const state = {
    hasInteracted: false,
};

// mutate with .copy()
export const u_base = new THREE.Vector3(0, 0, 1);
