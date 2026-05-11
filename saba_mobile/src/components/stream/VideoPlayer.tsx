import { StyleSheet, Text, View } from "react-native";
import Video from "react-native-video";
import { useAppTheme } from "../../hooks/useAppTheme";

export function StreamVideoPlayer({ url }: { url?: string | null }) {
  const theme = useAppTheme();

  if (!url) {
    return (
      <View style={[styles.placeholder, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <Text style={{ color: theme.colors.subtext }}>Stream media plane not available yet.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.playerFrame, { borderColor: theme.colors.border }]}>
      <Video
        source={{ uri: url }}
        controls
        resizeMode="contain"
        style={styles.video}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  playerFrame: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  video: {
    flex: 1,
    backgroundColor: "#000000",
  },
  placeholder: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
