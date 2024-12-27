
//@ts-nocheck

import React, { useRef, useEffect, useState } from 'react';

const BarChart3D: React.FC<BarChart3DProps> = ({ data, title = "3D Bar Chart", backgroundColor = "#2a2a2a", fontColor = "white" }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredBar, setHoveredBar] = useState<{ index: number; x: number; y: number; value: number } | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 500;

    const maxValue = Math.max(...data.map((d) => d.value));
    const barWidth = 40;
    const chartHeight = 400;
    const xOffset = 150;
    const yOffset = 50;

    const draw3DBar = (x: number, y: number, width: number, height: number, color: string, value: number) => {
      // Front face
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width, height);

      // Right face with a slightly darker shade
      const darkerColor = shadeColor(color, -10);
      ctx.fillStyle = darkerColor;
      ctx.beginPath();
      ctx.moveTo(x + width, y);
      ctx.lineTo(x + width + 10, y - 10);
      ctx.lineTo(x + width + 10, y + height - 10);
      ctx.lineTo(x + width, y + height);
      ctx.closePath();
      ctx.fill();

      // Top face with a slightly lighter shade
      const lighterColor = shadeColor(color, 10);
      ctx.fillStyle = lighterColor;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 10, y - 10);
      ctx.lineTo(x + width + 10, y - 10);
      ctx.lineTo(x + width, y);
      ctx.closePath();
      ctx.fill();

      // Draw value on top of the bar
      ctx.fillStyle = fontColor;
      ctx.textAlign = 'center';
      ctx.font = '16px Arial';
      ctx.fillText(value.toString(), x + width / 2, y - 10);
    };

    const shadeColor = (color: string, percent: number) => {
      const num = parseInt(color.slice(1), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) + amt;
      const G = ((num >> 8) & 0x00FF) + amt;
      const B = (num & 0x0000FF) + amt;
      return `#${(0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 + 
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 + 
        (B < 255 ? (B < 1 ? 0 : B) : 255))
        .toString(16)
        .slice(1)}`;
    };

    const drawYAxisLabels = () => {
      const steps = 5;
      const stepValue = maxValue / steps;
      const stepHeight = chartHeight / steps;

      ctx.fillStyle = fontColor;
      ctx.textAlign = 'right';
      ctx.font = '12px Arial';

      for (let i = 0; i <= steps; i++) {
        const label = Math.round(stepValue * i);
        const y = chartHeight + yOffset - stepHeight * i;
        ctx.fillText(label.toString(), xOffset - 10, y + 5);

        // Draw grid lines
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xOffset, y);
        ctx.lineTo(canvas.width - 50, y);
        ctx.stroke();
      }
    };

    const drawXAxisLabels = () => {
      const barSpacing = (canvas.width - xOffset - 100) / data.length;

      ctx.fillStyle = fontColor;
      ctx.textAlign = 'center';
      ctx.font = '12px Arial';

      data.forEach((d, i) => {
        const x = xOffset + i * barSpacing + barWidth / 2;
        ctx.fillText(d.label, x, chartHeight + yOffset + 30);
      });
    };

    const drawTitle = () => {
      ctx.fillStyle = fontColor;
      ctx.textAlign = 'center';
      ctx.font = '20px Arial';
      ctx.fillText(title, canvas.width / 2, 30);
    };

    const drawTooltip = () => {
      if (hoveredBar && animationComplete) {
        const { x, y, value } = hoveredBar;
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(x - 30, y - 40, 60, 30);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = '12px Arial';
        ctx.fillText(value.toString(), x, y - 20);
      }
    };

    const animateBars = (bars: { x: number; y: number; width: number; targetHeight: number; color: string; value: number }[]) => {
      let progress = 0;
      const animationSpeed = 5;

      const animate = () => {
        progress += animationSpeed;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Redraw chart background
        drawTitle();
        drawYAxisLabels();
        drawXAxisLabels();

        ctx.beginPath();
        ctx.moveTo(xOffset, chartHeight + yOffset);
        ctx.lineTo(canvas.width - 50, chartHeight + yOffset);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw bars progressively
        bars.forEach(({ x, y, width, targetHeight, color, value }) => {
          const height = Math.min(progress, targetHeight);
          draw3DBar(x, y + targetHeight - height, width, height, color, value);
        });

        if (progress >= chartHeight) {
          setAnimationComplete(true);
        }

        if (progress < chartHeight) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    };

    const drawChart = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barSpacing = (canvas.width - xOffset - 100) / data.length;
      const bars = data.map((d, i) => {
        const barHeight = (d.value / maxValue) * chartHeight;
        const x = xOffset + i * barSpacing;
        const y = chartHeight + yOffset - barHeight;

        return { x, y, width: barWidth, targetHeight: barHeight, color: d.color, value: d.value };
      });

      animateBars(bars);
    };

    drawChart();

    const handleMouseMove = (e: MouseEvent) => {
      if (!animationComplete) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const barSpacing = (canvas.width - xOffset - 100) / data.length;

      let foundBar = null;
      data.forEach((d, i) => {
        const barHeight = (d.value / maxValue) * chartHeight;
        const x = xOffset + i * barSpacing;
        const y = chartHeight + yOffset - barHeight;

        if (
          mouseX >= x &&
          mouseX <= x + barWidth &&
          mouseY >= y &&
          mouseY <= chartHeight + yOffset
        ) {
          foundBar = { index: i, x: x + barWidth / 2, y, value: d.value };
        }
      });

      setHoveredBar(foundBar);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseout", () => setHoveredBar(null));

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseout", () => setHoveredBar(null));
    };
  }, [data, title, backgroundColor, fontColor, animationComplete]);

  return <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />;
};

export default BarChart3D;