package com.sabahub.service;

import com.sabahub.domain.Contract;
import com.sabahub.domain.Dispute;
import com.sabahub.domain.User;
import com.sabahub.repository.ContractRepository;
import com.sabahub.repository.DisputeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final ContractRepository contractRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public DisputeService(DisputeRepository disputeRepository,
                          ContractRepository contractRepository,
                          CurrentUserService currentUserService,
                          AuditService auditService) {
        this.disputeRepository = disputeRepository;
        this.contractRepository = contractRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    public Dispute openDispute(String contractId, String reason, List<String> evidenceAssetIds) {
        User me = currentUserService.requireUser();

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));

        boolean allowed = currentUserService.hasRole(me, "ADMIN")
                || me.getId().equals(contract.getEmployerId())
                || me.getId().equals(contract.getFreelancerId());
        if (!allowed) {
            throw new IllegalStateException("Forbidden");
        }

        contract.setStatus(Contract.Status.DISPUTED);
        contractRepository.save(contract);

        Dispute dispute = new Dispute();
        dispute.setContractId(contractId);
        dispute.setOpenedByUserId(me.getId());
        dispute.setReason(reason);
        dispute.setEvidenceAssetIds(evidenceAssetIds);
        dispute.setStatus(Dispute.Status.OPEN);
        Dispute saved = disputeRepository.save(dispute);
        
        // Audit log: dispute opened
        auditService.log("DISPUTE_OPEN", "DISPUTE", saved.getId(), java.util.Map.of(
            "contract_id", contractId,
            "opened_by", me.getId(),
            "reason", reason
        ));
        
        return saved;
    }

    public List<Dispute> listMyDisputes() {
        User me = currentUserService.requireUser();
        if (currentUserService.hasRole(me, "ADMIN")) {
            return disputeRepository.findAll();
        }
        return disputeRepository.findByOpenedByUserId(me.getId());
    }

    public Dispute adminUpdateDispute(String id, Dispute.Status status, String adminNote) {
        User me = currentUserService.requireUser();
        currentUserService.requireRole(me, "ADMIN");

        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dispute not found"));

        if (status != null) {
            dispute.setStatus(status);
        }
        if (adminNote != null && !adminNote.isBlank()) {
            var notes = dispute.getAdminNotes();
            if (notes == null) {
                notes = new java.util.ArrayList<>();
            }
            notes.add(adminNote);
            dispute.setAdminNotes(notes);
        }
        Dispute updated = disputeRepository.save(dispute);
        
        // Audit log: dispute updated by admin
        auditService.log("DISPUTE_UPDATE", "DISPUTE", updated.getId(), java.util.Map.of(
            "status", status != null ? status.name() : "UNCHANGED",
            "admin_id", me.getId(),
            "admin_note", adminNote != null ? adminNote : ""
        ));
        
        return updated;
    }
}
