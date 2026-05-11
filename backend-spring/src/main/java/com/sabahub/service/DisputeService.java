package com.sabahub.service;

import com.sabahub.domain.Contract;
import com.sabahub.domain.Dispute;
import com.sabahub.domain.User;
import com.sabahub.repository.ContractRepository;
import com.sabahub.repository.DisputeRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
public class DisputeService {

    private static final List<Dispute.Status> ACTIVE_STATUSES = List.of(
            Dispute.Status.OPEN,
            Dispute.Status.UNDER_REVIEW,
            Dispute.Status.EVIDENCE_REQUIRED,
            Dispute.Status.SETTLEMENT_PENDING
    );

    private final DisputeRepository disputeRepository;
    private final ContractRepository contractRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;
    private final EscrowService escrowService;
    private final NotificationService notificationService;

    public DisputeService(DisputeRepository disputeRepository,
                          ContractRepository contractRepository,
                          CurrentUserService currentUserService,
                          AuditService auditService,
                          EscrowService escrowService,
                          NotificationService notificationService) {
        this.disputeRepository = disputeRepository;
        this.contractRepository = contractRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
        this.escrowService = escrowService;
        this.notificationService = notificationService;
    }

    public Dispute openDispute(String contractId, String reason, String details, List<String> evidenceAssetIds) {
        User me = currentUserService.requireUser();

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        boolean openedByEmployer = me.getId().equals(contract.getEmployerId());
        boolean openedByFreelancer = me.getId().equals(contract.getFreelancerId());
        boolean allowed = hasSupportAdminAccess(me) || openedByEmployer || openedByFreelancer;
        if (!allowed) {
            throw new IllegalStateException("Forbidden");
        }

        if (!disputeRepository.findByContractIdAndStatusIn(contractId, ACTIVE_STATUSES).isEmpty()) {
            throw new IllegalStateException("An active dispute already exists for this contract");
        }

        contract.setStatus(Contract.Status.DISPUTED);

        Dispute dispute = Dispute.builder()
                .contractId(contractId)
                .contractTitle(firstNonBlank(contract.getTitle(), contract.getDescription(), contractId))
                .employerId(contract.getEmployerId())
                .employerName(contract.getEmployerId())
                .freelancerId(contract.getFreelancerId())
                .freelancerName(contract.getFreelancerId())
                .openedByUserId(me.getId())
                .openedByRole(openedByEmployer ? Dispute.OpenedByRole.EMPLOYER : Dispute.OpenedByRole.FREELANCER)
                .status(Dispute.Status.OPEN)
                .reason(reason == null ? "" : reason)
                .details(details)
                .evidenceAssetIds(normalizeStringList(evidenceAssetIds))
                .adminNotes(new ArrayList<>(List.of(buildAuditNote(me, "Dispute opened and escrow frozen for review."))))
                .heldAmount(safe(contract.getEscrowTotalHeld()))
                .paidAmount(safe(contract.getTotalAmount()) - safe(contract.getEscrowTotalHeld()))
                .currency(firstNonBlank(contract.getCurrency(), "USD"))
                .participantControls(Dispute.ParticipantControls.builder().build())
                .build();

        Dispute saved = disputeRepository.save(dispute);
        contract.setDisputeId(saved.getId());
        contractRepository.save(contract);

        notifyDisputeOpened(saved, openedByEmployer);
        auditService.log("DISPUTE_OPEN", "DISPUTE", saved.getId(), Map.of(
                "contract_id", contractId,
                "opened_by", me.getId(),
                "opened_by_role", saved.getOpenedByRole().name(),
                "reason", safeText(reason)
        ));

        return saved;
    }

