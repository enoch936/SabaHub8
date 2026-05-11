import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RTCView, type MediaStream } from "react-native-webrtc";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MessageComposer } from "../../components/chat/MessageComposer";
import { StreamVideoPlayer } from "../../components/stream/VideoPlayer";
import { useAppTheme } from "../../hooks/useAppTheme";
import type { ChatStackParamList, StreamsStackParamList } from "../../navigation/types";
import type { PresenceEvent, SignalEnvelope } from "../../types/models";
import {
  callInviteActionLabel,
  describeCallInvite,
  parseCallInviteMessage,
} from "../../services/chat/call-invites";
import { resolvePlaybackUrl } from "../../services/streaming/hls";
import {
  type RemotePeerStream,
  RealtimeCallSession,
} from "../../services/streaming/realtime-call-session";
import { muteStreamViewer, kickStreamViewer } from "../../api/streams";
import { useSessionStore } from "../../store/session-store";
import { useStreamStore } from "../../store/stream-store";
import { formatDateTime, formatViewerCount } from "../../utils/formatters";

type Props =
  | NativeStackScreenProps<StreamsStackParamList, "StreamViewer">
  | NativeStackScreenProps<ChatStackParamList, "CallSession">;

type Participant = {
  userId: string;
  displayName: string;
};

type TileProps = {
  label: string;
  stream: MediaStream | null;
  videoEnabled: boolean;
  muted?: boolean;
};

function MediaTile({ label, muted, stream, videoEnabled }: TileProps) {
  if (stream && videoEnabled) {
    return (
      <View style={styles.tileFrame}>
        <RTCView streamURL={stream.toURL()} style={styles.rtcView} objectFit="cover" />
        <View style={styles.tileBadge}>
          <Text style={styles.tileBadgeLabel}>
            {label}
            {muted ? " (Muted)" : ""}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.tileFrame, styles.tilePlaceholder]}>
      <Text style={styles.tilePlaceholderTitle}>{label}</Text>
      <Text style={styles.tilePlaceholderSubtitle}>{videoEnabled ? "Connecting video..." : "Audio live"}</Text>
    </View>
  );
}

