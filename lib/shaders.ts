// Fullscreen triangle vertex shader (WebGL1 / GLSL ES 100)
export const VERT_SHADER = /* glsl */ `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

// Ashima 3D simplex noise, shared by both engines.
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

// Cheap film grain — a fixed dither pattern (per grain cell) used to kill
// gradient banding. Deliberately not time-varying: it must read as a still
// texture, not flicker.
float grain(vec2 co){
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
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

  // one gentle, very-low-frequency octave — sampled from a small patch of
  // the noise field (not a full unit circle around it) so at most one soft
  // lean shows up per revolution, never multiple lobes or a faceted edge
  float wob = uWobble * snoise(vec3(cos(ang) * 0.35, sin(ang) * 0.35, uTime * uWobbleSpeed * 0.5));

  // on hover, a single smooth lobe of liquid gathers toward the cursor —
  // rounded like a lava-lamp blob, not a spike, and added rather than
  // multiplied so it never sharpens the ambient wobble
  float mouseAng = atan(uMouse.y, uMouse.x);
  float lobe = exp(-(1.0 - cos(ang - mouseAng)) * 2.2);
  float proximity = 1.0 - smoothstep(0.0, uSize * 2.4, length(uMouse));
  wob += uHover * uHoverStrength * lobe * proximity * uSize * 1.6;

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
  // clumped grain instead of single-pixel static, and fixed in time
  vec2 grainCell = floor(gl_FragCoord.xy / max(uGrainSize, 1.0));
  float gr = grain(grainCell);
  outCol += (gr - 0.5) * uGrain;

  gl_FragColor = vec4(outCol, 1.0);
}
`

// ---------------------------------------------------------------------------
// VERSION B — "Prism": a divergent take. Instead of a fixed brand palette,
// the mark becomes a perfect disc cycling continuously through the full hue
// wheel, with a soft highlight that drifts toward the cursor on hover.
// ---------------------------------------------------------------------------
export const PRISM_FRAG = /* glsl */ `
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform vec2  uMouse;         // in aspect-corrected uv space, like Aura
uniform float uHover;         // 0..1 eased
uniform float uHoverStrength; // how much the highlight nudges toward the cursor
uniform float uSize;          // disc radius
uniform float uSoftness;      // edge softness
uniform float uGlowSize;      // radius of the central highlight
uniform float uHueSpeed;      // hue rotation speed
uniform float uHueSpread;     // how much hue varies spatially across the disc
uniform float uSaturation;
uniform float uChroma;        // chromatic aberration: RGB split near the rim
uniform float uGrain;
uniform float uGrainSize;
uniform vec3  uColBg;

${NOISE}

vec3 hsv2rgb(vec3 c){
  vec3 p = abs(fract(c.xxx + vec3(0.0, 1.0 / 3.0, 2.0 / 3.0)) * 6.0 - 3.0);
  vec3 rgb = clamp(p - 1.0, 0.0, 1.0);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

// Hue + limb-darkening at a given point, sampled per-channel below with a
// tiny radial offset to fake chromatic aberration (a real prism's dispersion).
vec3 discColor(vec2 p){
  float rr = length(p);
  float ang = atan(p.y, p.x);
  float t = rr / max(uSize, 0.0001);
  float hue = fract(uTime * uHueSpeed + p.y * uHueSpread * 0.5 + sin(ang) * uHueSpread * 0.12);
  vec3 col = hsv2rgb(vec3(hue, uSaturation, 1.0));
  col *= mix(1.0, 0.55, smoothstep(0.0, 1.0, t));
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);

  float rr = length(uv);
  float ang = atan(uv.y, uv.x);
  float t = rr / max(uSize, 0.0001);
  float mask = 1.0 - smoothstep(1.0 - uSoftness, 1.0 + uSoftness, t);

  // chromatic aberration: split the red/blue channels outward/inward along
  // the radius, growing toward the rim like light dispersing through glass
  vec2 dir = rr > 0.0001 ? uv / rr : vec2(0.0);
  float ca = uChroma * 0.05 * t;
  vec3 col = vec3(
    discColor(uv + dir * ca).r,
    discColor(uv).g,
    discColor(uv - dir * ca).b
  );

  // the highlight nudges toward the cursor on hover — gently, it never
  // travels all the way to the pointer
  vec2 glowCenter = uMouse * uHoverStrength * uHover * 0.5;
  float glow = exp(-pow(length(uv - glowCenter) / max(uGlowSize, 0.02), 2.0));
  col = mix(col, vec3(1.0), glow * 0.85);

  vec3 outCol = mix(uColBg, col, mask);

  vec2 grainCell = floor(gl_FragCoord.xy / max(uGrainSize, 1.0));
  float gr = grain(grainCell);
  outCol += (gr - 0.5) * uGrain;

  gl_FragColor = vec4(outCol, 1.0);
}
`
