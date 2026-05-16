import React, { useRef, useEffect } from 'react';

export default function InteractiveParticles({ mode = 'neural', color = '16, 185, 129' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const parent = canvas.parentElement;
    let width = (canvas.width = parent.clientWidth);
    let height = (canvas.height = parent.clientHeight);

    const handleResize = () => {
      width = (canvas.width = parent.clientWidth);
      height = (canvas.height = parent.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    const mouse = { x: null, y: null };
    const handleMouseMove = (e) => {
      const rect = parent.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };
    parent.addEventListener('mousemove', handleMouseMove);
    parent.addEventListener('mouseleave', handleMouseLeave);

    const particles = [];
    const particleCount = mode === 'neural' ? 60 : 40;
    const connectionDist = 150;

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 1;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = Math.random() * 30 + 1;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x > width || this.x < 0) this.vx *= -1;
        if (this.y > height || this.y < 0) this.vy *= -1;

        if (mouse.x !== null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 100) {
            let force = (100 - distance) / 100;
            let dirX = dx / distance;
            let dirY = dy / distance;
            this.x -= dirX * force * 5;
            this.y -= dirY * force * 5;
          }
        }
      }

      draw() {
        ctx.fillStyle = `rgba(${color}, 0.3)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        if (mode === 'neural') {
          for (let j = i; j < particles.length; j++) {
            let dx = particles[i].x - particles[j].x;
            let dy = particles[i].y - particles[j].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < connectionDist) {
              ctx.strokeStyle = `rgba(${color}, ${0.1 * (1 - distance / connectionDist)})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      parent.removeEventListener('mousemove', handleMouseMove);
      parent.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode, color]);

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
        opacity: 0.6
      }}
    />
  );
}
