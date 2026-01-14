package com.sabahub.service;

import com.sabahub.domain.*;
import com.sabahub.dto.freelancer.FreelancerDTOs.*;
import com.sabahub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FreelancerService {

    private final FreelancerRepository freelancerRepository;
    private final ProjectRepository projectRepository;
    private final ProposalRepository proposalRepository;
    private final ContractRepository contractRepository;
    private final TimeEntryRepository timeEntryRepository;
    private final InvoiceRepository invoiceRepository;
    private final WithdrawalRepository withdrawalRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public Freelancer createFreelancerProfile(String userId, FreelancerProfileRequest request) {
        log.info("Creating freelancer profile for user: {}", userId);
        
        Freelancer freelancer = Freelancer.builder()
                .userId(userId)
                .professionalTitle(request.getProfessionalTitle())
                .bio(request.getBio())
                .hourlyRate(request.getHourlyRate())
                .availability(request.getAvailability())
                .categories(request.getCategories())
                .skills(new ArrayList<>())
                .portfolio(new ArrayList<>())
                .certifications(new ArrayList<>())
                .languages(request.getLanguages())
                .isActive(true)
                .build();

        Freelancer saved = freelancerRepository.save(freelancer);
        auditService.logAction(userId, "FREELANCER_PROFILE_CREATED", saved.getId());
        
        return saved;
    }

    public Freelancer getFreelancerByUserId(String userId) {
        return freelancerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Freelancer profile not found for user: " + userId));
    }

    public Freelancer getFreelancerById(String id) {
        return freelancerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Freelancer not found: " + id));
    }

    public Freelancer updateProfile(String freelancerId, FreelancerProfileRequest request) {
        Freelancer freelancer = getFreelancerById(freelancerId);
        
        freelancer.setProfessionalTitle(request.getProfessionalTitle());
        freelancer.setBio(request.getBio());
        freelancer.setHourlyRate(request.getHourlyRate());
        freelancer.setAvailability(request.getAvailability());
        freelancer.setCategories(request.getCategories());
        freelancer.setLanguages(request.getLanguages());
        
        return freelancerRepository.save(freelancer);
    }

    public Freelancer addSkill(String freelancerId, Freelancer.Skill skill) {
        Freelancer freelancer = getFreelancerById(freelancerId);
        
        if (freelancer.getSkills() == null) {
            freelancer.setSkills(new ArrayList<>());
        }
        
        freelancer.getSkills().add(skill);
        return freelancerRepository.save(freelancer);
    }

    public Freelancer addPortfolioItem(String freelancerId, Freelancer.PortfolioItem item) {
        Freelancer freelancer = getFreelancerById(freelancerId);
        
        if (freelancer.getPortfolio() == null) {
            freelancer.setPortfolio(new ArrayList<>());
        }
        
        freelancer.getPortfolio().add(item);
        return freelancerRepository.save(freelancer);
    }

    public Freelancer addCertification(String freelancerId, Freelancer.Certification certification) {
        Freelancer freelancer = getFreelancerById(freelancerId);
        
        if (freelancer.getCertifications() == null) {
            freelancer.setCertifications(new ArrayList<>());
        }
        
        freelancer.getCertifications().add(certification);
        return freelancerRepository.save(freelancer);
    }

    public List<Project> searchProjects(ProjectSearchRequest request) {
        // Simple implementation - can be enhanced with more complex search logic
        return projectRepository.findAll();
    }

    public Proposal submitProposal(String freelancerId, ProposalRequest request) {
        Freelancer freelancer = getFreelancerById(freelancerId);
        
        Proposal proposal = new Proposal();
        proposal.setFreelancerId(freelancerId);
        proposal.setJobId(request.getProjectId());  // Request uses projectId but we map it to jobId in domain
        proposal.setCoverLetter(request.getCoverLetter());
        proposal.setBidAmount(request.getBidAmount().doubleValue());
        proposal.setTimelineDays(request.getDeliveryTime());
        proposal.setStatus(Proposal.Status.SUBMITTED);
        
        Proposal saved = proposalRepository.save(proposal);
        auditService.logAction(freelancer.getUserId(), "PROPOSAL_SUBMITTED", saved.getId());
        
        return saved;
    }

    public List<Proposal> getProposalsByFreelancer(String freelancerId) {
        return proposalRepository.findByFreelancerId(freelancerId);
    }

    public Contract acceptContract(String freelancerId, String contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));
        
        if (!contract.getFreelancerId().equals(freelancerId)) {
            throw new RuntimeException("Unauthorized: This contract does not belong to you");
        }
        
        contract.setStatus(Contract.Status.ACTIVE);
        contract.setAcceptedAt(LocalDateTime.now());
        
        if (contract.getSignatures() == null) {
            contract.setSignatures(Contract.ContractSignatures.builder().build());
        }
        contract.getSignatures().setFreelancerSigned(true);
        contract.getSignatures().setFreelancerSignedAt(LocalDateTime.now());
        
        return contractRepository.save(contract);
    }

    public List<Contract> getContractsByFreelancer(String freelancerId) {
        return contractRepository.findByFreelancerId(freelancerId);
    }

    public TimeEntry startTimeEntry(String freelancerId, String contractId, String taskName) {
        TimeEntry entry = TimeEntry.builder()
                .freelancerId(freelancerId)
                .contractId(contractId)
                .taskName(taskName)
                .startTime(LocalDateTime.now())
                .status("RUNNING")
                .build();
        
        return timeEntryRepository.save(entry);
    }

    public TimeEntry stopTimeEntry(String timeEntryId, String description) {
        TimeEntry entry = timeEntryRepository.findById(timeEntryId)
                .orElseThrow(() -> new RuntimeException("Time entry not found"));
        
        entry.setEndTime(LocalDateTime.now());
        entry.setDescription(description);
        entry.setStatus("STOPPED");
        
        // Calculate duration in hours
        if (entry.getStartTime() != null && entry.getEndTime() != null) {
            long minutes = java.time.Duration.between(entry.getStartTime(), entry.getEndTime()).toMinutes();
            entry.setHours(java.math.BigDecimal.valueOf(minutes / 60.0));
            entry.setDurationMinutes((int) minutes);
        }
        
        return timeEntryRepository.save(entry);
    }

    public List<TimeEntry> submitTimeEntries(String freelancerId, List<String> timeEntryIds) {
        List<TimeEntry> entries = timeEntryRepository.findAllById(timeEntryIds);
        
        for (TimeEntry entry : entries) {
            if (!entry.getFreelancerId().equals(freelancerId)) {
                throw new RuntimeException("Unauthorized: Time entry does not belong to you");
            }
            entry.setStatus("SUBMITTED");
        }
        
        return timeEntryRepository.saveAll(entries);
    }

    public List<TimeEntry> getTimeEntriesByFreelancer(String freelancerId) {
        return timeEntryRepository.findByFreelancerId(freelancerId);
    }

    public Contract submitMilestone(String freelancerId, String contractId, Integer milestoneIndex, 
                                   String description, List<String> attachments) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));
        
        if (!contract.getFreelancerId().equals(freelancerId)) {
            throw new RuntimeException("Unauthorized: This contract does not belong to you");
        }
        
        if (contract.getPaymentMilestones() != null && 
            milestoneIndex < contract.getPaymentMilestones().size()) {
            Contract.PaymentMilestone milestone = contract.getPaymentMilestones().get(milestoneIndex);
            milestone.setStatus("SUBMITTED");
            milestone.setDeliverables(description);
        }
        
        return contractRepository.save(contract);
    }

    public Invoice generateInvoice(String freelancerId, InvoiceRequest request) {
        Invoice invoice = Invoice.builder()
                .freelancerId(freelancerId)
                .contractId(request.getContractId())
                .title(request.getTitle())
                .description(request.getDescription())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
        
        return invoiceRepository.save(invoice);
    }

    public List<Invoice> getInvoicesByFreelancer(String freelancerId) {
        return invoiceRepository.findByFreelancerId(freelancerId);
    }

    public Withdrawal requestWithdrawal(String freelancerId, WithdrawalRequest request) {
        Withdrawal withdrawal = Withdrawal.builder()
                .freelancerId(freelancerId)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .status("PENDING")
                .requestedAt(LocalDateTime.now())
                .build();
        
        return withdrawalRepository.save(withdrawal);
    }

    public List<Withdrawal> getWithdrawalsByFreelancer(String freelancerId) {
        return withdrawalRepository.findByFreelancerId(freelancerId);
    }

    public FreelancerAnalytics getAnalytics(String freelancerId) {
        Freelancer freelancer = getFreelancerById(freelancerId);
        
        List<Contract> contracts = contractRepository.findByFreelancerId(freelancerId);
        List<Proposal> proposals = proposalRepository.findByFreelancerId(freelancerId);
        
        long completedProjects = contracts.stream()
                .filter(c -> c.getStatus() == Contract.Status.COMPLETED)
                .count();
        
        double totalEarnings = contracts.stream()
                .filter(c -> c.getStatus() == Contract.Status.COMPLETED)
                .mapToDouble(c -> c.getTotalAmount() != null ? c.getTotalAmount() : 0.0)
                .sum();
        
        return FreelancerAnalytics.builder()
                .totalProposals(proposals.size())
                .activeProjects((int) contracts.stream()
                        .filter(c -> c.getStatus() == Contract.Status.ACTIVE)
                        .count())
                .completedProjects((int) completedProjects)
                .totalEarnings(java.math.BigDecimal.valueOf(totalEarnings))
                .rating(freelancer.getRating() != null ? freelancer.getRating() : 0.0)
                .build();
    }
}
