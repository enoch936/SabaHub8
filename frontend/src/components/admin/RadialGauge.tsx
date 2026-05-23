"use client";

import { Box, Typography, alpha } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface RadialGaugeProps {
  value: number;
  max?: number;
  label: string;
  unit?: string;
  color: string;
}

export function RadialGauge({ value, max = 100, label, unit, color }: RadialGaugeProps) {
  const data = [
    { value: value },
    { value: max - value },
  ];

  return (
    <Box sx={{ position: 'relative', width: '100%', height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="70%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
          >
            <Cell fill={color} stroke="none" />
            <Cell fill={alpha(color, 0.1)} stroke="none" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <Box sx={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1 }}>
          {value}{unit}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}
