// ---------------------------------------------------------------------------
// "Shape Studio": a single rounded rectangle (plain fill or bordered
// outline) that defocuses locally around the cursor — an SDF-blur "lens"
// that follows the pointer, after tympanus.net/Tutorials/SDFLensBlur.
//
// The blur is not a real convolution. It uses the standard SDF-blur trick:
// widening a signed-distance-field's antialiasing band by a given radius
// approximates that region as if it had been Gaussian-blurred by that same
// radius (exact for a straight edge, a close visual match for a curved
// one) — so "blur" here is just how wide the edge transition is, and it's
// cheap enough to modulate per-pixel every frame. The width is driven by a
// falloff centered on the cursor, so the defocus reads as a soft lens that
// travels with the pointer and only does anything visible where an edge
// (the shape's fill or stroke boundary) actually passes underneath it.
// ---------------------------------------------------------------------------
export const SHAPE_FRAG = /* glsl */ `
precision highp float;

uniform vec2  uResolution;
uniform vec2  uMouse;          // device px, gl_FragCoord space
uniform float uPadding;        // device px inset between canvas edge and shape
uniform float uRadius;         // device px, pre-clamped to half the shape's short side
uniform float uBordered;       // 0 = filled, 1 = outline only
uniform float uBorderWidth;    // device px
uniform float uHoverIntensity; // 0..1, eased lens strength
uniform vec3  uColBg;
uniform vec3  uColShape;

// Rounded-box SDF (Inigo Quilez): negative inside, positive outside.
float roundedBoxSdf(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

void main() {
  vec2 p = gl_FragCoord.xy - 0.5 * uResolution;
  vec2 halfSize = 0.5 * uResolution - vec2(uPadding);
  float sdf = roundedBoxSdf(p, halfSize, uRadius);
  if (uBordered > 0.5) {
    sdf = abs(sdf) - 0.5 * uBorderWidth;
  }

  // Lens: a circular falloff centered on the cursor, sized relative to the
  // canvas so it scales with the shape rather than being a fixed pixel
  // radius. Blur radius peaks at the cursor and eases to zero by its rim.
  float minSide = min(uResolution.x, uResolution.y);
  float lensRadius = 0.5 * minSide;
  float falloff = 1.0 - smoothstep(0.0, lensRadius, length(gl_FragCoord.xy - uMouse));
  float maxBlur = 0.32 * minSide;
  float blur = max(uHoverIntensity * maxBlur * falloff, 1.0); // 1px floor keeps a clean edge at rest

  float alpha = 1.0 - smoothstep(-blur, blur, sdf);
  vec3 col = mix(uColBg, uColShape, alpha);
  gl_FragColor = vec4(col, 1.0);
}
`
