import { useMemo } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { listMyGigs, listMyProjectPosts } from "../../api/jobs";
import { EmptyState } from "../../components/common/EmptyState";
import { CardSkeleton } from "../../components/skeletons/CardSkeleton";
import { useInfiniteFeed } from "../../hooks/useInfiniteFeed";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useSessionStore } from "../../store/session-store";
import { listPerfConfig, keyExtractor } from "../../utils/perf";

export function HomeFeedScreen() {
  const theme = useAppTheme();
  const roles = useSessionStore((state) => state.roles);
  const isFreelancer = roles.includes("FREELANCER");
  const { jobsQuery, freelancersQuery } = useInfiniteFeed();

  const gigsQuery = useQuery({
    queryKey: ["feed", "my-gigs"],
    queryFn: listMyGigs,
    enabled: isFreelancer,
  });

  const projectPostsQuery = useQuery({
    queryKey: ["feed", "my-project-posts"],
    queryFn: listMyProjectPosts,
    enabled: isFreelancer,
  });

  const jobs = useMemo(() => jobsQuery.data?.pages.flatMap((page) => page.items) ?? [], [jobsQuery.data]);
  const freelancers = useMemo(
    () => freelancersQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [freelancersQuery.data],
  );

  const isRefreshing = jobsQuery.isRefetching || freelancersQuery.isRefetching;
  const loading = jobsQuery.isLoading || freelancersQuery.isLoading;

  const refresh = async () => {
    await Promise.all([jobsQuery.refetch(), freelancersQuery.refetch()]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </View>
    );
  }

  return (
    <FlatList
      {...listPerfConfig}
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
      data={jobs}
      keyExtractor={keyExtractor}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      onEndReached={() => {
        if (jobsQuery.hasNextPage && !jobsQuery.isFetchingNextPage) {
          jobsQuery.fetchNextPage();
        }
      }}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Home Feed</Text>
          <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
            Jobs from `/api/jobs/browse/open` and talent discovery from `/api/freelancer/discover`
          </Text>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Featured Talent</Text>
            {freelancers.slice(0, 6).map((freelancer) => (
              <View key={freelancer.id} style={styles.row}>
                <Text style={[styles.rowName, { color: theme.colors.text }]}>{freelancer.name}</Text>
                <Text style={[styles.rowSub, { color: theme.colors.subtext }]}>
                  {(freelancer.skills ?? []).slice(0, 3).join(", ") || "No skills listed"}
                </Text>
              </View>
            ))}
          </View>

          {isFreelancer ? (
            <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Creator Content</Text>
              <Text style={[styles.rowSub, { color: theme.colors.subtext }]}>
                Gigs: {Array.isArray(gigsQuery.data) ? gigsQuery.data.length : 0}
              </Text>
              <Text style={[styles.rowSub, { color: theme.colors.subtext }]}>
                Project Posts: {Array.isArray(projectPostsQuery.data) ? projectPostsQuery.data.length : 0}
              </Text>
            </View>
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.jobTitle, { color: theme.colors.text }]}>{item.title}</Text>
          <Text style={[styles.rowSub, { color: theme.colors.subtext }]} numberOfLines={3}>
            {item.description}
          </Text>
          <Text style={[styles.rowSub, { color: theme.colors.subtext }]}>
            Budget: {item.currency ?? "USD"} {item.budgetMin ?? "-"} - {item.budgetMax ?? "-"}
          </Text>
        </View>
      )}
      ListEmptyComponent={<EmptyState title="No jobs available right now" subtitle="Pull to refresh and try again." />}
      ListFooterComponent={
        jobsQuery.isFetchingNextPage ? <Text style={[styles.loadingMore, { color: theme.colors.subtext }]}>Loading more...</Text> : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  header: {
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  row: {
    gap: 4,
  },
  rowName: {
    fontSize: 14,
    fontWeight: "600",
  },
  rowSub: {
    fontSize: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  loadingMore: {
    textAlign: "center",
    paddingVertical: 16,
  },
});
