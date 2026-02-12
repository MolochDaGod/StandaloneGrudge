import React from 'react';

export default function RadarChart({ labels, values, size = 180, color = '#6ee7b7', pointColors }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const levels = 4;

  const angleStep = (2 * Math.PI) / labels.length;
  const startAngle = -Math.PI / 2;

  const getPoint = (index, value) => {
    const angle = startAngle + index * angleStep;
    const r = (value / 100) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const gridLines = [];
  for (let lv = 1; lv <= levels; lv++) {
    const r = (lv / levels) * radius;
    const pts = labels.map((_, i) => {
      const angle = startAngle + i * angleStep;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    });
    gridLines.push(
      <polygon
        key={`grid-${lv}`}
        points={pts.join(' ')}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={1}
      />
    );
  }

  const axisLines = labels.map((_, i) => {
    const angle = startAngle + i * angleStep;
    return (
      <line
        key={`axis-${i}`}
        x1={cx}
        y1={cy}
        x2={cx + radius * Math.cos(angle)}
        y2={cy + radius * Math.sin(angle)}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={1}
      />
    );
  });

  const dataPoints = values.map((v, i) => getPoint(i, v));

  const labelElements = labels.map((label, i) => {
    const angle = startAngle + i * angleStep;
    const labelR = radius + 20;
    const lx = cx + labelR * Math.cos(angle);
    const ly = cy + labelR * Math.sin(angle);
    const anchor = Math.abs(Math.cos(angle)) < 0.01 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
    const labelColor = pointColors?.[i] || '#a5b4d0';
    return (
      <text
        key={`label-${i}`}
        x={lx}
        y={ly}
        textAnchor={anchor}
        dominantBaseline="middle"
        fill={labelColor}
        fontSize="9"
        fontFamily="'Jost', sans-serif"
        fontWeight="600"
      >
        {label}
      </text>
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridLines}
      {axisLines}
      <polygon
        points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill={`${color}25`}
        stroke={color}
        strokeWidth={2}
      />
      {dataPoints.map((p, i) => {
        const dotColor = pointColors?.[i] || color;
        return (
          <circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={dotColor}
            stroke="#fff"
            strokeWidth={1}
          />
        );
      })}
      {labelElements}
    </svg>
  );
}
