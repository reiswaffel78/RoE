// Full-screen sky rendered by a single fragment shader: gradient, sun/moon
// with bloom halo, twinkling stars, milky way, drifting clouds, aurora.

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
    vec2 p = vec2(uv.x * uAspect, uv.y) + uParallax * 0.15;
    float h = clamp(uv.y / uHorizonY, 0.0, 1.2);

    // Vertical three-stop gradient.
    vec3 col = mix(uTop, uMid, smoothstep(0.0, 0.8, h));
    col = mix(col, uHorizon, smoothstep(0.55, 1.05, h));

    // Milky way band and stars (night only).
    if (uStars > 0.001) {
        float bandDist = abs((p.y - 0.18) - (p.x - uAspect * 0.5) * 0.28);
        float band = fbm(p * 4.0 + vec2(uTime * 0.003, 0.0)) * smoothstep(0.28, 0.0, bandDist);
        col += vec3(0.32, 0.36, 0.55) * band * band * uStars * 0.9;

        for (int layer = 0; layer < 2; layer++) {
            float density = layer == 0 ? 90.0 : 220.0;
            vec2 g = (p + uParallax * (0.05 + float(layer) * 0.05)) * density;
            vec2 id = floor(g);
            float r = hash(id + float(layer) * 17.0);
            vec2 offset = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
            float d = length(fract(g) - 0.5 - offset * 0.6);
            float threshold = layer == 0 ? 0.965 : 0.93;
            float star = step(threshold, r) * smoothstep(0.12 + 0.1 * r, 0.0, d);
            float twinkle = 0.55 + 0.45 * sin(uTime * (0.8 + r * 3.0) + r * 60.0);
            vec3 tint = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.9, 0.75), hash(id + 1.3));
            col += tint * star * twinkle * uStars * (1.0 - smoothstep(0.6, 1.0, h)) * (layer == 0 ? 1.3 : 0.7);
        }
    }

    // Aurora curtains.
    if (uAurora > 0.001) {
        float x = p.x;
        float wave = fbm(vec2(x * 1.3 + uTime * 0.025, uTime * 0.04));
        float center = 0.16 + wave * 0.22 + 0.04 * sin(x * 2.3 + uTime * 0.12);
        float dy = uv.y - center;
        float curtain = exp(-pow(max(dy, 0.0) / 0.05, 2.0)) + exp(-pow(min(dy, 0.0) / 0.18, 2.0)) * 0.55;
        float rays = 0.45 + 0.55 * noise(vec2(x * 38.0, uTime * 0.35));
        rays *= 0.6 + 0.4 * noise(vec2(x * 7.0 - uTime * 0.2, 2.0));
        vec3 aurora = mix(uAuroraA, uAuroraB, smoothstep(-0.02, -0.2, dy));
        col += aurora * curtain * rays * uAurora * (1.0 - smoothstep(0.7, 1.0, h)) * 0.9;
    }

    // Sun or moon with layered halo.
    vec2 s = vec2(uSunPos.x * uAspect, uSunPos.y);
    float d = length(p - s);
    float halo = 0.3 * exp(-d * d * 34.0) + 0.09 * exp(-d * 5.0) + 0.025 * exp(-d * 1.4);
    col += uSun * halo * (1.0 - uMoon * 0.55);
    float disk = smoothstep(uSunSize, uSunSize * 0.82, d);
    vec3 diskColor = uSun * (1.25 - uMoon * 0.15);
    if (uMoon > 0.5) {
        // Moon craters.
        float crater = fbm((p - s) * 38.0);
        diskColor *= 0.82 + 0.25 * crater;
    }
    col = mix(col, diskColor, disk);

    // Clouds: two stretched fbm layers lit from the sun side.
    if (uClouds > 0.001) {
        vec2 cp = vec2(p.x * 1.6 + uTime * 0.006, p.y * 5.5);
        float n = fbm(cp) * 0.65 + fbm(cp * 2.1 + vec2(uTime * 0.01, 0.0)) * 0.35;
        float coverage = smoothstep(0.62 - uClouds * 0.28, 0.9, n);
        float band = smoothstep(0.05, 0.3, h) * (1.0 - smoothstep(0.75, 1.0, h));
        float lit = 1.0 - smoothstep(0.0, 0.9, d);
        vec3 cloud = mix(uCloudColor * 0.82, uCloudColor * 1.08 + uSun * 0.25, lit);
        col = mix(col, cloud, coverage * band * (0.55 + 0.35 * uClouds));
    }

    // Dither against banding in dark gradients.
    col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
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
                    uAuroraA: { value: new Float32Array([0.2, 1.0, 0.65]), type: 'vec3<f32>' },
                    uAuroraB: { value: new Float32Array([0.55, 0.3, 0.95]), type: 'vec3<f32>' },
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
        toVec3(s.palette.skyMid, u.uMid as Float32Array);
        toVec3(s.palette.horizon, u.uHorizon as Float32Array);
        toVec3(s.palette.sun, u.uSun as Float32Array);
        toVec3(s.palette.cloud, u.uCloudColor as Float32Array);
        const sun = u.uSunPos as Float32Array;
        sun[0] = s.sunX;
        sun[1] = s.sunY;
        const par = u.uParallax as Float32Array;
        par[0] = s.parallaxX;
        par[1] = s.parallaxY;
        u.uMoon = s.moon;
        u.uSunSize = s.moon > 0.5 ? 0.028 : 0.034;
        u.uStars = s.stars;
        u.uAurora = s.aurora;
        u.uClouds = s.clouds;
        u.uHorizonY = s.horizonY;
        u.uTime = s.time;
    }
}
