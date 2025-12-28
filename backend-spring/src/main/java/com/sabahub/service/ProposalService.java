package com.sabahub.service;

import com.sabahub.domain.Contract;
import com.sabahub.domain.Job;
import com.sabahub.domain.Proposal;
import com.sabahub.domain.User;
import com.sabahub.repository.ContractRepository;
import com.sabahub.repository.JobRepository;
import com.sabahub.repository.ProposalRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProposalService {

    private final ProposalRepository proposalRepository;
    private final JobRepository jobRepository;
    private final ContractRepository contractRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public ProposalService(ProposalRepository proposalRepository,
                           JobRepository jobRepository,
                           ContractRepository contractRepository,
                           CurrentUserService currentUserService,
                           AuditService auditService) {
        this.proposalRepository = proposalRepository;
        this.jobRepository = jobRepository;
        this.contractRepository = contractRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    // Freelancer applies to job
    public Proposal submitProposal(String jobId, Proposal proposal) {
        User me = currentUserService.requireUser();
        currentUserService.requireRole(me, "FREELANCER");

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));

        if (job.getStatus() != Job.Status.OPEN) {
            throw new IllegalStateException("Job is not open");
        }

        if (contractRepository.findByJobId(jobId).isPresent()) {
            throw new IllegalStateException("Job already has a contract");
        }

        if (proposalRepository.findByJobIdAndFreelancerId(jobId, me.getId()).isPresent()) {
            throw new IllegalStateException("You already submitted a proposal for this job");
        }

        proposal.setId(null);
        proposal.setJobId(jobId);
        proposal.setFreelancerId(me.getId());
        proposal.setStatus(Proposal.Status.SUBMITTED);
        return proposalRepository.save(proposal);
    }

    // Employer views proposals for own job
    public List<Proposal> listProposalsForEmployerJob(String jobId) {
        User me = currentUserService.requireUser();
        currentUserService.requireRole(me, "EMPLOYER");

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));

        if (!me.getId().equals(job.getEmployerId())) {
            throw new IllegalStateException("Forbidden");
        }

        return proposalRepository.findByJobId(jobId);
    }

    // Employer accepts proposal → creates contract
    public Contract acceptProposal(String proposalId) {
        User me = currentUserService.requireUser();
        currentUserService.requireRole(me, "EMPLOYER");

        Proposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found"));

        Job job = jobRepository.findById(proposal.getJobId())
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));

        if (!me.getId().equals(job.getEmployerId())) {
            throw new IllegalStateException("Forbidden");
        }

        if (contractRepository.findByJobId(job.getId()).isPresent()) {
            throw new IllegalStateException("Contract already exists for this job");
        }

        proposal.setStatus(Proposal.Status.ACCEPTED);
        proposalRepository.save(proposal);

        Contract contract = new Contract();
        contract.setJobId(job.getId());
        contract.setEmployerId(job.getEmployerId());
        contract.setFreelancerId(proposal.getFreelancerId());
        contract.setStatus(Contract.Status.ACTIVE);
        contract.setCurrency(job.getCurrency() == null ? "ETB" : job.getCurrency());
        contract.setEscrowTotalHeld(0.0);

        job.setStatus(Job.Status.IN_PROGRESS);
        jobRepository.save(job);

        Contract saved = contractRepository.save(contract);
        
        // Audit log: proposal accepted (contract created)
        auditService.log("PROPOSAL_ACCEPT", "PROPOSAL", proposal.getId(), java.util.Map.of(
            "proposal_id", proposal.getId(),
            "contract_id", saved.getId(),
            "freelancer_id", proposal.getFreelancerId(),
            "bid_amount", proposal.getBidAmount()
        ));
        
        return saved;
    }
}
