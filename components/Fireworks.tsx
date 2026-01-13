'use client';

import { useEffect, useRef } from 'react';

interface FireworksProps {
  active: boolean;
}

export function Fireworks({ active }: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      opacity: number;
      decay: number;
    }> = [];

    const colors = ['#d4af37', '#f5d0a9', '#ffd700', '#ffeb3b', '#ffc107', '#ff9800'];

    const createFirework = (x: number, y: number) => {
      const particleCount = 50;
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 2 + Math.random() * 4;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          radius: 2 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: 1,
          decay: 0.015 + Math.random() * 0.015,
        });
      }
    };

    let animationId: number;
    let fireworkInterval: NodeJS.Timeout;

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.opacity -= p.decay;

        if (p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animationId = requestAnimationFrame(animate);
    };

    const startFireworks = () => {
      fireworkInterval = setInterval(() => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * (canvas.height * 0.5);
        createFirework(x, y);
      }, 400);

      createFirework(canvas.width / 2, canvas.height / 3);
      createFirework(canvas.width / 3, canvas.height / 4);
      createFirework((canvas.width * 2) / 3, canvas.height / 4);
    };

    animate();
    startFireworks();

    const timeout = setTimeout(() => {
      clearInterval(fireworkInterval);
      cancelAnimationFrame(animationId);
    }, 3000);

    return () => {
      clearInterval(fireworkInterval);
      clearTimeout(timeout);
      cancelAnimationFrame(animationId);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
