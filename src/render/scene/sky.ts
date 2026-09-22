// Full-screen sky rendered by a single fragment shader in a flat illustrative
// style: calm gradient, large soft sun/moon, stars, cloud bands, aurora, grain.

import { Mesh, MeshGeometry, Shader } from 'pixi.js';
import { toVec3 } from './color';
import type { Palette } from './palette';

const vertex = /* glsl */ `
in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;
void main() {
    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
    vUV = aUV;
}
`;

const fragment = /* glsl */ `
in vec2 vUV;
out vec4 finalColor;

uniform vec3 uTop;
uniform vec3 uMid;
uniform vec3 uHorizon;
uniform vec3 uSun;
uniform vec3 uCloudColor;
uniform vec3 uAuroraA;
uniform vec3 uAuroraB;
uniform vec2 uSunPos;
uniform float uSunSize;
uniform float uHorizonY;
uniform float uStars;
uniform float uAurora;
uniform float uClouds;
uniform float uMoon;
uniform float uTime;
uniform float uAspect;
uniform vec2 uParallax;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = p * 2.03 + vec2(1.7, 9.2);
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = vUV;
    vec2 p = vec2(uv.x * uAspect, uv.y) + uParallax * 0.1;
    float h = clamp(uv.y / uHorizonY, 0.0, 1.2);

    // Flat illustration sky: a calm two-tone gradient with a soft horizon lift.
    vec3 col = mix(uTop, uHorizon, smoothstep(0.0, 1.0, h));
    col = mix(col, uMid, 0.18 * smoothstep(0.6, 1.0, h));

    // Stars and a faint milky way at night.
    if (uStars > 0.001) {
        float bandDist = abs((p.y - 0.2) - (p.x - uAspect * 0.5) * 0.25);
        float band = fbm(p * 3.0) * smoothstep(0.3, 0.0, bandDist);
        col += vec3(0.25, 0.28, 0.42) * band * band * uStars * 0.6;
        vec2 g = (p + uParallax * 0.04) * 120.0;
        vec2 id = floor(g);
        float r = hash(id);
        vec2 offset = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
        float d = length(fract(g) - 0.5 - offset * 0.6);
        float star = step(0.975, r) * smoothstep(0.1 + 0.06 * r, 0.0, d);
        float twinkle = 0.65 + 0.35 * sin(uTime * (0.5 + r * 2.0) + r * 60.0);
        col += vec3(0.9, 0.92, 1.0) * star * twinkle * uStars * (1.0 - smoothstep(0.55, 0.95, h)) * 0.85;
    }

    // Aurora: one sweeping, softly folded ribbon of light.
    if (uAurora > 0.001) {
        float x = p.x;
        float wave = fbm(vec2(x * 0.7 + uTime * 0.015, uTime * 0.02));
        float center = 0.16 + wave * 0.18 + 0.06 * sin(x * 1.4 + uTime * 0.05);
        float dy = uv.y - center;
        // Sharp lower edge, long soft fade upwards.
        float curtain = exp(-pow(max(dy, 0.0) / 0.035, 2.0)) + exp(-pow(min(dy, 0.0) / 0.2, 2.0)) * 0.7;
        float folds = 0.82 + 0.18 * noise(vec2(x * 9.0 + uTime * 0.1, 1.0));
        float fade = smoothstep(0.0, 0.5, sin(x * 0.9 + 0.6) * 0.5 + 0.5);
        vec3 aurora = mix(uAuroraA, uAuroraB, smoothstep(-0.02, -0.28, dy));
        col = mix(col, col + aurora * 0.55, curtain * folds * fade * uAurora * (1.0 - smoothstep(0.6, 0.95, h)));
    }

    // Large, quiet sun or moon: a flat disc with a gentle halo.
    vec2 s = vec2(uSunPos.x * uAspect, uSunPos.y);
    float d = length(p - s);
    float halo = 0.2 * exp(-d * 3.4) + 0.12 * exp(-d * d * 60.0);
    col = mix(col, uSun, clamp(halo * (1.0 - uMoon * 0.35), 0.0, 1.0));
    float disk = smoothstep(uSunSize, uSunSize - 0.004, d);
    vec3 diskColor = mix(uSun, vec3(1.0), 0.12);
    if (uMoon > 0.5) diskColor *= 0.93 + 0.07 * fbm((p - s) * 22.0);
    col = mix(col, diskColor, disk * 0.96);

    // Flat, softly edged cloud bands.
    if (uClouds > 0.001) {
        vec2 cp = vec2(p.x * 1.1 + uTime * 0.004, p.y * 4.2);
        float n = fbm(cp);
        float coverage = smoothstep(0.6 - uClouds * 0.2, 0.64 - uClouds * 0.2, n);
        float band = smoothstep(0.08, 0.3, h) * (1.0 - smoothstep(0.7, 0.95, h));
        vec3 cloud = mix(col, mix(uCloudColor, uSun, 0.25), 0.55);
        col = mix(col, cloud, coverage * band * (0.35 + 0.35 * uClouds));
    }

    // Paper grain (static, so it reads as texture rather than noise).
    col += (hash(floor(gl_FragCoord.xy * 0.75)) - 0.5) * 0.035;
    finalColor = vec4(col, 1.0);
}
`;