    public List<Dispute> listMyDisputes() {
        User me = currentUserService.requireUser();
        if (hasSupportAdminAccess(me)) {
            return disputeRepository.findAll().stream()
                    .sorted(Comparator.comparing(Dispute::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();
        }

        return disputeRepository.findAll().stream()
                .filter(dispute ->
                        Objects.equals(dispute.getOpenedByUserId(), me.getId())
                                || Objects.equals(dispute.getEmployerId(), me.getId())
                                || Objects.equals(dispute.getFreelancerId(), me.getId()))
                .sorted(Comparator.comparing(Dispute::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    public Dispute adminUpdateDispute(String id, Dispute.Status status, String adminNote) {
        User me = currentUserService.requireUser();
        requireSupportAdmin(me);

        Dispute dispute = getDisputeOrThrow(id);

        if (status != null) {
            dispute.setStatus(status);
            if (status == Dispute.Status.CLOSED && dispute.getSettlement() == null) {
                dispute.setStatus(Dispute.Status.CLOSED);
            }
        }
        appendAdminNote(dispute, me, adminNote);

        Dispute updated = disputeRepository.save(dispute);
        auditService.log("DISPUTE_UPDATE", "DISPUTE", updated.getId(), Map.of(
                "status", status != null ? status.name() : "UNCHANGED",
                "admin_id", me.getId(),
                "admin_note", adminNote != null ? adminNote : ""
        ));
        return updated;
    }

    public Dispute adminSendMessage(String id, Dispute.MessageTarget target, String content) {
        User me = currentUserService.requireUser();
        requireSupportAdmin(me);

        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Message content is required");
        }

        Dispute dispute = getDisputeOrThrow(id);
        List<Dispute.AdminMessage> messages = dispute.getAdminMessages() == null
                ? new ArrayList<>()
                : new ArrayList<>(dispute.getAdminMessages());

        messages.add(0, Dispute.AdminMessage.builder()
                .id(UUID.randomUUID().toString())
                .target(target == null ? Dispute.MessageTarget.BOTH : target)
                .content(content.trim())
                .sentByUserId(me.getId())
                .sentByName(firstNonBlank(me.getFullName(), me.getEmail(), me.getId()))
                .sentAt(Instant.now())
                .build());
        dispute.setAdminMessages(messages);
        appendAdminNote(dispute, me, "Admin message sent to " + (target == null ? "BOTH" : target.name()) + ".");

        notifyAdminMessage(dispute, target == null ? Dispute.MessageTarget.BOTH : target, content.trim());
        Dispute updated = disputeRepository.save(dispute);
        auditService.log("DISPUTE_MESSAGE", "DISPUTE", updated.getId(), Map.of(
                "target", (target == null ? Dispute.MessageTarget.BOTH : target).name(),
                "admin_id", me.getId()
        ));
        return updated;
    }

    public Dispute adminUpdateParticipantControl(String id,
                                                 String subject,
                                                 Dispute.RestrictionAction action,
                                                 String adminNote) {
        User me = currentUserService.requireUser();
        requireSupportAdmin(me);

        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("subject is required");
        }

        Dispute dispute = getDisputeOrThrow(id);
        Dispute.ParticipantControls controls = dispute.getParticipantControls() == null
                ? Dispute.ParticipantControls.builder().build()
                : dispute.getParticipantControls();

        String normalizedSubject = subject.trim().toUpperCase();
        Dispute.RestrictionAction nextAction = action == null ? Dispute.RestrictionAction.NONE : action;
        if ("EMPLOYER".equals(normalizedSubject)) {
            controls.setEmployerAction(nextAction);
        } else if ("FREELANCER".equals(normalizedSubject)) {
            controls.setFreelancerAction(nextAction);
        } else {
            throw new IllegalArgumentException("subject must be EMPLOYER or FREELANCER");
        }
        controls.setUpdatedAt(Instant.now());
        controls.setUpdatedByUserId(me.getId());
        dispute.setParticipantControls(controls);
        appendAdminNote(dispute, me, firstNonBlank(adminNote, normalizedSubject + " action changed to " + nextAction.name() + "."));

        Dispute updated = disputeRepository.save(dispute);
        auditService.log("DISPUTE_PARTICIPANT_CONTROL", "DISPUTE", updated.getId(), Map.of(
                "subject", normalizedSubject,
                "action", nextAction.name(),
                "admin_id", me.getId()
        ));
        return updated;
    }

    public Dispute adminApplySettlement(String id,
                                        double employerPercent,
                                        double freelancerPercent,
                                        double adminPercent,
                                        String reserveRecipientUserId,
                                        String note) {
        User me = currentUserService.requireUser();
        requireFinanceOrSupportAdmin(me);

        Dispute dispute = getDisputeOrThrow(id);
        Contract contract = contractRepository.findById(dispute.getContractId())
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        double totalPercent = employerPercent + freelancerPercent + adminPercent;
        if (Math.abs(totalPercent - 100.0d) > 0.001d) {
            throw new IllegalArgumentException("Settlement percentages must total 100");
        }

        double held = safe(contract.getEscrowTotalHeld());
        if (held <= 0) {
            throw new IllegalStateException("No held escrow remains for this dispute");
        }

        double employerAmount = roundMoney((held * employerPercent) / 100.0d);
        double freelancerAmount = roundMoney((held * freelancerPercent) / 100.0d);
        double adminAmount = roundMoney(held - employerAmount - freelancerAmount);

        Contract updatedContract = escrowService.settleDisputedEscrow(
                contract.getId(),
                employerAmount,
                freelancerAmount,
                adminAmount,
                reserveRecipientUserId,
                note
        );

        dispute.setStatus(Dispute.Status.RESOLVED);
        dispute.setHeldAmount(0.0);
        dispute.setSettlement(Dispute.Settlement.builder()
                .employerPercent(employerPercent)
                .freelancerPercent(freelancerPercent)
                .adminPercent(adminPercent)
                .employerAmount(employerAmount)
                .freelancerAmount(freelancerAmount)
                .adminAmount(adminAmount)
                .reserveRecipientUserId(reserveRecipientUserId)
                .currency(firstNonBlank(updatedContract.getCurrency(), dispute.getCurrency(), "USD"))
                .note(note)
                .decidedAt(Instant.now())
                .decidedByUserId(me.getId())
                .decidedByName(firstNonBlank(me.getFullName(), me.getEmail(), me.getId()))
                .build());
        appendAdminNote(dispute, me, "Settlement applied. Employer " + employerPercent
                + "%, freelancer " + freelancerPercent + "%, admin reserve " + adminPercent + "%.");

        notifySettlement(dispute);
        Dispute updated = disputeRepository.save(dispute);
        auditService.log("DISPUTE_SETTLEMENT", "DISPUTE", updated.getId(), Map.of(
                "employerPercent", employerPercent,
                "freelancerPercent", freelancerPercent,
                "adminPercent", adminPercent,
                "admin_id", me.getId()
        ));
        return updated;
    }

    private Dispute getDisputeOrThrow(String id) {
        return disputeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dispute not found"));
    }

    private void appendAdminNote(Dispute dispute, User actor, String note) {
        if (note == null || note.isBlank()) {
            return;
        }
        List<String> notes = dispute.getAdminNotes() == null ? new ArrayList<>() : new ArrayList<>(dispute.getAdminNotes());
        notes.add(buildAuditNote(actor, note.trim()));
        dispute.setAdminNotes(notes);
    }

    private String buildAuditNote(User actor, String text) {
        return Instant.now() + " | " + firstNonBlank(actor.getFullName(), actor.getEmail(), actor.getId()) + " | " + text;
    }

    private void notifyDisputeOpened(Dispute dispute, boolean openedByEmployer) {
        String message = "A dispute was opened for contract " + dispute.getContractId() + ".";
        if (openedByEmployer) {
            notificationService.notifyFreelancer(dispute.getFreelancerId(), "Dispute opened", message);
        } else {
            notificationService.notifyEmployer(dispute.getEmployerId(), "Dispute opened", message);
        }
    }

    private void notifyAdminMessage(Dispute dispute, Dispute.MessageTarget target, String content) {
        String subject = "Dispute admin message";
        String message = "Admin sent a dispute update: " + content;
        if (target == Dispute.MessageTarget.BOTH || target == Dispute.MessageTarget.EMPLOYER) {
            notificationService.notifyEmployer(dispute.getEmployerId(), subject, message);
        }
        if (target == Dispute.MessageTarget.BOTH || target == Dispute.MessageTarget.FREELANCER) {
            notificationService.notifyFreelancer(dispute.getFreelancerId(), message);
        }
    }

    private void notifySettlement(Dispute dispute) {
        String note = dispute.getSettlement() == null || dispute.getSettlement().getNote() == null
                ? "Admin applied a dispute settlement."
                : dispute.getSettlement().getNote();
        notificationService.notifyEmployer(dispute.getEmployerId(), "Dispute settled", note);
        notificationService.notifyFreelancer(dispute.getFreelancerId(), "Dispute settled: " + note);
    }

    private List<String> normalizeStringList(List<String> values) {
        if (values == null) {
            return new ArrayList<>();
        }
        return values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private String safeText(String value) {
        return value == null ? "" : value;
    }

    private double safe(Double value) {
        return value == null ? 0.0d : value;
    }

    private double roundMoney(double value) {
        return Math.round(value * 100.0d) / 100.0d;
    }

    private void requireSupportAdmin(User user) {
        if (!hasSupportAdminAccess(user)) {
            throw new IllegalStateException("Forbidden");
        }
    }

    private void requireFinanceOrSupportAdmin(User user) {
        if (!(hasSupportAdminAccess(user)
                || currentUserService.hasRole(user, "FINANCE_ADMIN"))) {
            throw new IllegalStateException("Forbidden");
        }
    }

    private boolean hasSupportAdminAccess(User user) {
        return currentUserService.hasRole(user, "ADMIN")
                || currentUserService.hasRole(user, "SUPER_ADMIN")
                || currentUserService.hasRole(user, "SUPPORT_ADMIN");
    }
}
