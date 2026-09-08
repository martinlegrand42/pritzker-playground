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
uniform float uCenterDamp;     // 0..1, how much to cut the lens when hovering deep inside the shape
uniform float uHoverColorAmount; // 0..1, how far shape color tints toward hover color at its stop
uniform vec3  uColBg;
uniform vec3  uColShape;
uniform vec3  uColHover;       // shows only in the blurred transition band, at its outer edge

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
  // shape's own current half-extent (already shrunk by zoom via uPadding)
  // rather than the canvas — so dezooming the shape scales the lens and
  // blur down right along with it instead of leaving a canvas-sized lens
  // looming over an increasingly small shape. Blur radius peaks at the
  // cursor and eases to zero by its rim.
  float shapeSize = 2.0 * min(halfSize.x, halfSize.y);
  float lensRadius = 0.7 * shapeSize;
  float falloff = 1.0 - smoothstep(0.0, lensRadius, length(gl_FragCoord.xy - uMouse));
  float maxBlur = 0.6 * shapeSize;

  // How deep the cursor itself currently sits inside the shape (not this
  // fragment) — evaluate the same SDF at the mouse position so hovering
  // dead center can be told apart from hovering near the rim, and damp
  // the lens down as the cursor moves deeper inside.
  vec2 mouseP = uMouse - 0.5 * uResolution;
  float mouseSdf = roundedBoxSdf(mouseP, halfSize, uRadius);
  if (uBordered > 0.5) {
    mouseSdf = abs(mouseSdf) - 0.5 * uBorderWidth;
  }
  float centerDepth = clamp(-mouseSdf / (0.5 * shapeSize), 0.0, 1.0);
  // Square-rooted so the reduction ramps up fast moving in from the rim
  // instead of linearly — at full strength this keeps a much larger
  // share of the interior crisp, not just the exact center point.
  float centerReduction = 1.0 - uCenterDamp * sqrt(centerDepth);

  float blur = max(uHoverIntensity * maxBlur * falloff * centerReduction, 1.0); // 1px floor keeps a clean edge at rest

  // Three sequential stops — shape, then hover color, then background —
  // chained so each mix starts from the previous one's result instead of
  // two independent shape-to-background and color-to-hover blends. Doing
  // it as two independent blends (an earlier version of this) let the
  // background show through faintly before the hover color had fully
  // taken over, since both were being mixed toward at once; chaining
  // guarantees the hover color is a mandatory waypoint with no gap where
  // background leaks in early. sdf is normalized by the current blur
  // radius, so the whole gradient only has room to unfold once the lens
  // has actually widened that transition, and collapses back to a plain
  // two-color edge (no visible hover color) once blur shrinks back down
  // to its resting 1px floor.
  float t = clamp(sdf / blur, -1.0, 1.0);
  float shapeToHover = smoothstep(-1.0, -0.6, t);
  float hoverToBg = smoothstep(0.4, 1.0, t);

  // Scaling shapeToHover itself (rather than the mix below it) keeps this
  // leak-free at any amount: at 0 the shape simply never tints toward
  // hover color and this stage is a no-op, at 1 it's the full stop above
  // — and the still-later hoverToBg mix always starts from whatever this
  // produced, so there's never a point where raw background reappears.
  vec3 col = mix(uColShape, uColHover, shapeToHover * uHoverColorAmount);
  col = mix(col, uColBg, hoverToBg);

  gl_FragColor = vec4(col, 1.0);
}
`