export interface SkyState {
    palette: Palette;
    sunX: number;
    sunY: number;
    moon: number;
    stars: number;
    aurora: number;
    clouds: number;
    horizonY: number;
    time: number;
    parallaxX: number;
    parallaxY: number;
}

export class Sky {
    readonly mesh: Mesh<MeshGeometry, Shader>;
    private readonly u: Record<string, unknown>;

    constructor() {
        const geometry = new MeshGeometry({
            positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
            uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
            indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
        });
        const vec3 = () => ({ value: new Float32Array(3), type: 'vec3<f32>' });
        const shader = Shader.from({
            gl: { vertex, fragment, name: 'roe-sky' },
            resources: {
                skyUniforms: {
                    uTop: vec3(),
                    uMid: vec3(),
                    uHorizon: vec3(),
                    uSun: vec3(),
                    uCloudColor: vec3(),
                    uAuroraA: { value: new Float32Array([0.33, 0.9, 0.66]), type: 'vec3<f32>' },
                    uAuroraB: { value: new Float32Array([0.52, 0.36, 0.8]), type: 'vec3<f32>' },
                    uSunPos: { value: new Float32Array([0.5, 0.3]), type: 'vec2<f32>' },
                    uParallax: { value: new Float32Array([0, 0]), type: 'vec2<f32>' },
                    uSunSize: { value: 0.035, type: 'f32' },
                    uHorizonY: { value: 0.6, type: 'f32' },
                    uStars: { value: 0, type: 'f32' },
                    uAurora: { value: 0, type: 'f32' },
                    uClouds: { value: 0.3, type: 'f32' },
                    uMoon: { value: 0, type: 'f32' },
                    uTime: { value: 0, type: 'f32' },
                    uAspect: { value: 1, type: 'f32' },
                },
            },
        });
        this.mesh = new Mesh({ geometry, shader });
        this.u = (shader.resources.skyUniforms as { uniforms: Record<string, unknown> }).uniforms;
    }

    resize(width: number, height: number) {
        this.mesh.scale.set(width, height);
        this.u.uAspect = width / Math.max(1, height);
    }

    update(s: SkyState) {
        const u = this.u;
        toVec3(s.palette.skyTop, u.uTop as Float32Array);
        toVec3(s.palette.sun, u.uMid as Float32Array);
        toVec3(s.palette.skyBottom, u.uHorizon as Float32Array);
        toVec3(s.palette.sun, u.uSun as Float32Array);
        toVec3(s.palette.skyBottom, u.uCloudColor as Float32Array);
        const sun = u.uSunPos as Float32Array;
        sun[0] = s.sunX;
        sun[1] = s.sunY;
        const par = u.uParallax as Float32Array;
        par[0] = s.parallaxX;
        par[1] = s.parallaxY;
        u.uMoon = s.moon;
        u.uSunSize = s.moon > 0.5 ? 0.05 : 0.075;
        u.uStars = s.stars;
        u.uAurora = s.aurora;
        u.uClouds = s.clouds;
        u.uHorizonY = s.horizonY;
        u.uTime = s.time;
    }
}
