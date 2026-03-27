/**
 * Tiny SVG sparkline — no external dependencies.
 * Renders a smooth area + line chart from an array of numbers.
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  /** stroke color */
  color?: string;
  /** fill area color (defaults to color at 15% opacity) */
  fillColor?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
}

export function Sparkline({
  data,
  color = '#2563eb',
  fillColor,
  width = 80,
  height = 36,
  strokeWidth = 2,
  className,
}: SparklineProps) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return { line: '', area: '' };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = strokeWidth;

    const toX = (i: number) => pad + (i / (data.length - 1)) * (width - pad * 2);
    const toY = (v: number) => pad + (1 - (v - min) / range) * (height - pad * 2);

    // Build smooth SVG path using cubic bezier control points
    const points = data.map((v, i) => ({ x: toX(i), y: toY(v) }));

    let line = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      line += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const last = points[points.length - 1];
    const first = points[0];
    const area = `${line} L ${last.x} ${height} L ${first.x} ${height} Z`;

    return { line, area };
  }, [data, width, height, strokeWidth]);

  const fill = fillColor ?? `${color}22`; // ~13% opacity hex

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('overflow-visible', className)}
      aria-hidden="true"
    >
      {/* Area fill */}
      <path d={path.area} fill={fill} />
      {/* Line */}
      <path
        d={path.line}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/* ─── Demo data sets ─── */
export const SPARKLINE_PRESETS = {
  upward:     [12, 15, 11, 18, 20, 24, 28, 31, 29, 35],
  downward:   [40, 35, 38, 30, 28, 25, 22, 18, 20, 14],
  flat:       [20, 21, 20, 22, 21, 20, 22, 21, 20, 21],
  volatile:   [15, 28, 12, 32, 18, 35, 14, 30, 22, 28],
  growth:     [8, 10, 12, 11, 14, 16, 18, 17, 22, 26],
};
