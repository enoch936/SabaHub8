/**
 * Modern Advanced Charts Library
 * 8 visualization types: Line, Bar, Area, Donut, Heatmap, Geo, Stream, AI Analytics
 */

"use client";

import { ReactNode, Fragment } from "react";
import {
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
} from "recharts";
import { Box, useTheme, Typography, alpha, Tooltip } from "@mui/material";
import { motion } from "framer-motion";
import { chartConfig } from "./ChartContainer";

// ============================================================================
// 10. GAUGE - Circular resource utilization (CPU, RAM, Disk)
// ============================================================================
interface ModernGaugeProps {
  value: number;
  label: string;
  color?: string;
  size?: number;
  thickness?: number;
}

export function ModernGauge({
  value,
  label,
  color,
  size = 180,
  thickness = 12,
}: ModernGaugeProps) {
  const theme = useTheme();
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const displayColor = color || (value > 85 ? theme.palette.error.main : value > 65 ? theme.palette.warning.main : theme.palette.success.main);

  return (
    <Box sx={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={alpha(theme.palette.divider, 0.1)}
          strokeWidth={thickness}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={displayColor}
          strokeWidth={thickness}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <Box sx={{ position: "absolute", textAlign: "center" }}>
        <Typography variant="h4" fontWeight={900} sx={{ color: displayColor, lineHeight: 1 }}>
          {Math.round(value)}%
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

// ============================================================================
// 11. STREAMING GRAPH - Real-time metrics with live updates
// ============================================================================
interface ModernStreamingGraphProps {
  data: Array<{ timestamp: string; value: number }>;
  color?: string;
  height?: number;
  yDomain?: [number, number];
}

export function ModernStreamingGraph({
  data,
  color,
  height = 120,
  yDomain = [0, 100],
}: ModernStreamingGraphProps) {
  const theme = useTheme();
  const displayColor = color || theme.palette.primary.main;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`streamGradient-${displayColor}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={displayColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={displayColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={displayColor}
          strokeWidth={2}
          fill={`url(#streamGradient-${displayColor})`}
          isAnimationActive={false}
        />
        <YAxis hide domain={yDomain} />
        <XAxis hide dataKey="timestamp" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// 1. LINE CHART - Revenue growth, user activity, traffic, engagement
// ============================================================================
interface LineChartData {
  name: string;
  [key: string]: string | number;
}

interface ModernLineChartProps {
  data: LineChartData[];
  lines: Array<{
    key: string;
    name: string;
    color?: string;
    strokeWidth?: number;
  }>;
  height?: number;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

export function ModernLineChart({
  data,
  lines,
  height = 300,
  margin = { top: 5, right: 30, left: 0, bottom: 5 },
}: ModernLineChartProps) {
  const theme = useTheme();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={margin}>
        <CartesianGrid {...chartConfig.grid} />
        <XAxis {...chartConfig.axis} />
        <YAxis {...chartConfig.axis} />
        <RechartsTooltip {...chartConfig.tooltip} />
        <Legend />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color || chartConfig.colors.primary}
            strokeWidth={line.strokeWidth || 2}
            dot={false}
            isAnimationActive={true}
            animationDuration={1200}
            animationEasing="ease-in-out"
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// 2. BAR CHART - Category comparison, monthly performance, metrics
// ============================================================================
interface BarChartData {
  name: string;
  [key: string]: string | number;
}

interface ModernBarChartProps {
  data: BarChartData[];
  bars: Array<{
    key: string;
    name: string;
    color?: string;
  }>;
  height?: number;
  orientation?: "vertical" | "horizontal";
}

export function ModernBarChart({
  data,
  bars,
  height = 300,
  orientation = "vertical",
}: ModernBarChartProps) {
  const theme = useTheme();
  const margin =
    orientation === "vertical"
      ? { top: 5, right: 30, left: 0, bottom: 5 }
      : { top: 5, right: 30, left: 100, bottom: 5 };

  return (
    <ResponsiveContainer width="100%" height={height}>
      {orientation === "vertical" ? (
        <BarChart data={data} margin={margin}>
          <CartesianGrid {...chartConfig.grid} />
          <XAxis {...chartConfig.axis} />
          <YAxis {...chartConfig.axis} />
          <RechartsTooltip {...chartConfig.tooltip} />
          <Legend />
          {bars.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color || chartConfig.colors.primary}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-in-out"
              radius={[8, 8, 0, 0]}
            />
          ))}
        </BarChart>
      ) : (
        <BarChart
          data={data}
          margin={margin}
          layout="vertical"
        >
          <CartesianGrid {...chartConfig.grid} />
          <XAxis type="number" {...chartConfig.axis} />
          <YAxis dataKey="name" type="category" {...chartConfig.axis} />
          <RechartsTooltip {...chartConfig.tooltip} />
          <Legend />
          {bars.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color || chartConfig.colors.primary}
              isAnimationActive={true}
              animationDuration={1200}
              animationEasing="ease-in-out"
              radius={[0, 8, 8, 0]}
            />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}

// ============================================================================
// 3. AREA CHART - Cumulative analytics, active users over time
// ============================================================================
interface AreaChartData {
  name: string;
  [key: string]: string | number;
}

interface ModernAreaChartProps {
  data: AreaChartData[];
  areas: Array<{
    key: string;
    name: string;
    color?: string;
    fill?: string;
  }>;
  stacked?: boolean;
  height?: number;
}

export function ModernAreaChart({
  data,
  areas,
  stacked = false,
  height = 300,
}: ModernAreaChartProps) {
  const theme = useTheme();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <defs>
          {areas.map((area) => (
            <linearGradient
              key={`gradient-${area.key}`}
              id={`gradient-${area.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={area.color || chartConfig.colors.primary}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={area.color || chartConfig.colors.primary}
                stopOpacity={0}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...chartConfig.grid} />
        <XAxis {...chartConfig.axis} />
        <YAxis {...chartConfig.axis} />
        <RechartsTooltip {...chartConfig.tooltip} />
        <Legend />
        {areas.map((area) => (
          <Area
            key={area.key}
            type="monotone"
            dataKey={area.key}
            name={area.name}
            fill={`url(#gradient-${area.key})`}
            stroke={area.color || chartConfig.colors.primary}
            strokeWidth={2}
            isAnimationActive={true}
            animationDuration={1200}
            animationEasing="ease-in-out"
            stackId={stacked ? "stack" : undefined}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// 4. DONUT/PIE CHART - Subscription types, traffic sources, device usage
// ============================================================================
interface DonutData {
  name: string;
  value: number;
}

interface ModernDonutChartProps {
  data: DonutData[];
  colors?: string[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export function ModernDonutChart({
  data,
  colors = Object.values(chartConfig.colors),
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
}: ModernDonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-in-out"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <RechartsTooltip {...chartConfig.tooltip} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// 5. RADAR CHART - Multi-dimensional metrics, performance indicators
// ============================================================================
interface RadarData {
  name: string;
  [key: string]: string | number;
}

interface ModernRadarChartProps {
  data: RadarData[];
  axes: Array<{ key: string; name: string }>;
  colors?: string[];
  height?: number;
}

export function ModernRadarChart({
  data,
  axes,
  colors = [chartConfig.colors.primary, chartConfig.colors.secondary],
  height = 300,
}: ModernRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data}>
        <PolarGrid stroke={chartConfig.grid.stroke} />
        <PolarAngleAxis dataKey="name" {...chartConfig.axis} />
        <PolarRadiusAxis {...chartConfig.axis} />
        <RechartsTooltip {...chartConfig.tooltip} />
        {axes.map((axis, index) => (
          <Radar
            key={axis.key}
            name={axis.name}
            dataKey={axis.key}
            stroke={colors[index % colors.length]}
            fill={colors[index % colors.length]}
            fillOpacity={0.25}
            isAnimationActive={true}
            animationDuration={1200}
            animationEasing="ease-in-out"
          />
        ))}
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// 7. STREAM CHART - Real-time data flow, stacked volume
// ============================================================================
export function ModernStreamChart({
  data,
  areas,
  height = 300,
}: ModernAreaChartProps) {
  return (
    <ModernAreaChart data={data} areas={areas} stacked height={height} />
  );
}

// ============================================================================
// 8. HEATMAP - Activity intensity, login distribution
// ============================================================================
interface HeatmapData {
  x: string;
  y: string;
  value: number;
}

interface ModernHeatmapProps {
  data: HeatmapData[];
  xLabels: string[];
  yLabels: string[];
  height?: number;
}

export function ModernHeatmap({ data, xLabels, yLabels, height = 300 }: ModernHeatmapProps) {
  const theme = useTheme();
  
  // Normalize data into a matrix
  const matrix: Record<string, Record<string, number>> = {};
  data.forEach(item => {
    if (!matrix[item.y]) matrix[item.y] = {};
    matrix[item.y][item.x] = item.value;
  });

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <Box sx={{ height, width: '100%', overflow: 'hidden', p: 1 }}>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: `auto repeat(${xLabels.length}, 1fr)`,
        gap: 0.5,
        height: '100%'
      }}>
        {/* X-axis labels */}
        <Box /> 
        {xLabels.map(label => (
          <Box key={label} sx={{ fontSize: '10px', textAlign: 'center', opacity: 0.5, fontWeight: 700 }}>
            {label}
          </Box>
        ))}

        {/* Rows */}
        {yLabels.map(y => (
          <Fragment key={`row-${y}`}>
            <Box sx={{ fontSize: '10px', pr: 1, textAlign: 'right', display: 'flex', alignItems: 'center', opacity: 0.5, fontWeight: 700 }}>
              {y}
            </Box>
            {xLabels.map(x => {
              const val = matrix[y]?.[x] || 0;
              const opacity = 0.1 + (val / maxValue) * 0.9;
              return (
                <Tooltip key={`${y}-${x}`} title={`${y} ${x}: ${val}`} arrow>
                  <Box sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, opacity),
                    borderRadius: '4px',
                    aspectRatio: '1/1',
                    cursor: 'pointer',
                    '&:hover': { outline: `2px solid ${theme.palette.primary.main}`, zIndex: 1 }
                  }} />
                </Tooltip>
              );
            })}
          </Fragment>
        ))}
      </Box>
    </Box>
  );
}

// ============================================================================
// 9. GEO VISUALIZATION - Stylized regional performance
// ============================================================================
interface GeoData {
  region: string;
  value: number;
  percentage: number;
  color?: string;
}

export function ModernGeoChart({ data, height = 300 }: { data: GeoData[], height?: number }) {
  const theme = useTheme();
  
  return (
    <Box sx={{ height, width: '100%', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {data.map((item, idx) => (
        <Box key={item.region}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.8 }}>{item.region}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>{item.percentage}%</Typography>
          </Box>
          <Box sx={{ 
            height: 8, 
            width: '100%', 
            bgcolor: alpha(theme.palette.text.primary, 0.05), 
            borderRadius: 4,
            overflow: 'hidden'
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.percentage}%` }}
              transition={{ duration: 1, delay: idx * 0.1 }}
              style={{ 
                height: '100%', 
                backgroundColor: item.color || chartConfig.colors.primary,
                borderRadius: 4
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

