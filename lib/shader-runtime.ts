import { VERT_SHADER } from './shaders'

export type UniformValue = number | [number, number] | [number, number, number]
export type Uniforms = Record<string, UniformValue>

export interface Renderer {
  gl: WebGLRenderingContext
  canvas: HTMLCanvasElement
  render: (uniforms: Uniforms, scale?: number) => void
  resize: (scale?: number) => { width: number; height: number }
  destroy: () => void
}

export class ContextLostError extends Error {
  constructor() {
    super('WebGL context lost during initialization')
    this.name = 'ContextLostError'
  }
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Unable to create shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    const contextLost = gl.isContextLost()
    gl.deleteShader(shader)
    // A null/empty log almost always means the context was lost mid-compile
    // (common right at mount before layout settles). Surface it as retryable.
    if (!log || contextLost) {
      throw new ContextLostError()
    }
    throw new Error('Shader compile error: ' + log)
  }
  return shader
}

function createProgram(gl: WebGLRenderingContext, vertSrc: string, fragSrc: string): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertSrc)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc)
  const program = gl.createProgram()
  if (!program) throw new Error('Unable to create program')
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program)
    if (!log || gl.isContextLost()) throw new ContextLostError()
    throw new Error('Program link error: ' + log)
  }
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  return program
}

const MAX_DPR = 2

export function createRenderer(canvas: HTMLCanvasElement, fragSrc: string): Renderer {
  const glOrNull = canvas.getContext('webgl', {
    preserveDrawingBuffer: true,
    antialias: true,
    premultipliedAlpha: false,
    alpha: false,
  }) as WebGLRenderingContext | null

  if (!glOrNull) throw new Error('WebGL is not supported in this browser')
  // Re-bind to a non-nullable const so nested closures below (resize/render/
  // destroy) see the narrowed type too — TS doesn't propagate control-flow
  // narrowing of an outer `let`/`const` into function bodies defined later.
  const gl: WebGLRenderingContext = glOrNull

  // getContext() returns the SAME context object for a canvas across calls.
  // If a previous instance (e.g. a React StrictMode double-mount) lost it,
  // restore it before we try to build anything on top.
  if (gl.isContextLost()) {
    const ext = gl.getExtension('WEBGL_lose_context')
    if (ext) ext.restoreContext()
    throw new ContextLostError()
  }

  // Give the drawing buffer a real size before compiling/linking so drivers
  // that lazily allocate on first use don't drop the context mid-init.
  {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    const w = Math.max(1, Math.round((canvas.clientWidth || 1) * dpr))
    const h = Math.max(1, Math.round((canvas.clientHeight || 1) * dpr))
    canvas.width = w
    canvas.height = h
    gl.viewport(0, 0, w, h)
  }

  const program = createProgram(gl, VERT_SHADER, fragSrc)

  // Fullscreen triangle
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)

  const aPos = gl.getAttribLocation(program, 'aPos')
  const locCache = new Map<string, WebGLUniformLocation | null>()

  function getLoc(name: string) {
    if (!locCache.has(name)) {
      locCache.set(name, gl.getUniformLocation(program, name))
    }
    return locCache.get(name) ?? null
  }

  // `scale` is an extra multiplier on top of the device pixel ratio, for
  // rendering at a higher resolution than the screen needs — e.g. exporting
  // a sharper video than what's actually displayed on screen.
  function resize(scale = 1) {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR) * scale
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr))
    const height = Math.max(1, Math.round(canvas.clientHeight * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    gl.viewport(0, 0, width, height)
    return { width, height }
  }

  function render(uniforms: Uniforms, scale = 1) {
    const { width, height } = resize(scale)
    gl.useProgram(program)

    // resolution is always available
    const resLoc = getLoc('uResolution')
    if (resLoc) gl.uniform2f(resLoc, width, height)

    for (const name in uniforms) {
      const loc = getLoc(name)
      if (!loc) continue
      const v = uniforms[name]
      if (typeof v === 'number') gl.uniform1f(loc, v)
      else if (v.length === 2) gl.uniform2f(loc, v[0], v[1])
      else if (v.length === 3) gl.uniform3f(loc, v[0], v[1], v[2])
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  function destroy() {
    // Only release the GL objects. Do NOT force-lose the context here:
    // getContext() hands back this same context on remount, and a lost
    // context cannot be revived cleanly, which would break StrictMode
    // double-mounts and engine switches.
    gl.deleteProgram(program)
    gl.deleteBuffer(buffer)
  }

  return { gl, canvas, render, resize, destroy }
}
