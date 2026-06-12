/**
 * WebGL backdrop tier — ambient shader layers (`aurora`, `silk`) declared via
 * `motion` annotations on schema nodes. Raw WebGL1 on a fullscreen triangle:
 * zero dependencies, loaded as a lazy chunk by `lib/motionRuntime.ts` only
 * when a page actually carries a webgl-tier preset.
 *
 * Rendering contract:
 *  - The canvas mounts in a `z-index: -1` layer inside the host element (the
 *    host gets `isolation: isolate`, so the layer paints above the host's own
 *    background but below all of its content). The effect *tints* the authored
 *    background — if WebGL is unavailable or the context dies, the static
 *    design is fully intact.
 *  - Colors come from the host's computed `--builder-color-*` vars, so the
 *    backdrop themes per site exactly like every other catalog surface.
 *  - The loop pauses when the host leaves the viewport or the tab is hidden;
 *    DPR is capped at 1.5. `prefers-reduced-motion` never reaches this module
 *    (the motion runtime is a no-op there).
 */

export type WebglBackdropTarget = {
  el: HTMLElement
  presetId: string
  /** Intensity scalar (subtle 0.6 / balanced 1 / expressive 1.4). */
  energy: number
}

const MAX_DPR = 1.5

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const SHADER_HELPERS = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform vec3 u_colorC;
uniform float u_energy;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
`

// Three soft radial blobs in brand colors, drifting on slow sine paths.
const AURORA_FRAGMENT = `${SHADER_HELPERS}
float blob(vec2 p, vec2 center, float radius) {
  return smoothstep(radius, 0.0, distance(p, center));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / max(u_res.y, 1.0);
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = u_time * 0.12;

  vec2 c1 = vec2(aspect * (0.28 + 0.16 * sin(t * 0.9)), 0.72 + 0.14 * cos(t * 0.7));
  vec2 c2 = vec2(aspect * (0.74 + 0.14 * cos(t * 0.6 + 2.1)), 0.30 + 0.18 * sin(t * 0.8 + 1.3));
  vec2 c3 = vec2(aspect * (0.52 + 0.20 * sin(t * 0.5 + 4.2)), 0.58 + 0.20 * cos(t * 0.55 + 3.1));

  float b1 = blob(p, c1, 0.55);
  float b2 = blob(p, c2, 0.50);
  float b3 = blob(p, c3, 0.60);

  vec3 col = clamp(u_colorA * b1 + u_colorB * b2 + u_colorC * b3 * 0.7, 0.0, 1.0);
  float a = clamp(b1 * 0.5 + b2 * 0.45 + b3 * 0.3, 0.0, 1.0) * (0.38 * u_energy);
  a += (hash(gl_FragCoord.xy) - 0.5) * 0.012;
  a = clamp(a, 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
}
`

// Layered drifting sine bands — a soft moving sheen between two brand colors.
const SILK_FRAGMENT = `${SHADER_HELPERS}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time * 0.1;

  float w1 = sin(uv.x * 4.0 + t * 1.6 + sin(uv.y * 3.0 + t) * 0.8);
  float w2 = sin(uv.x * 7.0 - t * 1.1 + sin(uv.y * 5.0 - t * 0.7) * 0.6);
  float w3 = sin((uv.x + uv.y) * 5.0 + t * 0.9);
  float sheen = (w1 * 0.5 + w2 * 0.3 + w3 * 0.2) * 0.5 + 0.5;
  sheen = smoothstep(0.25, 0.95, sheen);

  vec3 col = mix(u_colorA, u_colorB, clamp(uv.x + 0.3 * sin(t + uv.y * 2.0), 0.0, 1.0));
  float a = sheen * (0.28 * u_energy);
  a += (hash(gl_FragCoord.xy) - 0.5) * 0.012;
  a = clamp(a, 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
}
`

const FRAGMENTS: Record<string, string> = {
  aurora: AURORA_FRAGMENT,
  silk: SILK_FRAGMENT,
}

type Rgb = [number, number, number]

/** Normalize any CSS color (hex/rgb/named/var-resolved) to 0..1 RGB. */
function parseCssColor(value: string, fallback: Rgb): Rgb {
  const trimmed = value.trim()
  if (!trimmed) return fallback
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return fallback
  ctx.fillStyle = trimmed
  const normalized = ctx.fillStyle
  if (normalized.startsWith('#')) {
    const hex = normalized.slice(1)
    const size = hex.length >= 6 ? 2 : 1
    const channel = (i: number) => {
      const raw = hex.slice(i * size, (i + 1) * size)
      return parseInt(size === 1 ? raw + raw : raw, 16) / 255
    }
    return [channel(0), channel(1), channel(2)]
  }
  const match = normalized.match(/rgba?\(([^)]+)\)/)
  if (match) {
    const [r, g, b] = match[1].split(',').map((part) => Number.parseFloat(part))
    if ([r, g, b].every((n) => Number.isFinite(n))) {
      return [r / 255, g / 255, b / 255]
    }
  }
  return fallback
}

function resolveBrandColors(el: HTMLElement): { a: Rgb; b: Rgb; c: Rgb } {
  const computed = getComputedStyle(el)
  const read = (name: string, fallback: Rgb) =>
    parseCssColor(computed.getPropertyValue(name), fallback)
  return {
    a: read('--builder-color-primary', [0.15, 0.39, 0.92]),
    b: read('--builder-color-accent', [0.96, 0.62, 0.04]),
    c: read('--builder-color-secondary', [0.06, 0.09, 0.16]),
  }
}

function compileProgram(
  gl: WebGLRenderingContext,
  fragmentSource: string
): WebGLProgram | null {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader)
      return null
    }
    return shader
  }

  const vertex = compile(gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource)
  if (!vertex || !fragment) return null

  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }
  return program
}

function mountBackdrop(target: WebglBackdropTarget): (() => void) | null {
  const fragmentSource = FRAGMENTS[target.presetId]
  if (!fragmentSource) return null

  const host = target.el
  const hostComputed = getComputedStyle(host)

  const layer = document.createElement('div')
  layer.className = 'wt-webgl-backdrop'
  layer.setAttribute('aria-hidden', 'true')
  layer.style.cssText =
    'position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none;'
  const radius = hostComputed.borderRadius
  if (radius && radius !== '0px') layer.style.borderRadius = radius

  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'width:100%;height:100%;display:block;'
  layer.appendChild(canvas)

  // The negative z-index layer needs the host to be a positioned stacking
  // context, otherwise it would slip behind the host's own background.
  const previousPosition = host.style.position
  const previousIsolation = host.style.isolation
  if (hostComputed.position === 'static') host.style.position = 'relative'
  host.style.isolation = 'isolate'
  host.insertBefore(layer, host.firstChild)

  const restoreHost = () => {
    layer.remove()
    host.style.position = previousPosition
    host.style.isolation = previousIsolation
  }

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
  })
  if (!gl) {
    restoreHost()
    return null
  }

  const colors = resolveBrandColors(host)

  let program: WebGLProgram | null = null
  let uniforms: Record<string, WebGLUniformLocation | null> = {}

  const setup = (): boolean => {
    program = compileProgram(gl, fragmentSource)
    if (!program) return false
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    )
    const position = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    uniforms = {
      res: gl.getUniformLocation(program, 'u_res'),
      time: gl.getUniformLocation(program, 'u_time'),
      colorA: gl.getUniformLocation(program, 'u_colorA'),
      colorB: gl.getUniformLocation(program, 'u_colorB'),
      colorC: gl.getUniformLocation(program, 'u_colorC'),
      energy: gl.getUniformLocation(program, 'u_energy'),
    }
    gl.uniform3fv(uniforms.colorA, colors.a)
    gl.uniform3fv(uniforms.colorB, colors.b)
    gl.uniform3fv(uniforms.colorC, colors.c)
    gl.uniform1f(uniforms.energy, target.energy)
    return true
  }

  if (!setup()) {
    restoreHost()
    return null
  }

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    const width = Math.max(1, Math.round(host.clientWidth * dpr))
    const height = Math.max(1, Math.round(host.clientHeight * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
    }
  }
  resize()

  // Time accumulates only while actually drawing, so the scene never jumps
  // after a long pause (offscreen section, hidden tab).
  let elapsed = 0
  let lastFrame = 0
  let rafId = 0
  let inView = true
  let contextLost = false
  let killed = false
  const speed = 0.75 + 0.25 * target.energy

  const playing = () => inView && !document.hidden && !contextLost && !killed

  const frame = (now: number) => {
    rafId = 0
    if (!playing()) return
    elapsed += Math.min(now - lastFrame, 100) * 0.001 * speed
    lastFrame = now
    resize()
    gl.uniform2f(uniforms.res, canvas.width, canvas.height)
    gl.uniform1f(uniforms.time, elapsed)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    rafId = requestAnimationFrame(frame)
  }

  const resume = () => {
    if (rafId || !playing()) return
    lastFrame = performance.now()
    rafId = requestAnimationFrame(frame)
  }

  const onVisibility = () => resume()
  document.addEventListener('visibilitychange', onVisibility)

  const observer =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              inView = entry.isIntersecting
            }
            resume()
          },
          { rootMargin: '80px' }
        )
  observer?.observe(host)

  const resizeObserver =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
  resizeObserver?.observe(host)

  const onContextLost = (event: Event) => {
    event.preventDefault()
    contextLost = true
  }
  const onContextRestored = () => {
    contextLost = false
    if (setup()) {
      resize()
      resume()
    }
  }
  canvas.addEventListener('webglcontextlost', onContextLost)
  canvas.addEventListener('webglcontextrestored', onContextRestored)

  resume()

  return () => {
    killed = true
    if (rafId) cancelAnimationFrame(rafId)
    observer?.disconnect()
    resizeObserver?.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
    canvas.removeEventListener('webglcontextlost', onContextLost)
    canvas.removeEventListener('webglcontextrestored', onContextRestored)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    restoreHost()
  }
}

/**
 * Mount shader backdrops for every target. Returns a single kill function.
 * Targets with unknown presets or failed WebGL setup are skipped silently —
 * the authored static background is the designed fallback.
 */
export function mountWebglBackdrops(
  targets: WebglBackdropTarget[]
): () => void {
  const kills: Array<() => void> = []
  for (const target of targets) {
    try {
      const kill = mountBackdrop(target)
      if (kill) kills.push(kill)
    } catch {
      // WebGL setup must never break the page.
    }
  }
  return () => {
    for (const kill of kills) kill()
  }
}
