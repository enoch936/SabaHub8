"use client";

import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Card, Grid, Typography, Stack, Tab, Tabs } from "@mui/material";
import { useState } from "react";

// Mock Data
const userActivityData = [
  { name: "Jan", active: 4000, new: 2400 },
  { name: "Feb", active: 3000, new: 1398 },
  { name: "Mar", active: 2000, new: 9800 },
  { name: "Apr", active: 2780, new: 3908 },
  { name: "May", active: 1890, new: 4800 },
  { name: "Jun", active: 2390, new: 3800 },
  { name: "Jul", active: 3490, new: 4300 },
];

const categoryPerformanceData = [
  { name: "Design", value: 400, color: "#6366F1" },
  { name: "Dev", value: 300, color: "#10B981" },
  { name: "Video", value: 200, color: "#F59E0B" },
  { name: "Audio", value: 278, color: "#EC4899" },
  { name: "AI", value: 189, color: "#8B5CF6" },
];

const trafficSourcesData = [
  { name: "Direct", value: 400 },
  { name: "Social", value: 300 },
  { name: "Referral", value: 300 },
  { name: "Organic", value: 200 },
];

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"];

const ChartWrapper = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        p: 3,
        borderRadius: "24px",
        border: "1px solid",
        borderColor: alpha(theme.palette.divider, 0.1),
        background: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: "blur(12px)",
        height: "100%",
      }}
    >
      <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
        {title}
      </Typography>
      <Box sx={{ height: 300, width: "100%" }}>{children}</Box>
    </Card>
  );
};