export function StreamViewerScreen({ navigation, route }: Props) {
  const streamId = route.params.streamId;
  const theme = useAppTheme();
  const selfUser = useSessionStore((state) => state.user);
  const selfUserId = selfUser?.id ?? "";

  const loading = useStreamStore((state) => state.loading);
  const stream = useStreamStore((state) => state.activeStream);
  const joinInfo = useStreamStore((state) => state.joinInfo);
  const viewerCount = useStreamStore((state) => state.viewerCount);
  const chatEvents = useStreamStore((state) => state.chatEvents);
  const signals = useStreamStore((state) => state.signals);
  const presenceEvents = useStreamStore((state) => state.presenceEvents);
  const openStream = useStreamStore((state) => state.openStream);
  const closeStream = useStreamStore((state) => state.closeStream);
  const sendStreamChat = useStreamStore((state) => state.sendStreamChat);
  const sendPresenceJoin = useStreamStore((state) => state.sendPresenceJoin);
  const sendPresenceLeave = useStreamStore((state) => state.sendPresenceLeave);
  const sendSignal = useStreamStore((state) => state.sendSignal);

  const invite = useMemo(() => parseCallInviteMessage(route.params.inviteText), [route.params.inviteText]);
  const includeVideo = invite ? invite.mediaKind !== "AUDIO" : stream?.mediaKind !== "AUDIO";
  const interactive = invite ? invite.interactive : stream?.mode === "ONE_TO_ONE";
  const isBroadcaster = Boolean(selfUserId) && stream?.ownerUserId === selfUserId;
  const playbackUrl = resolvePlaybackUrl(stream, joinInfo);

  const sessionRef = useRef<RealtimeCallSession | null>(null);
  const signalIndexRef = useRef(0);
  const presenceIndexRef = useRef(0);
  const presenceJoinedRef = useRef(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemotePeerStream[]>([]);
  const [participantsById, setParticipantsById] = useState<Record<string, Participant>>({});
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(includeVideo);
  const [status, setStatus] = useState<string | null>(null);
  const [sessionVersion, setSessionVersion] = useState(0);

  const participantList = useMemo(
    () =>
      Object.values(participantsById).sort((left, right) =>
        left.displayName.localeCompare(right.displayName, undefined, { sensitivity: "base" }),
      ),
    [participantsById],
  );

  useEffect(() => {
    setParticipantsById(
      selfUserId
        ? {
            [selfUserId]: {
              userId: selfUserId,
              displayName: selfUser?.fullName ?? selfUser?.username ?? selfUser?.email ?? "You",
            },
          }
        : {},
    );
    setMicEnabled(true);
    setCameraEnabled(includeVideo);
    setStatus(null);
    signalIndexRef.current = 0;
    presenceIndexRef.current = 0;
    presenceJoinedRef.current = false;

    let active = true;
    openStream(streamId)
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "Unable to join the live session.";
        setStatus(message);
      });

    return () => {
      active = false;
      if (presenceJoinedRef.current) {
        sendPresenceLeave(streamId);
      }
      const activeSession = sessionRef.current;
      if (activeSession) {
        activeSession.close().catch(() => undefined);
      }
      sessionRef.current = null;
      closeStream().catch(() => undefined);
      setLocalStream(null);
      setRemoteStreams([]);
    };
  }, [closeStream, includeVideo, openStream, selfUser?.email, selfUser?.fullName, selfUser?.username, selfUserId, sendPresenceLeave, streamId]);

  useEffect(() => {
    if (!selfUserId || !joinInfo) {
      return;
    }

    const session = new RealtimeCallSession({
      selfUserId,
      includeVideo: Boolean(includeVideo),
      interactive: Boolean(interactive),
      isBroadcaster,
      iceServers: (joinInfo.turnServers ?? []) as Array<{ urls: string | string[]; username?: string; credential?: string }>,
      onSignal: (payload) => {
        sendSignal(streamId, payload);
      },
      onLocalStream: setLocalStream,
      onRemoteStreamsChanged: setRemoteStreams,
      onControl: (payload, senderUserId) => {
        const controlType = String(payload.controlType ?? "").toUpperCase();
        if (controlType === "REQUEST_OFFER" && (interactive || isBroadcaster)) {
          session.connectToPeer(senderUserId).catch(() => {
            setStatus("Unable to connect a viewer to the live session.");
          });
          return;
        }
        const action = String(payload.action ?? "").toUpperCase();
        if (action === "MUTE_AUDIO") {
          session.setMicrophoneEnabled(false);
          setMicEnabled(false);
          setStatus("Host muted your microphone.");
          return;
        }
        if (action === "MUTE_VIDEO") {
          session.setCameraEnabled(false);
          setCameraEnabled(false);
          setStatus("Host turned off your camera.");
          return;
        }
        if (action === "KICK") {
          Alert.alert("Session ended", "You were removed from this live session.");
          navigation.goBack();
        }
      },
    });

    sessionRef.current = session;
    setSessionVersion((current) => current + 1);
    if (session.shouldPublishLocalMedia()) {
      session.ensureLocalMedia().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unable to access camera or microphone.";
        setStatus(message);
      });
    }
    if (!presenceJoinedRef.current) {
      sendPresenceJoin(streamId);
      presenceJoinedRef.current = true;
    }

    return () => {
      if (sessionRef.current === session) {
        sessionRef.current = null;
      }
      session.close().catch(() => undefined);
    };
  }, [includeVideo, interactive, isBroadcaster, joinInfo, navigation, selfUserId, sendPresenceJoin, sendSignal, streamId]);

  useEffect(() => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }
    const nextSignals = signals.slice(signalIndexRef.current);
    signalIndexRef.current = signals.length;

    nextSignals.forEach((signal: SignalEnvelope) => {
      if (!signal.senderUserId || signal.senderUserId === selfUserId) {
        return;
      }
      setParticipantsById((current) => ({
        ...current,
        [signal.senderUserId]: current[signal.senderUserId] ?? {
          userId: signal.senderUserId,
          displayName: signal.senderUserId,
        },
      }));
      session
        .handleSignal({
          signalType: signal.signalType,
          senderUserId: signal.senderUserId,
          targetPeerId: signal.targetPeerId,
          payload: signal.payload,
        })
        .catch(() => {
          setStatus("Realtime media sync hit an error. Rejoin if media does not recover.");
        });
    });
  }, [selfUserId, sessionVersion, signals]);

  useEffect(() => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }
    const nextPresenceEvents = presenceEvents.slice(presenceIndexRef.current);
    presenceIndexRef.current = presenceEvents.length;

    nextPresenceEvents.forEach((event: PresenceEvent) => {
      if (!event.userId) {
        return;
      }
      if (event.event === "JOINED") {
        setParticipantsById((current) => ({
          ...current,
          [event.userId]: {
            userId: event.userId,
            displayName: event.displayName || current[event.userId]?.displayName || event.userId,
          },
        }));
        if (event.userId !== selfUserId && (interactive || isBroadcaster)) {
          session.connectToPeer(event.userId).catch(() => {
            setStatus("Unable to connect a participant to the live session.");
          });
        }
        return;
      }

      setParticipantsById((current) => {
        const next = { ...current };
        delete next[event.userId];
        return next;
      });
      session.removePeer(event.userId);
    });
  }, [interactive, isBroadcaster, presenceEvents, selfUserId, sessionVersion]);

  const handleToggleMic = () => {
    const next = !micEnabled;
    sessionRef.current?.setMicrophoneEnabled(next);
    setMicEnabled(next);
  };

  const handleToggleCamera = () => {
    const next = !cameraEnabled;
    sessionRef.current?.setCameraEnabled(next);
    setCameraEnabled(next);
  };

  const handleMuteParticipant = async (participant: Participant) => {
    try {
      await muteStreamViewer(streamId, participant.userId, "Muted from mobile live management");
      sessionRef.current?.sendControl(participant.userId, { action: "MUTE_AUDIO" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to mute participant.";
      Alert.alert("Mute failed", message);
    }
  };

  const handleKickParticipant = async (participant: Participant) => {
    try {
      await kickStreamViewer(streamId, participant.userId, "Removed from mobile live management");
      sessionRef.current?.sendControl(participant.userId, { action: "KICK" });
      sessionRef.current?.removePeer(participant.userId);
      setParticipantsById((current) => {
        const next = { ...current };
        delete next[participant.userId];
        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to remove participant.";
      Alert.alert("Remove failed", message);
    }
  };

  const remoteTiles = useMemo(
    () =>
      remoteStreams.map((item) => ({
        key: item.peerId,
        label: participantsById[item.peerId]?.displayName ?? item.peerId,
        stream: item.stream,
      })),
    [participantsById, remoteStreams],
  );
  const canToggleMic = Boolean(localStream);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{invite?.title ?? stream?.title ?? "Live Session"}</Text>
        <Text style={[styles.meta, { color: theme.colors.subtext }]}>
          {stream?.status ?? "LIVE"} · {formatViewerCount(viewerCount)} joined
        </Text>
        {invite ? (
          <Text style={[styles.meta, { color: theme.colors.subtext }]}>
            {describeCallInvite(invite)} · {callInviteActionLabel(invite)}
          </Text>
        ) : null}
        {status ? <Text style={[styles.status, { color: theme.colors.subtext }]}>{status}</Text> : null}
      </View>

      <View style={[styles.mediaPanel, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        {remoteTiles.length > 0 ? (
          <ScrollView contentContainerStyle={styles.remoteGrid}>
            {remoteTiles.map((tile) => (
              <MediaTile
                key={tile.key}
                label={tile.label}
                stream={tile.stream}
                videoEnabled={Boolean(includeVideo)}
              />
            ))}
          </ScrollView>
        ) : playbackUrl ? (
          <StreamVideoPlayer url={playbackUrl} />
        ) : (
          <View style={styles.waitingState}>
            <Text style={[styles.waitingTitle, { color: theme.colors.text }]}>Waiting for participants</Text>
            <Text style={[styles.waitingBody, { color: theme.colors.subtext }]}>
              Realtime media starts as people join this session.
            </Text>
          </View>
        )}

        {localStream ? (
          <View style={[styles.localPreview, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
            <MediaTile
              label="You"
              stream={localStream}
              videoEnabled={Boolean(includeVideo && cameraEnabled)}
              muted={!micEnabled}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.controlsRow}>
        <Pressable
          style={[
            styles.controlButton,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
            !canToggleMic ? styles.controlButtonDisabled : null,
          ]}
          disabled={!canToggleMic}
          onPress={handleToggleMic}
        >
          <Text style={[styles.controlLabel, { color: theme.colors.text }]}>
            {canToggleMic ? (micEnabled ? "Mute Mic" : "Unmute Mic") : "Listen Only"}
          </Text>
        </Pressable>
        {localStream && includeVideo ? (
          <Pressable
            style={[styles.controlButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            onPress={handleToggleCamera}
          >
            <Text style={[styles.controlLabel, { color: theme.colors.text }]}>
              {cameraEnabled ? "Turn Camera Off" : "Turn Camera On"}
            </Text>
          </Pressable>
        ) : null}
        <Pressable style={[styles.leaveButton, { backgroundColor: "#c83349" }]} onPress={() => navigation.goBack()}>
          <Text style={styles.leaveLabel}>Leave</Text>
        </Pressable>
      </View>

      <View style={[styles.participantsPanel, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Participants</Text>
        <ScrollView contentContainerStyle={styles.participantsContent}>
          {participantList.map((participant) => {
            const isSelf = participant.userId === selfUserId;
            return (
              <View key={participant.userId} style={[styles.participantRow, { borderColor: theme.colors.border }]}>
                <View style={styles.participantMeta}>
                  <Text style={[styles.participantName, { color: theme.colors.text }]}>
                    {participant.displayName}
                    {isSelf ? " (You)" : ""}
                  </Text>
                  <Text style={[styles.participantId, { color: theme.colors.subtext }]} numberOfLines={1}>
                    {participant.userId}
                  </Text>
                </View>
                {stream?.permissions.canManage && !isSelf ? (
                  <View style={styles.participantActions}>
                    <Pressable
                      style={[styles.participantButton, { borderColor: theme.colors.border }]}
                      onPress={() => handleMuteParticipant(participant)}
                    >
                      <Text style={[styles.participantButtonLabel, { color: theme.colors.text }]}>Mute</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.participantDangerButton, { backgroundColor: "#c83349" }]}
                      onPress={() => handleKickParticipant(participant)}
                    >
                      <Text style={styles.participantDangerLabel}>Kick</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.chatPanel, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Session Chat</Text>
        <FlatList
          style={styles.chatList}
          data={chatEvents}
          keyExtractor={(_, index) => `${index}`}
          renderItem={({ item }) => (
            <View style={[styles.chatItem, { borderColor: theme.colors.border }]}>
              <Text style={[styles.chatAuthor, { color: theme.colors.text }]}>{item.senderDisplayName ?? "Viewer"}</Text>
              <Text style={[styles.chatBody, { color: theme.colors.subtext }]}>{item.body ?? ""}</Text>
              <Text style={[styles.chatAt, { color: theme.colors.subtext }]}>{formatDateTime(item.occurredAt)}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyChat, { color: theme.colors.subtext }]}>
              {loading ? "Joining session..." : "No messages in this session yet."}
            </Text>
          }
        />
        <MessageComposer
          onSend={(text) => {
            sendStreamChat(streamId, text);
          }}
          onTyping={() => undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
    padding: 12,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  meta: {
    fontSize: 13,
  },
  status: {
    fontSize: 12,
  },
  mediaPanel: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 220,
    overflow: "hidden",
    position: "relative",
  },
  remoteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 12,
  },
  waitingState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
    paddingHorizontal: 24,
  },
  waitingTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  waitingBody: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: "center",
  },
  tileFrame: {
    borderRadius: 14,
    overflow: "hidden",
    width: 160,
    height: 110,
    backgroundColor: "#111111",
  },
  rtcView: {
    flex: 1,
  },
  tileBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    backgroundColor: "rgba(0,0,0,0.56)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tileBadgeLabel: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  tilePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  tilePlaceholderTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  tilePlaceholderSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  localPreview: {
    position: "absolute",
    right: 12,
    bottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 10,
  },
  controlButton: {
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  leaveButton: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leaveLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  participantsPanel: {
    borderRadius: 14,
    borderWidth: 1,
    maxHeight: 160,
    paddingTop: 12,
  },
  participantsContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  participantRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    gap: 8,
  },
  participantMeta: {
    gap: 2,
  },
  participantName: {
    fontSize: 13,
    fontWeight: "600",
  },
  participantId: {
    fontSize: 11,
  },
  participantActions: {
    flexDirection: "row",
    gap: 8,
  },
  participantButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  participantButtonLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  participantDangerButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  participantDangerLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  chatPanel: {
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    overflow: "hidden",
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  chatItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    gap: 2,
  },
  chatAuthor: {
    fontSize: 12,
    fontWeight: "600",
  },
  chatBody: {
    fontSize: 13,
  },
  chatAt: {
    fontSize: 10,
  },
  emptyChat: {
    fontSize: 12,
    paddingVertical: 18,
    textAlign: "center",
  },
});
