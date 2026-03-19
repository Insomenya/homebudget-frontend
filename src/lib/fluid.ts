import Matter from 'matter-js'

export interface FluidSideStyle {
  fill: string
  stroke: string
}

export interface FluidSimulation {
  destroy: () => void
  setRatio: (r: number) => void
  nudge: (dx: number, dy: number) => void
}

interface ParticleMeta { side: 0 | 1 }
type PBody = Matter.Body & { plugin: ParticleMeta }

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

const COUNT = 150
const R_MIN = 5
const R_MAX = 15
const BLOB_RADIUS_MULT = 1.5
const DENSITY_THRESHOLD = 75

const createWalls = (w: number, h: number) => {
  const o = { isStatic: true, restitution: 0.03, friction: 0, render: { visible: false } }
  return [
    Matter.Bodies.rectangle(w / 2, h + 30, w + 100, 60, o),
    Matter.Bodies.rectangle(w / 2, -30, w + 100, 60, o),
    Matter.Bodies.rectangle(-30, h / 2, 60, h + 100, o),
    Matter.Bodies.rectangle(w + 30, h / 2, 60, h + 100, o),
  ]
}

const spawn = (count: number, side: 0 | 1, w: number, h: number, ratio: number): PBody[] => {
  const boundary = w * ratio
  const xMin = side === 0 ? 16 : boundary + 8
  const xMax = side === 0 ? boundary - 8 : w - 16

  return Array.from({ length: count }, () => {
    const r = R_MIN + Math.random() * (R_MAX - R_MIN)
    const x = xMin + Math.random() * Math.max(24, xMax - xMin)
    const y = h * 0.3 + Math.random() * h * 0.4

    const body = Matter.Bodies.circle(x, y, r, {
      restitution: 0.02,
      friction: 0.005,
      frictionAir: 0.048,
      density: 0.003,
      slop: 0.04,
      render: { visible: false },
    }) as PBody

    body.plugin = { side }
    Matter.Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 0.1,
      y: (Math.random() - 0.5) * 0.06,
    })
    return body
  })
}

