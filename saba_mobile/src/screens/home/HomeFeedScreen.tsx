import { useMemo } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, MapPin, Zap, Clock, ChevronRight } from "lucide-react-native";
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
        <TouchableOpacity 
          activeOpacity={0.7}
          style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Briefcase size={20} color="#fff" />
            </View>
            <View style={styles.titleContainer}>
              <Text style={[styles.jobTitle, { color: theme.colors.text }]}>{item.title}</Text>
              <Text style={[styles.employerName, { color: theme.colors.subtext }]}>{item.employerName || "Direct Client"}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'OPEN' ? '#10b981' : theme.colors.primary }]}>
              <Text style={styles.statusText}>{item.status || 'OPEN'}</Text>
            </View>
          </View>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Zap size={14} color="#f59e0b" />
              <Text style={[styles.metaText, { color: theme.colors.text }]}>
                {item.currency || "USD"} {item.budgetMin || 0} - {item.budgetMax || 0}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={14} color={theme.colors.subtext} />
              <Text style={[styles.metaText, { color: theme.colors.subtext }]}>
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'}
              </Text>
            </View>
          </View>

          <Text style={[styles.description, { color: theme.colors.subtext }]} numberOfLines={2}>
            {item.description}
          </Text>

          {item.skills && item.skills.length > 0 && (
            <View style={styles.skillsContainer}>
              {item.skills.slice(0, 3).map((skill, index) => (
                <View key={index} style={[styles.skillBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Text style={[styles.skillText, { color: theme.colors.primary }]}>{skill}</Text>
                </View>
              ))}
              {item.skills.length > 3 && (
                <Text style={[styles.moreSkills, { color: theme.colors.subtext }]}>+{item.skills.length - 3}</Text>
              )}
            </View>
          )}
          
          <View style={[styles.cardFooter, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.applyText, { color: theme.colors.primary }]}>View Details & Apply</Text>
            <ChevronRight size={16} color={theme.colors.primary} />
          </View>
        </TouchableOpacity>
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
    gap: 16,
  },
  header: {
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    gap: 2,
  },
  employerName: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "700",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  skillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  skillText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  moreSkills: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
  },
  applyText: {
    fontSize: 14,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  row: {
    gap: 4,
    paddingVertical: 4,
  },
  rowName: {
    fontSize: 15,
    fontWeight: "700",
  },
  rowSub: {
    fontSize: 13,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  loadingMore: {
    textAlign: "center",
    paddingVertical: 20,
  },
});
