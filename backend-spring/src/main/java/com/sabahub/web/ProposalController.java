package com.sabahub.web;

import com.sabahub.domain.Proposal;
import com.sabahub.service.ProposalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ProposalController {

    private final ProposalService proposalService;

    public ProposalController(ProposalService proposalService) {
        this.proposalService = proposalService;
    }

    // Freelancer applies
    @PostMapping("/jobs/{jobId}/proposals")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<?> submitProposal(@PathVariable String jobId, @Valid @RequestBody Proposal proposal) {
        try {
            return ResponseEntity.ok(proposalService.submitProposal(jobId, proposal));
        } catch (IllegalStateException e) {
            String message = e.getMessage() == null ? "Forbidden" : e.getMessage();
            if (message.toLowerCase().contains("only freelancers") || message.toLowerCase().contains("switch to freelancer mode")) {
                return ResponseEntity.status(403).body(Map.of("error", message));
            }
            return ResponseEntity.badRequest().body(Map.of("error", message));
        }
    }

    // Employer views proposals for job
    @GetMapping("/employer/jobs/{jobId}/proposals")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> listJobProposals(@PathVariable String jobId) {
        try {
            return ResponseEntity.ok(proposalService.listProposalViewsForEmployerJob(jobId));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        }
    }

    // Employer accepts proposal
    @PostMapping("/employer/proposals/{proposalId}/accept")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> acceptProposal(@PathVariable String proposalId) {
        try {
            return ResponseEntity.ok(proposalService.acceptProposal(proposalId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() == null ? "Bad request" : e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        }
    }

    // Employer rejects proposal (unaccept before contract)
    @PostMapping("/employer/proposals/{proposalId}/reject")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> rejectProposal(@PathVariable String proposalId) {
        try {
            return ResponseEntity.ok(proposalService.rejectProposal(proposalId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() == null ? "Bad request" : e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        }
    }

    // Employer cancels accepted proposal/contract flow
    @PostMapping("/employer/proposals/{proposalId}/cancel")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> cancelProposal(@PathVariable String proposalId) {
        try {
            return ResponseEntity.ok(proposalService.cancelProposal(proposalId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() == null ? "Bad request" : e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage() == null ? "Forbidden" : e.getMessage()));
        }
    }
}
