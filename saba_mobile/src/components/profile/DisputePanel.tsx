import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { listContracts } from "../../api/contracts";
import { listDisputes, openDispute } from "../../api/disputes";
import { toApiErrorMessage } from "../../api/client";
import { useAppTheme } from "../../hooks/useAppTheme";
import type { ContractSummary, DisputeSummary } from "../../types/models";
import { formatDateTime } from "../../utils/formatters";

function formatMoney(amount?: number | null, currency?: string | null) {
  if (typeof amount !== "number") {
    return "N/A";
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency || "USD"}`;
  }
}

export function DisputePanel() {
  const theme = useAppTheme();
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [disputes, setDisputes] = useState<DisputeSummary[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [feedback, setFeedback] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const disputableContracts = useMemo(
    () => contracts.filter((contract) => !contract.disputeId),
    [contracts],
  );

  const sortedDisputes = useMemo(
    () =>
      [...disputes].sort((a, b) => {
        const aTime = a.updatedAt || a.createdAt || "";
        const bTime = b.updatedAt || b.createdAt || "";
        return bTime.localeCompare(aTime);
      }),
    [disputes],
  );

  const loadData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [nextContracts, nextDisputes] = await Promise.all([listContracts(), listDisputes()]);
      setContracts(nextContracts);
      setDisputes(nextDisputes);
      if (!selectedContractId && nextContracts[0]?.id) {
        const firstDisputable = nextContracts.find((contract) => !contract.disputeId);
        setSelectedContractId(firstDisputable?.id ?? nextContracts[0].id);
      }
    } catch (error) {
      setFeedback({
        type: "error",
        text: toApiErrorMessage(error, "Unable to load contracts and disputes."),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData().catch(() => undefined);
  }, []);

  const selectedContract = useMemo(
    () => contracts.find((contract) => contract.id === selectedContractId) ?? null,
    [contracts, selectedContractId],
  );

  const submitDisabled = loading || !selectedContractId || !reason.trim();

  useEffect(() => {
    if (!feedback?.text) {
      return;
    }
    AccessibilityInfo.announceForAccessibility(feedback.text);
  }, [feedback]);

  useEffect(() => {
    if (!contracts.length) {
      return;
    }
    const currentStillExists = contracts.some((contract) => contract.id === selectedContractId);
    if (currentStillExists) {
      return;
    }
    const firstDisputable = contracts.find((contract) => !contract.disputeId);
    setSelectedContractId(firstDisputable?.id ?? contracts[0]?.id ?? "");
  }, [contracts, selectedContractId]);

  const submitDispute = async () => {
    if (!selectedContractId) {
      setFeedback({ type: "error", text: "Choose a contract to dispute." });
      return;
    }
    if (!reason.trim()) {
      setFeedback({ type: "error", text: "Enter a dispute reason." });
      return;
    }
    if (reason.trim().length < 5) {
      setFeedback({ type: "error", text: "Please provide a clearer reason (at least 5 characters)." });
      return;
    }
    if (selectedContract?.disputeId) {
      setFeedback({ type: "error", text: "This contract already has a dispute linked." });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const created = await openDispute({
        contractId: selectedContractId,
        reason: reason.trim(),
        details: details.trim() || undefined,
      });
      setDisputes((current) => [created, ...current]);
      setReason("");
      setDetails("");
      setFeedback({ type: "success", text: "Dispute submitted successfully." });
      await loadData();
    } catch (error) {
      setFeedback({
        type: "error",
        text: toApiErrorMessage(error, "Unable to submit dispute."),
      });
      setLoading(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Disputes</Text>
        <Pressable
          style={[styles.refreshButton, { borderColor: theme.colors.border }, loading && styles.buttonDisabled]}
          onPress={() => loadData()}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Refresh disputes"
          accessibilityState={{ disabled: loading, busy: loading }}
        >
          <Text style={[styles.refreshLabel, { color: theme.colors.text }]}>{loading ? "Loading..." : "Refresh"}</Text>
        </Pressable>
      </View>

      <Text style={[styles.helper, { color: theme.colors.subtext }]}>
        Submit a real dispute against one of your contracts. The form below calls the live `/api/disputes` endpoint.
      </Text>

      <View style={styles.block}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Choose Contract</Text>
        <Text style={[styles.helper, { color: theme.colors.subtext }]}>Only contracts without an existing dispute can be submitted.</Text>
        <View style={styles.contractList}>
          {contracts.length === 0 ? (
            <Text style={[styles.helper, { color: theme.colors.subtext }]}>No contracts available yet.</Text>
          ) : (
            contracts.map((contract) => {
              const selected = contract.id === selectedContractId;
              const blocked = Boolean(contract.disputeId);
              return (
                <Pressable
                  key={contract.id}
                  style={[
                    styles.contractCard,
                    {
                      borderColor: blocked
                        ? theme.colors.border
                        : selected
                          ? theme.colors.primary
                          : theme.colors.border,
                      backgroundColor: blocked
                        ? `${theme.colors.border}20`
                        : selected
                          ? `${theme.colors.primary}14`
                          : theme.colors.background,
                    },
                  ]}
                  onPress={() => setSelectedContractId(contract.id)}
                  disabled={blocked}
                  accessibilityRole="button"
                  accessibilityLabel={`Contract ${contract.title || contract.id}`}
                  accessibilityHint={blocked ? "Already has a dispute and cannot be selected." : "Select this contract for dispute submission."}
                  accessibilityState={{ selected, disabled: blocked }}
                >
                  <Text style={[styles.contractTitle, { color: theme.colors.text }]}>{contract.title || "Untitled contract"}</Text>
                  <Text style={[styles.contractMeta, { color: theme.colors.subtext }]}>
                    {contract.status || "UNKNOWN"} · {formatMoney(contract.totalAmount, contract.currency)}
                  </Text>
                  {contract.disputeId ? (
                    <Text style={{ color: theme.colors.danger, fontSize: 12 }}>Dispute already linked: {contract.disputeId}</Text>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </View>
      </View>

      {selectedContract ? (
        <View style={styles.block}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Submit Dispute</Text>
          <Text style={[styles.helper, { color: theme.colors.subtext }]}>
            Selected: {selectedContract.title || selectedContract.id}
          </Text>
          <TextInput
            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Reason"
            placeholderTextColor={theme.colors.subtext}
            value={reason}
            onChangeText={setReason}
            maxLength={120}
            returnKeyType="next"
            accessibilityLabel="Dispute reason"
            accessibilityHint="Provide a short reason for opening the dispute."
          />
          <TextInput
            style={[styles.textarea, { color: theme.colors.text, borderColor: theme.colors.border }]}
            placeholder="Explain the dispute details"
            placeholderTextColor={theme.colors.subtext}
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={4}
            maxLength={1000}
            textAlignVertical="top"
            accessibilityLabel="Dispute details"
            accessibilityHint="Provide clear evidence and timeline details for review."
          />

          <Pressable
            style={[
              styles.primaryButton,
              { backgroundColor: theme.colors.primary },
              submitDisabled && styles.buttonDisabled,
            ]}
            onPress={submitDispute}
            disabled={submitDisabled}
            accessibilityRole="button"
            accessibilityLabel="Submit dispute"
            accessibilityHint="Sends this dispute to the live server for admin review."
            accessibilityState={{ disabled: submitDisabled, busy: loading }}
          >
            <Text style={styles.primaryButtonLabel}>{loading ? "Submitting..." : "Submit Dispute"}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.block}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Disputes</Text>
        {sortedDisputes.length === 0 ? (
          <Text style={[styles.helper, { color: theme.colors.subtext }]}>No disputes filed yet.</Text>
        ) : (
          sortedDisputes.map((dispute) => (
            <View key={dispute.id} style={[styles.disputeCard, { borderColor: theme.colors.border }]}>
              <Text style={[styles.contractTitle, { color: theme.colors.text }]}>{dispute.contractTitle || dispute.contractId}</Text>
              <Text style={[styles.contractMeta, { color: theme.colors.subtext }]}>
                {dispute.status || "OPEN"} · {dispute.reason || "No reason provided"}
              </Text>
              {dispute.details ? (
                <Text style={[styles.helper, { color: theme.colors.subtext }]}>{dispute.details}</Text>
              ) : null}
              <Text style={[styles.contractMeta, { color: theme.colors.subtext }]}>
                Opened {formatDateTime(dispute.createdAt)}
              </Text>
            </View>
          ))
        )}
      </View>

      {feedback ? (
        <Text
          style={[
            styles.feedback,
            { color: feedback.type === "error" ? theme.colors.danger : theme.colors.primary },
          ]}
          accessibilityLiveRegion="polite"
        >
          {feedback.text}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
  },
  refreshButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    justifyContent: "center",
  },
  refreshLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  block: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  helper: {
    fontSize: 12,
    lineHeight: 17,
  },
  contractList: {
    gap: 8,
  },
  contractCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  contractTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  contractMeta: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 96,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: "top",
  },
  primaryButton: {
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  disputeCard: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    gap: 4,
  },
  feedback: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
});
