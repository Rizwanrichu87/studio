'use client';

import { useEffect, useRef } from 'react';

export function BackgroundEffects() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const numPoints = 80;
    const points = Array.from({ length: numPoints }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.random() * 0.4 - 0.2,
      vy: Math.random() * 0.4 - 0.2,
      radius: Math.random() * 2 + 1,
    }));

    let mouse = { x: width / 2, y: height / 2 };
    canvas.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
     canvas.addEventListener('mouseleave', () => {
        mouse.x = width / 2;
        mouse.y = height / 2;
    });


    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Gradient background
      const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, Math.max(width, height) * 0.6);
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.1)'); // Light Blue
      gradient.addColorStop(0.5, 'rgba(192, 132, 252, 0.1)'); // Purple
      gradient.addColorStop(1, 'rgba(13, 22, 40, 0.1)'); // Dark Blue
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      points.forEach((point) => {
        point.x += point.vx;
        point.y += point.vy;

        if (point.x < 0 || point.x > width) point.vx *= -1;
        if (point.y < 0 || point.y > height) point.vy *= -1;

        ctx.beginPath();
        ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 220, 255, 0.6)';
        ctx.fill();
      });

      for (let i = 0; i < numPoints; i++) {
        for (let j = i + 1; j < numPoints; j++) {
          const p1 = points[i];
          const p2 = points[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(200, 220, 255, ${1 - dist / 120})`;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }

    draw();
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10" />;
}
