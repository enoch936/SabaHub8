package com.sabahub.web;

import com.sabahub.domain.Proposal;
import com.sabahub.repository.ProposalRepository;
import com.sabahub.service.CurrentUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/proposals")
public class AdminProposalController {

    private final ProposalRepository proposalRepository;
    private final CurrentUserService currentUserService;

    public AdminProposalController(ProposalRepository proposalRepository, CurrentUserService currentUserService) {
        this.proposalRepository = proposalRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<List<Proposal>> list(@RequestParam(name = "status", required = false) String status) {
        var me = currentUserService.requireUser();
        currentUserService.requireRole(me, "ADMIN");
        List<Proposal> all = proposalRepository.findAll();
        if (status == null || status.isBlank()) return ResponseEntity.ok(all);
        Proposal.Status st;
        try {
            st = Proposal.Status.valueOf(status);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
        List<Proposal> filtered = all.stream().filter(p -> p.getStatus() == st).collect(Collectors.toList());
        return ResponseEntity.ok(filtered);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Proposal> patch(@PathVariable String id, @RequestBody Map<String, Object> body) {
        var me = currentUserService.requireUser();
        currentUserService.requireRole(me, "ADMIN");
        var proposal = proposalRepository.findById(id).orElseThrow();
        Object statusObj = body.get("status");
        if (statusObj instanceof String s) {
            try {
                proposal.setStatus(Proposal.Status.valueOf(s));
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().build();
            }
        }
        proposalRepository.save(proposal);
        return ResponseEntity.ok(proposal);
    }
}
