import React from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { adminAnalyticsSummary } from "../../api/admin";
import { useAppTheme } from "../../hooks/useAppTheme";

export function AdminScreen() {
  const theme = useAppTheme();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["admin", "analytics-summary"],
    queryFn: adminAnalyticsSummary,
  });

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.error }}>Failed to load admin metrics</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>Admin Command Center</Text>
      <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>Platform-wide operational overview</Text>

      <View style={styles.grid}>
        <MetricCard
          label="Total Users"
          value={data?.users?.toLocaleString() ?? "0"}
          color={theme.colors.primary}
        />
        <MetricCard
          label="Active Jobs"
          value={data?.jobs?.toLocaleString() ?? "0"}
          color="#10B981"
        />
        <MetricCard
          label="MTD Revenue"
          value={`$${((data?.revenue ?? 0) / 1000).toFixed(1)}K`}
          color="#F59E0B"
        />
        <MetricCard
          label="Open Disputes"
          value={data?.disputesOpen?.toString() ?? "0"}
          color={theme.colors.error}
        />
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>System Health</Text>
        <Text style={[styles.row, { color: theme.colors.subtext }]}>API Status: Operational</Text>
        <Text style={[styles.row, { color: theme.colors.subtext }]}>Live Streams: Active</Text>
      </View>
    </ScrollView>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.card, { borderLeftColor: color, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.cardValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.cardLabel, { color: theme.colors.subtext }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    marginTop: -16,
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  section: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  row: {
    fontSize: 14,
  },
});
