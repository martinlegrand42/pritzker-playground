// Fullscreen triangle vertex shader (WebGL1 / GLSL ES 100)
export const VERT_SHADER = /* glsl */ `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

// Ashima 3D simplex noise + a little fbm, shared by both engines.
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p){
  float a = 0.5;
  float f = 1.0;
  float s = 0.0;
  for (int i = 0; i < 5; i++) {
    s += a * snoise(p * f);
    f *= 2.0;
    a *= 0.5;
  }
  return s;
}

// Cheap animated film grain — used to dither the gradient and kill banding.
float grain(vec2 co, float t){
  return fract(sin(dot(co + t, vec2(12.9898, 78.233))) * 43758.5453);
}
`

// ---------------------------------------------------------------------------
// VERSION A — "Aura": a single breathing, wobbly gradient mark.
// ---------------------------------------------------------------------------
export const AURA_FRAG = /* glsl */ `
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform vec2  uMouse;       // in aspect-corrected uv space
uniform float uHover;       // 0..1 eased
uniform float uSize;        // base radius
uniform float uWobble;      // rim distortion amount
uniform float uWobbleSpeed;
uniform float uBreath;      // scale in/out amount
uniform float uBreathSpeed;
uniform float uSoftness;    // rim / halo softness
uniform float uGradient;    // how much the gradient bands drift out of sync
uniform float uGrain;       // grain amount
uniform float uGrainSize;   // grain cell size, in device pixels
uniform float uHoverStrength; // how much the cursor magnifies nearby wobble
uniform vec3  uColCore;
uniform vec3  uColMid;
uniform vec3  uColEdge;
uniform vec3  uColBg;

${NOISE}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);

  vec2 d = uv;
  float rr = length(d);
  float ang = atan(d.y, d.x);

  // organic rim wobble (two octaves) — never a perfect circle
  float wob = uWobble * snoise(vec3(cos(ang), sin(ang), uTime * uWobbleSpeed * 0.5));
  wob += uWobble * 0.4 * snoise(vec3(cos(ang) * 2.3, sin(ang) * 2.3, uTime * uWobbleSpeed * 0.9 + 10.0));

  // the cursor magnifies the existing wobble locally, on whichever side of
  // the mark it's nearest to — not a global effect, and gentle by default.
  float mouseAng = atan(uMouse.y, uMouse.x);
  float angAlign = max(0.0, cos(ang - mouseAng));
  float proximity = 1.0 - smoothstep(0.0, uSize * 2.4, length(uMouse));
  float magnify = uHover * uHoverStrength * angAlign * angAlign * proximity;
  wob *= 1.0 + magnify * 3.0;

  // slow breathing (scale in / out)
  float breath = 1.0 + uBreath * sin(uTime * uBreathSpeed);
  float radius = uSize * breath + wob;

  // normalized distance inside the mark
  float t = rr / max(radius, 0.0001);

  // gradient bands drift out of sync so the fill feels alive / random
  float g1 = uGradient * 0.18 * sin(uTime * 0.61 + 1.3);
  float g2 = uGradient * 0.16 * sin(uTime * 0.47 + 4.1);

  vec3 col = uColCore;
  col = mix(col, uColMid,  smoothstep(0.02, 0.6 + g1, t));
  col = mix(col, uColEdge, smoothstep(0.55 + g1, 0.95 + g2, t));

  // soft rim + outer halo
  float mask = 1.0 - smoothstep(1.0 - uSoftness, 1.0 + uSoftness, t);
  float halo = exp(-pow(max(t - 1.0, 0.0) / (uSoftness * 1.4 + 0.08), 2.0));

  vec3 outCol = mix(uColBg, col, mask);
  outCol = mix(outCol, mix(uColBg, uColEdge, 0.6), halo * (1.0 - mask) * 0.5);

  // grain dither, sampled per cell (not per pixel) so it reads as soft
  // clumped grain instead of single-pixel static
  vec2 grainCell = floor(gl_FragCoord.xy / max(uGrainSize, 1.0));
  float gr = grain(grainCell, uTime * 20.0);
  outCol += (gr - 0.5) * uGrain;

  gl_FragColor = vec4(outCol, 1.0);
}
`

// ---------------------------------------------------------------------------
// VERSION B — "Field": a divergent take. Instead of one object, the identity
// becomes an environment: a domain-warped thermal gradient field that can be
// banded into contour lines. A brand wallpaper / motion-background generator.
// ---------------------------------------------------------------------------
export const FIELD_FRAG = /* glsl */ `
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform vec2  uMouse;       // 0..1
uniform float uHover;
uniform float uScale;       // zoom of the field
uniform float uWarp;        // domain-warp intensity
uniform float uSpeed;       // flow speed
uniform float uBands;       // thermal contour count (0 = smooth)
uniform float uContrast;
uniform float uGrain;
uniform float uGrainSize;
uniform vec3  uCol0;
uniform vec3  uCol1;
uniform vec3  uCol2;
uniform vec3  uCol3;

${NOISE}

vec3 palette(float v){
  v = clamp(v, 0.0, 1.0);
  vec3 c = mix(uCol0, uCol1, smoothstep(0.0, 0.4, v));
  c = mix(c, uCol2, smoothstep(0.35, 0.72, v));
  c = mix(c, uCol3, smoothstep(0.7, 1.0, v));
  return c;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y) * uScale;

  float t = uTime * uSpeed;

  // pointer warps the field locally
  vec2 m = (uMouse - 0.5) * 2.0;
  p += m * uHover * 0.6;

  // iterative domain warping
  vec2 q = vec2(fbm(vec3(p, t)), fbm(vec3(p + 5.2, t + 1.3)));
  vec2 r = vec2(
    fbm(vec3(p + q * uWarp + vec2(1.7, 9.2), t * 1.1)),
    fbm(vec3(p + q * uWarp + vec2(8.3, 2.8), t * 0.9))
  );
  float v = fbm(vec3(p + r * uWarp, t * 0.8));
  v = v * 0.5 + 0.5;

  // contrast around mid
  v = clamp((v - 0.5) * uContrast + 0.5, 0.0, 1.0);

  // optional thermal banding (contour look)
  if (uBands > 0.5) {
    float banded = floor(v * uBands) / max(uBands - 1.0, 1.0);
    v = mix(v, banded, 0.85);
  }

  vec3 col = palette(v);

  vec2 grainCell = floor(gl_FragCoord.xy / max(uGrainSize, 1.0));
  float gr = grain(grainCell, uTime * 20.0);
  col += (gr - 0.5) * uGrain;

  gl_FragColor = vec4(col, 1.0);
}
`
