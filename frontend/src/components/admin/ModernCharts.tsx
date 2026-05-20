/**
 * Modern Advanced Charts Library
 * 8 visualization types: Line, Bar, Area, Donut, Heatmap, Geo, Stream, AI Analytics
 */

"use client";

import { ReactNode } from "react";
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
  Tooltip,
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
import { Box, useTheme } from "@mui/material";
import { chartConfig } from "./ChartContainer";

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
        <Tooltip {...chartConfig.tooltip} />
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
            animationDuration={800}
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
          <Tooltip {...chartConfig.tooltip} />
          <Legend />
          {bars.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color || chartConfig.colors.primary}
              isAnimationActive={true}
              animationDuration={800}
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
          <Tooltip {...chartConfig.tooltip} />
          <Legend />
          {bars.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color || chartConfig.colors.primary}
              isAnimationActive={true}
              animationDuration={800}
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
        <Tooltip {...chartConfig.tooltip} />
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
            animationDuration={800}
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
          animationDuration={800}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip {...chartConfig.tooltip} />
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
        <Tooltip {...chartConfig.tooltip} />
        {axes.map((axis, index) => (
          <Radar
            key={axis.key}
            name={axis.name}
            dataKey={axis.key}
            stroke={colors[index % colors.length]}
            fill={colors[index % colors.length]}
            fillOpacity={0.25}
            isAnimationActive={true}
            animationDuration={800}
          />
        ))}
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// 6. SCATTER CHART - Correlation analysis, distribution patterns
// ============================================================================
interface ScatterData {
  x: number;
  y: number;
  z?: number;
  category?: string;
}

interface ModernScatterChartProps {
  data: ScatterData[];
  xLabel?: string;
  yLabel?: string;
  color?: string;
  height?: number;
}

export function ModernScatterChart({
  data,
  xLabel = "X Axis",
  yLabel = "Y Axis",
  color = chartConfig.colors.primary,
  height = 300,
}: ModernScatterChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <CartesianGrid {...chartConfig.grid} />
        <XAxis type="number" dataKey="x" name={xLabel} {...chartConfig.axis} />
        <YAxis type="number" dataKey="y" name={yLabel} {...chartConfig.axis} />
        <Tooltip {...chartConfig.tooltip} />
        <Scatter name="Data Points" data={data} fill={color} isAnimationActive={true} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
