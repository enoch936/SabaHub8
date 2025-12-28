package com.sabahub.web;

import com.sabahub.domain.Contract;
import com.sabahub.domain.Proposal;
import com.sabahub.service.ProposalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ProposalController {

    private final ProposalService proposalService;

    public ProposalController(ProposalService proposalService) {
        this.proposalService = proposalService;
    }

    // Freelancer applies
    @PostMapping("/jobs/{jobId}/proposals")
    public ResponseEntity<Proposal> submitProposal(@PathVariable String jobId, @Valid @RequestBody Proposal proposal) {
        return ResponseEntity.ok(proposalService.submitProposal(jobId, proposal));
    }

    // Employer views proposals for job
    @GetMapping("/employer/jobs/{jobId}/proposals")
    public ResponseEntity<List<Proposal>> listJobProposals(@PathVariable String jobId) {
        return ResponseEntity.ok(proposalService.listProposalsForEmployerJob(jobId));
    }

    // Employer accepts proposal
    @PostMapping("/employer/proposals/{proposalId}/accept")
    public ResponseEntity<Contract> acceptProposal(@PathVariable String proposalId) {
        return ResponseEntity.ok(proposalService.acceptProposal(proposalId));
    }
}
