import { useEffect, useRef } from 'react'

const PARTICLE_CONFIG = {
  neuralCount: 60,
  defaultCount: 40,
  connectionDistance: 150,
  mouseInfluenceRadius: 100,
  repulsionMultiplier: 5,
  baseParticleSize: 1,
  maxRandomParticleSize: 2,
  baseDensity: 1,
  maxRandomDensity: 30,
  velocityCenterOffset: 0.5,
  velocityScale: 0.5,
  particleAlpha: 0.3,
  lineAlpha: 0.1,
  fullCircleRadians: Math.PI * 2,
  canvasOpacity: 0.6,
  lineWidth: 1,
} as const

type ParticleMode = 'neural' | 'ambient'

type InteractiveParticlesProps = Readonly<{
  color?: string
  mode?: ParticleMode
}>

const PARTICLE_COLOR = 'var(--color-primary-500)'

type MousePosition = {
  x: number | null
  y: number | null
}

type ParticleState = {
  baseX: number
  baseY: number
  density: number
  size: number
  vx: number
  vy: number
  x: number
  y: number
}

export default function InteractiveParticles({
  color = PARTICLE_COLOR,
  mode = 'neural',
}: InteractiveParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const parent = canvas.parentElement
    const ctx = canvas.getContext('2d')
    if (!parent || !ctx) return undefined

    let animationFrameId = 0
    let width = 0
    let height = 0

    const syncCanvasSize = () => {
      width = parent.clientWidth
      height = parent.clientHeight
      canvas.width = width
      canvas.height = height
    }

    syncCanvasSize()

    const mouse: MousePosition = { x: null, y: null }
    const particles: ParticleState[] = []
    const particleCount = mode === 'neural' ? PARTICLE_CONFIG.neuralCount : PARTICLE_CONFIG.defaultCount

    const handleResize = () => {
      syncCanvasSize()
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = parent.getBoundingClientRect()
      mouse.x = event.clientX - rect.left
      mouse.y = event.clientY - rect.top
    }

    const handleMouseLeave = () => {
      mouse.x = null
      mouse.y = null
    }

    const createParticle = (): ParticleState => {
      const x = Math.random() * width
      const y = Math.random() * height
      return {
        x,
        y,
        baseX: x,
        baseY: y,
        size: Math.random() * PARTICLE_CONFIG.maxRandomParticleSize + PARTICLE_CONFIG.baseParticleSize,
        density: Math.random() * PARTICLE_CONFIG.maxRandomDensity + PARTICLE_CONFIG.baseDensity,
        vx:
          (Math.random() - PARTICLE_CONFIG.velocityCenterOffset) * PARTICLE_CONFIG.velocityScale,
        vy:
          (Math.random() - PARTICLE_CONFIG.velocityCenterOffset) * PARTICLE_CONFIG.velocityScale,
      }
    }

    const updateParticle = (particle: ParticleState) => {
      particle.x += particle.vx
      particle.y += particle.vy

      if (particle.x > width || particle.x < 0) {
        particle.vx *= -1
      }

      if (particle.y > height || particle.y < 0) {
        particle.vy *= -1
      }

      if (mouse.x === null || mouse.y === null) {
        return
      }

      const deltaX = mouse.x - particle.x
      const deltaY = mouse.y - particle.y
      const distance = Math.hypot(deltaX, deltaY)

      if (distance === 0 || distance >= PARTICLE_CONFIG.mouseInfluenceRadius) {
        return
      }

      const force =
        (PARTICLE_CONFIG.mouseInfluenceRadius - distance) / PARTICLE_CONFIG.mouseInfluenceRadius
      const directionX = deltaX / distance
      const directionY = deltaY / distance

      particle.x -= directionX * force * PARTICLE_CONFIG.repulsionMultiplier
      particle.y -= directionY * force * PARTICLE_CONFIG.repulsionMultiplier
    }

    const drawParticle = (particle: ParticleState) => {
      ctx.save()
      ctx.globalAlpha = PARTICLE_CONFIG.particleAlpha
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, PARTICLE_CONFIG.fullCircleRadians)
      ctx.fill()
      ctx.restore()
    }

    const drawConnections = (sourceParticle: ParticleState, startIndex: number) => {
      for (let connectionIndex = startIndex; connectionIndex < particles.length; connectionIndex += 1) {
        const targetParticle = particles[connectionIndex]
        const deltaX = sourceParticle.x - targetParticle.x
        const deltaY = sourceParticle.y - targetParticle.y
        const distance = Math.hypot(deltaX, deltaY)

        if (distance >= PARTICLE_CONFIG.connectionDistance) {
          continue
        }

        const normalizedAlpha =
          PARTICLE_CONFIG.lineAlpha * (1 - distance / PARTICLE_CONFIG.connectionDistance)
        ctx.save()
        ctx.globalAlpha = normalizedAlpha
        ctx.strokeStyle = color
        ctx.lineWidth = PARTICLE_CONFIG.lineWidth
        ctx.beginPath()
        ctx.moveTo(sourceParticle.x, sourceParticle.y)
        ctx.lineTo(targetParticle.x, targetParticle.y)
        ctx.stroke()
        ctx.restore()
      }
    }

    for (let particleIndex = 0; particleIndex < particleCount; particleIndex += 1) {
      particles.push(createParticle())
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      for (let particleIndex = 0; particleIndex < particles.length; particleIndex += 1) {
        const particle = particles[particleIndex]
        updateParticle(particle)
        drawParticle(particle)

        if (mode === 'neural') {
          drawConnections(particle, particleIndex)
        }
      }

      animationFrameId = globalThis.requestAnimationFrame(animate)
    }

    globalThis.addEventListener('resize', handleResize)
    parent.addEventListener('mousemove', handleMouseMove)
    parent.addEventListener('mouseleave', handleMouseLeave)
    animate()

    return () => {
      globalThis.removeEventListener('resize', handleResize)
      parent.removeEventListener('mousemove', handleMouseMove)
      parent.removeEventListener('mouseleave', handleMouseLeave)
      globalThis.cancelAnimationFrame(animationFrameId)
    }
  }, [color, mode])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: PARTICLE_CONFIG.canvasOpacity,
      }}
    />
  )
}