const parseColor = (color: string): [number, number, number] => {
  const rgbaMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgbaMatch) {
    return [parseInt(rgbaMatch[1]), parseInt(rgbaMatch[2]), parseInt(rgbaMatch[3])]
  }
  const hex = color.replace('#', '')
  const n = parseInt(hex, 16)
  if (hex.length === 3) {
    return [((n >> 8) & 0xf) * 17, ((n >> 4) & 0xf) * 17, (n & 0xf) * 17]
  }
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const buildMask = (
  bodies: PBody[],
  side: 0 | 1,
  w: number,
  h: number,
): HTMLCanvasElement => {
  const sideBodies = bodies.filter((b) => b.plugin.side === side)

  const off = document.createElement('canvas')
  off.width = w
  off.height = h
  const ctx = off.getContext('2d')!
  ctx.clearRect(0, 0, w, h)

  for (const b of sideBodies) {
    const r = (b.circleRadius ?? 15) * BLOB_RADIUS_MULT
    const grad = ctx.createRadialGradient(
      b.position.x, b.position.y, 0,
      b.position.x, b.position.y, r,
    )
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.42, 'rgba(255,255,255,0.6)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.beginPath()
    ctx.arc(b.position.x, b.position.y, r, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
  }

  const imgData = ctx.getImageData(0, 0, w, h)
  const d = imgData.data
  for (let i = 0; i < d.length; i += 4) {
    const on = d[i] > DENSITY_THRESHOLD
    d[i] = d[i + 1] = d[i + 2] = 255
    d[i + 3] = on ? 255 : 0
  }
  ctx.putImageData(imgData, 0, 0)

  return off
}

const renderSide = (
  ctx: CanvasRenderingContext2D,
  mask: HTMLCanvasElement,
  clipOutMask: HTMLCanvasElement | null,
  w: number,
  h: number,
  style: FluidSideStyle,
) => {
  const work = document.createElement('canvas')
  work.width = w
  work.height = h
  const wctx = work.getContext('2d')!
  wctx.drawImage(mask, 0, 0)

  if (clipOutMask) {
    wctx.globalCompositeOperation = 'destination-out'
    wctx.drawImage(clipOutMask, 0, 0)
    wctx.globalCompositeOperation = 'source-over'
  }

  // fill
  const [fr, fg, fb] = parseColor(style.fill)
  const fillC = document.createElement('canvas')
  fillC.width = w
  fillC.height = h
  const fctx = fillC.getContext('2d')!
  fctx.drawImage(work, 0, 0)
  fctx.globalCompositeOperation = 'source-in'
  fctx.fillStyle = `rgb(${fr},${fg},${fb})`
  fctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.globalAlpha = 0.62
  ctx.drawImage(fillC, 0, 0)
  ctx.restore()

  // border: original − eroded
  const [sr, sg, sb] = parseColor(style.stroke)

  const shrunk = document.createElement('canvas')
  shrunk.width = w
  shrunk.height = h
  const sctx = shrunk.getContext('2d')!
  sctx.filter = 'blur(3.5px)'
  sctx.drawImage(work, 0, 0)
  sctx.filter = 'none'

  const sd = sctx.getImageData(0, 0, w, h)
  const sdd = sd.data
  for (let i = 0; i < sdd.length; i += 4) {
    sdd[i] = sdd[i + 1] = sdd[i + 2] = 255
    sdd[i + 3] = sdd[i + 3] > 220 ? 255 : 0
  }
  sctx.putImageData(sd, 0, 0)

  const edgeC = document.createElement('canvas')
  edgeC.width = w
  edgeC.height = h
  const ectx = edgeC.getContext('2d')!
  ectx.drawImage(work, 0, 0)
  ectx.globalCompositeOperation = 'destination-out'
  ectx.drawImage(shrunk, 0, 0)
  ectx.globalCompositeOperation = 'source-over'

  // thin border — only 4 offsets instead of 9
  const thickEdge = document.createElement('canvas')
  thickEdge.width = w
  thickEdge.height = h
  const tctx = thickEdge.getContext('2d')!
  tctx.drawImage(edgeC, 0, 0)
  tctx.drawImage(edgeC, -1, 0)
  tctx.drawImage(edgeC, 1, 0)
  tctx.drawImage(edgeC, 0, -1)
  tctx.drawImage(edgeC, 0, 1)

  tctx.globalCompositeOperation = 'source-in'
  tctx.fillStyle = `rgb(${sr},${sg},${sb})`
  tctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.globalAlpha = 0.92
  ctx.drawImage(thickEdge, 0, 0)
  ctx.restore()
}

export const createFluidSimulation = (
  canvas: HTMLCanvasElement,
  styles: [FluidSideStyle, FluidSideStyle],
  initialRatio: number,
): FluidSimulation => {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { destroy: () => {}, setRatio: () => {}, nudge: () => {} }
  }

  const w = canvas.width
  const h = canvas.height

  let ratio = initialRatio
  let impulseX = 0
  let impulseY = 0

  const engine = Matter.Engine.create({
    gravity: { x: 0, y: 0.16 },
    positionIterations: 12,
    velocityIterations: 10,
  })

  const runner = Matter.Runner.create()
  const walls = createWalls(w, h)

  const countL = Math.round(COUNT * ratio)
  const countR = COUNT - countL

  const leftBodies = spawn(countL, 0, w, h, ratio)
  const rightBodies = spawn(countR, 1, w, h, ratio)
  const all = [...leftBodies, ...rightBodies]

  Matter.World.add(engine.world, [...walls, ...all])
  Matter.Runner.run(runner, engine)

  let raf = 0

  const tick = () => {
    const boundary = w * ratio
    const leftTX = boundary * 0.52
    const rightTX = boundary + (w - boundary) * 0.48
    const tY = h * 0.74

    for (const b of all) {
      const isLeft = b.plugin.side === 0
      const tx = isLeft ? leftTX : rightTX

      Matter.Body.applyForce(b, b.position, {
        x: (tx - b.position.x) * 0.0000024 + impulseX * 0.0000006,
        y: (tY - b.position.y) * 0.0000018 + impulseY * 0.0000004,
      })

      const dist = b.position.x - boundary
      if (isLeft && dist > 4) {
        Matter.Body.applyForce(b, b.position, { x: -0.000007, y: 0 })
      }
      if (!isLeft && dist < -4) {
        Matter.Body.applyForce(b, b.position, { x: 0.000007, y: 0 })
      }
    }

    impulseX *= 0.9
    impulseY *= 0.9

    const maskA = buildMask(all, 0, w, h)
    const maskB = buildMask(all, 1, w, h)

    ctx.clearRect(0, 0, w, h)
    renderSide(ctx, maskA, maskB, w, h, styles[0])
    renderSide(ctx, maskB, null, w, h, styles[1])

    raf = requestAnimationFrame(tick)
  }

  raf = requestAnimationFrame(tick)

  return {
    destroy: () => {
      cancelAnimationFrame(raf)
      Matter.Runner.stop(runner)
      Matter.World.clear(engine.world, false)
      Matter.Engine.clear(engine)
    },
    setRatio: (r: number) => { ratio = r },
    nudge: (dx: number, dy: number) => {
      impulseX += clamp(dx, -14, 14)
      impulseY += clamp(dy, -10, 10)
    },
  }
}