// Custom Heatmap Component
const Heatmap = () => {
  const theme = useTheme();
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 24 }, (_, i) => `${i}h`);

  const getData = (day: number, hour: number) => {
    const val = Math.sin(day * 0.5 + hour * 0.2) * 50 + 50;
    return val;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, height: "100%", overflowX: "auto" }}>
      <Box sx={{ display: "flex", gap: 0.5, mb: 1 }}>
        <Box sx={{ width: 40 }} />
        {hours.filter((_, i) => i % 3 === 0).map((h) => (
          <Typography key={h} variant="caption" sx={{ flex: 1, textAlign: "center", color: "text.secondary" }}>
            {h}
          </Typography>
        ))}
      </Box>
      {days.map((day, dIdx) => (
        <Box key={day} sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
          <Typography variant="caption" sx={{ width: 40, color: "text.secondary" }}>
            {day}
          </Typography>
          {Array.from({ length: 24 }).map((_, hIdx) => {
            const val = getData(dIdx, hIdx);
            const intensity = val / 100;
            return (
              <Tooltip key={hIdx} title={`${day} ${hIdx}:00 - ${val.toFixed(0)}% activity`}>
                <Box
                  sx={{
                    flex: 1,
                    height: 20,
                    borderRadius: "4px",
                    bgcolor: alpha("#6366F1", intensity),
                    transition: "transform 0.1s",
                    "&:hover": {
                      transform: "scale(1.2)",
                      zIndex: 1,
                      boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                    },
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};

// Simplified Geo Vis
const GeoVisualization = () => {
  const locations = [
    { name: "North America", value: 45, top: "30%", left: "20%" },
    { name: "Europe", value: 30, top: "25%", left: "50%" },
    { name: "Asia", value: 20, top: "40%", left: "75%" },
    { name: "Africa", value: 15, top: "60%", left: "55%" },
    { name: "South America", value: 10, top: "70%", left: "30%" },
    { name: "Australia", value: 5, top: "75%", left: "85%" },
  ];

  return (
    <Box sx={{ position: "relative", height: "100%", bgcolor: alpha("#000", 0.02), borderRadius: "12px", overflow: "hidden" }}>
      {/* Abstract Map Background */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          backgroundImage: "radial-gradient(#6366F1 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      {locations.map((loc) => (
        <motion.div
          key={loc.name}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200, delay: Math.random() }}
          style={{
            position: "absolute",
            top: loc.top,
            left: loc.left,
            transform: "translate(-50%, -50%)",
          }}
        >
          <Tooltip title={`${loc.name}: ${loc.value}% Traffic`}>
            <Box
              sx={{
                width: loc.value * 2,
                height: loc.value * 2,
                borderRadius: "50%",
                bgcolor: alpha("#6366F1", 0.4),
                border: "2px solid #6366F1",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                "&:hover": {
                  bgcolor: alpha("#6366F1", 0.6),
                },
              }}
            >
              <Typography variant="caption" fontWeight={900} sx={{ color: "#fff", fontSize: Math.max(8, loc.value / 2) }}>
                {loc.value}%
              </Typography>
            </Box>
          </Tooltip>
        </motion.div>
      ))}
    </Box>
  );
};

export const AdvancedChartsSection = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} gutterBottom>
            Advanced Visualizations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Multi-dimensional data analysis and real-time behavioral insights.
          </Typography>
        </Box>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ "& .MuiTabs-indicator": { bgcolor: "#6366F1" } }}>
          <Tab label="Overview" sx={{ fontWeight: 700 }} />
          <Tab label="Real-time" sx={{ fontWeight: 700 }} />
          <Tab label="AI Stats" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Stack>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <ChartWrapper title="User Activity & Growth">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userActivityData}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="active"
                    stroke="#6366F1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorActive)"
                  />
                  <Area type="monotone" dataKey="new" stroke="#10B981" strokeWidth={3} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <ChartWrapper title="Category Distribution">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPerformanceData}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </Grid>

          <Grid item xs={12} md={6}>
            <ChartWrapper title="Activity Intensity (Heatmap)">
              <Heatmap />
            </ChartWrapper>
          </Grid>

          <Grid item xs={12} md={6}>
            <ChartWrapper title="Global Traffic (Geo)">
              <GeoVisualization />
            </ChartWrapper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ChartWrapper title="Live API Traffic & WebSocket Load">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userActivityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="stepAfter" dataKey="active" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                  <Line type="stepAfter" dataKey="new" stroke="#EC4899" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </Grid>
          <Grid item xs={12} md={4}>
             <Card sx={{ p: 3, borderRadius: '24px', bgcolor: alpha('#10B981', 0.05), border: '1px solid', borderColor: alpha('#10B981', 0.2) }}>
                <Typography variant="overline" color="success.main" fontWeight={900}>SYSTEM HEALTH</Typography>
                <Typography variant="h3" fontWeight={900}>99.98%</Typography>
                <Typography variant="body2" color="text.secondary">All systems operational across 12 clusters.</Typography>
             </Card>
          </Grid>
          <Grid item xs={12} md={4}>
             <Card sx={{ p: 3, borderRadius: '24px', bgcolor: alpha('#6366F1', 0.05), border: '1px solid', borderColor: alpha('#6366F1', 0.2) }}>
                <Typography variant="overline" color="primary.main" fontWeight={900}>LATENCY (P99)</Typography>
                <Typography variant="h3" fontWeight={900}>142ms</Typography>
                <Typography variant="body2" color="text.secondary">Global edge response time average.</Typography>
             </Card>
          </Grid>
          <Grid item xs={12} md={4}>
             <Card sx={{ p: 3, borderRadius: '24px', bgcolor: alpha('#F59E0B', 0.05), border: '1px solid', borderColor: alpha('#F59E0B', 0.2) }}>
                <Typography variant="overline" color="warning.main" fontWeight={900}>ACTIVE SOCKETS</Typography>
                <Typography variant="h3" fontWeight={900}>8,421</Typography>
                <Typography variant="body2" color="text.secondary">Concurrent real-time connections.</Typography>
             </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <ChartWrapper title="AI Token Usage & Efficiency">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8B5CF6" radius={[10, 10, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </ChartWrapper>
          </Grid>
          <Grid item xs={12} lg={6}>
            <ChartWrapper title="Model Latency Distribution">
               <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeOpacity={0.1} />
                    <XAxis type="number" dataKey="x" name="stature" unit="ms" />
                    <YAxis type="number" dataKey="y" name="weight" unit="tok" />
                    <ZAxis type="number" dataKey="z" range={[60, 400]} name="score" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="GPT-4" data={[{x: 120, y: 400, z: 200}, {x: 150, y: 300, z: 260}, {x: 180, y: 500, z: 400}]} fill="#8B5CF6" />
                    <Scatter name="Llama-3" data={[{x: 40, y: 1000, z: 100}, {x: 60, y: 800, z: 150}, {x: 80, y: 900, z: 120}]} fill="#10B981" />
                  </ScatterChart>
               </ResponsiveContainer>
            </ChartWrapper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
