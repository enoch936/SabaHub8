package com.sabahub.controller;

import com.sabahub.domain.*;
import com.sabahub.dto.freelancer.FreelancerDTOs.*;
import com.sabahub.service.FreelancerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/freelancer")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FreelancerController {

    private final FreelancerService freelancerService;

    @PostMapping("/register")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<Freelancer> registerFreelancer(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FreelancerProfileRequest request) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.createFreelancerProfile(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(freelancer);
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<Freelancer> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        return ResponseEntity.ok(freelancer);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Freelancer> getFreelancerById(@PathVariable String id) {
        Freelancer freelancer = freelancerService.getFreelancerById(id);
        return ResponseEntity.ok(freelancer);
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<Freelancer> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FreelancerProfileRequest request) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        Freelancer updated = freelancerService.updateProfile(freelancer.getId(), request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/skills")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<Freelancer> addSkill(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody Freelancer.Skill skill) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        Freelancer updated = freelancerService.addSkill(freelancer.getId(), skill);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/portfolio")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<Freelancer> addPortfolioItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody Freelancer.PortfolioItem item) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        Freelancer updated = freelancerService.addPortfolioItem(freelancer.getId(), item);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/certifications")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<Freelancer> addCertification(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody Freelancer.Certification certification) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        Freelancer updated = freelancerService.addCertification(freelancer.getId(), certification);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/projects/search")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<List<Project>> searchProjects(@ModelAttribute ProjectSearchRequest request) {
        List<Project> projects = freelancerService.searchProjects(request);
        return ResponseEntity.ok(projects);
    }

    @PostMapping("/proposals")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<Proposal> submitProposal(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ProposalRequest request) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        Proposal proposal = freelancerService.submitProposal(freelancer.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(proposal);
    }

    @GetMapping("/proposals")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<List<Proposal>> getMyProposals(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        List<Proposal> proposals = freelancerService.getProposalsByFreelancer(freelancer.getId());
        return ResponseEntity.ok(proposals);
    }

    @PostMapping("/contracts/{contractId}/accept")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<Contract> acceptContract(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String contractId) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        Contract contract = freelancerService.acceptContract(freelancer.getId(), contractId);
        return ResponseEntity.ok(contract);
    }

    @GetMapping("/contracts")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<List<Contract>> getMyContracts(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        List<Contract> contracts = freelancerService.getContractsByFreelancer(freelancer.getId());
        return ResponseEntity.ok(contracts);
    }

    @PostMapping("/time/start")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<TimeEntry> startTimeEntry(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TimeEntryRequest request) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        TimeEntry entry = freelancerService.startTimeEntry(
                freelancer.getId(),
                request.getContractId(),
                request.getTaskName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(entry);
    }

    @PostMapping("/time/{timeEntryId}/stop")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<TimeEntry> stopTimeEntry(
            @PathVariable String timeEntryId,
            @RequestParam(required = false) String description) {
        TimeEntry entry = freelancerService.stopTimeEntry(timeEntryId, description);
        return ResponseEntity.ok(entry);
    }

    @PostMapping("/time/submit")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<List<TimeEntry>> submitTimeEntries(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody List<String> timeEntryIds) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        List<TimeEntry> entries = freelancerService.submitTimeEntries(freelancer.getId(), timeEntryIds);
        return ResponseEntity.ok(entries);
    }

    @GetMapping("/time")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<List<TimeEntry>> getMyTimeEntries(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        List<TimeEntry> entries = freelancerService.getTimeEntriesByFreelancer(freelancer.getId());
        return ResponseEntity.ok(entries);
    }

    @PostMapping("/milestones/submit")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<Contract> submitMilestone(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody MilestoneSubmissionRequest request) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        Contract contract = freelancerService.submitMilestone(
                freelancer.getId(),
                request.getContractId(),
                request.getMilestoneIndex(),
                request.getDescription(),
                request.getAttachments()
        );
        return ResponseEntity.ok(contract);
    }

    @PostMapping("/invoices")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<Invoice> generateInvoice(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody InvoiceRequest request) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        Invoice invoice = freelancerService.generateInvoice(freelancer.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(invoice);
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<List<Invoice>> getMyInvoices(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        List<Invoice> invoices = freelancerService.getInvoicesByFreelancer(freelancer.getId());
        return ResponseEntity.ok(invoices);
    }

    @PostMapping("/withdrawals")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<Withdrawal> requestWithdrawal(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody WithdrawalRequest request) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        Withdrawal withdrawal = freelancerService.requestWithdrawal(freelancer.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(withdrawal);
    }

    @GetMapping("/withdrawals")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<List<Withdrawal>> getMyWithdrawals(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        List<Withdrawal> withdrawals = freelancerService.getWithdrawalsByFreelancer(freelancer.getId());
        return ResponseEntity.ok(withdrawals);
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<FreelancerAnalytics> getAnalytics(@AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        Freelancer freelancer = freelancerService.getFreelancerByUserId(userId);
        FreelancerAnalytics analytics = freelancerService.getAnalytics(freelancer.getId());
        return ResponseEntity.ok(analytics);
    }
}
