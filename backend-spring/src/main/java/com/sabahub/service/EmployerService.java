package com.sabahub.service;

import com.sabahub.domain.*;
import com.sabahub.repository.EmployerRepository;
import com.sabahub.repository.ProjectRepository;
import com.sabahub.repository.ContractRepository;
import com.sabahub.web.dto.EmployerDTOs.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EmployerService {

    private final EmployerRepository employerRepository;
    private final ProjectRepository projectRepository;
    private final ContractRepository contractRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    // ==================== KYC & Account Management ====================

    /**
     * Create employer account with KYC verification
     */
    public Employer createEmployerAccount(String userId, EmployerRegistrationDTO dto) {
        log.info("Creating employer account for user: {}", userId);

        Employer employer = Employer.builder()
                .userId(userId)
                .companyProfile(Employer.CompanyProfile.builder()
                        .companyName(dto.getCompanyName())
                        .companyWebsite(dto.getCompanyWebsite())
                        .industry(dto.getIndustry())
                        .employeeCount(dto.getEmployeeCount())
                        .description(dto.getDescription())
                        .address(dto.getAddress())
                        .city(dto.getCity())
                        .country(dto.getCountry())
                        .taxId(dto.getTaxId())
                        .registrationNumber(dto.getRegistrationNumber())
                        .build())
                .kycVerification(Employer.KYCVerification.builder()
                        .status("PENDING")
                        .documentType(dto.getDocumentType())
                        .build())
                .stats(Employer.EmployerStats.builder()
                        .totalProjectsPosted(0)
                        .activeProjects(0)
                        .completedProjects(0)
                        .totalSpent(0.0)
                        .ratingScore(0.0)
                        .ratingCount(0)
                        .build())
                .verificationStatus(Employer.VerificationStatus.builder()
                        .email(dto.getEmail())
                        .emailVerified(false)
                        .phoneVerified(false)
                        .businessVerified(false)
                        .paymentVerified(false)
                        .build())
                .isActive(true)
                .tier("STARTER")
                .build();

        Employer saved = employerRepository.save(employer);
        auditService.logAction(userId, "EMPLOYER_ACCOUNT_CREATED", employer.getId());
        notificationService.sendKYCInitiationEmail(userId, employer.getId());

        return saved;
    }

    /**
     * Update company profile with KYC documents
     */
    public Employer updateCompanyProfile(String employerId, CompanyProfileDTO dto) {
        Employer employer = employerRepository.findById(employerId)
                .orElseThrow(() -> new RuntimeException("Employer not found"));

        employer.getCompanyProfile().setCompanyName(dto.getCompanyName());
        employer.getCompanyProfile().setCompanyWebsite(dto.getCompanyWebsite());
        employer.getCompanyProfile().setCompanyLogo(dto.getCompanyLogo());
        employer.getCompanyProfile().setIndustry(dto.getIndustry());
        employer.getCompanyProfile().setEmployeeCount(dto.getEmployeeCount());
        employer.getCompanyProfile().setDescription(dto.getDescription());

        Employer updated = employerRepository.save(employer);
        auditService.logAction(employer.getUserId(), "COMPANY_PROFILE_UPDATED", employerId);

        return updated;
    }

    /**
     * Submit KYC verification documents
     */
    public Employer submitKYCVerification(String employerId, String documentUrl) {
        Employer employer = employerRepository.findById(employerId)
                .orElseThrow(() -> new RuntimeException("Employer not found"));

        employer.getKycVerification().setDocumentUrl(documentUrl);
        employer.getKycVerification().setStatus("UNDER_REVIEW");

        Employer updated = employerRepository.save(employer);
        notificationService.sendKYCSubmissionConfirmation(employer.getUserId(), employerId);

        return updated;
    }

    /**
     * Add payment method for employer
     */
    public Employer addPaymentMethod(String employerId, PaymentMethodDTO dto) {
        Employer employer = employerRepository.findById(employerId)
                .orElseThrow(() -> new RuntimeException("Employer not found"));

        Employer.PaymentMethod paymentMethod = Employer.PaymentMethod.builder()
                .type(dto.getType())
                .accountId(dto.getAccountId())
                .currency(dto.getCurrency())
                .isDefault(true)
                .addedAt(LocalDateTime.now())
                .build();

        employer.setPaymentMethod(paymentMethod);
        employer.getVerificationStatus().setPaymentVerified(true);

        Employer updated = employerRepository.save(employer);
        auditService.logAction(employer.getUserId(), "PAYMENT_METHOD_ADDED", employerId);

        return updated;
    }

    // ==================== Project Management ====================

    /**
     * Post a new project with detailed specifications
     */
    public Project postProject(String employerId, ProjectCreationDTO dto) {
        log.info("Creating project for employer: {}", employerId);

        Employer employer = employerRepository.findById(employerId)
                .orElseThrow(() -> new RuntimeException("Employer not found"));

        Project project = Project.builder()
                .employerId(employerId)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .skills(dto.getSkills())
                .attachments(dto.getAttachments())
                .projectType(Project.ProjectType.builder()
                        .type(dto.getProjectType())
                        .scope(dto.getScope())
                        .build())
                .budget(Project.Budget.builder()
                        .minAmount(dto.getBudgetMin())
                        .maxAmount(dto.getBudgetMax())
                        .currency(dto.getCurrency())
                        .paymentType(dto.getPaymentType())
                        .build())
                .duration(dto.getDuration())
                .experienceLevel(dto.getExperienceLevel())
                .status("OPEN")
                .proposalInfo(Project.ProposalInfo.builder()
                        .totalProposals(0)
                        .shortlistedProposals(0)
                        .averageBid(0.0)
                        .build())
                .isPrivate(dto.getIsPrivate())
                .showBudget(dto.getShowBudget())
                .viewCount(0)
                .build();

        if ("FIXED_PRICE".equals(dto.getProjectType()) && dto.getMilestones() != null) {
            project.setMilestones(dto.getMilestones().stream()
                    .map(m -> Project.Milestone.builder()
                            .id(UUID.randomUUID().toString())
                            .title(m.getTitle())
                            .description(m.getDescription())
                            .amount(m.getAmount())
                            .currency(dto.getCurrency())
                            .dueDate(m.getDueDate())
                            .status("PENDING")
                            .deliverables(m.getDeliverables())
                            .build())
                    .collect(Collectors.toList()));
        }

        Project saved = projectRepository.save(project);

        // Update employer stats
        employer.getStats().setTotalProjectsPosted(employer.getStats().getTotalProjectsPosted() + 1);
        employer.getStats().setActiveProjects(employer.getStats().getActiveProjects() + 1);
        employerRepository.save(employer);

        auditService.logAction(employer.getUserId(), "PROJECT_POSTED", saved.getId());
        notificationService.notifyFreelancersOfNewProject(saved);

        return saved;
    }

    /**
     * Get projects with filtering and pagination
     */
    public Page<Project> getEmployerProjects(String employerId, ProjectFilterDTO filter, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        if (filter.getStatus() != null) {
            List<Project> projects = projectRepository.findByEmployerIdAndStatus(employerId, filter.getStatus());
            return new PageImpl<>(projects, pageable, projects.size());
        }

        return projectRepository.findByEmployerId(employerId, pageable);
    }

    /**
     * Update project details
     */
    public Project updateProject(String projectId, ProjectUpdateDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        project.setTitle(dto.getTitle());
        project.setDescription(dto.getDescription());
        project.setSkills(dto.getSkills());

        if (dto.getBudgetMax() != null) {
            project.getBudget().setMaxAmount(dto.getBudgetMax());
        }

        Project updated = projectRepository.save(project);
        auditService.logAction(project.getEmployerId(), "PROJECT_UPDATED", projectId);

        return updated;
    }

    /**
     * Close project to new proposals
     */
    public Project closeProject(String projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        project.setStatus("CLOSED");
        return projectRepository.save(project);
    }

    // ==================== Proposal Management ====================

    /**
     * Review and shortlist proposals
     */
    public void shortlistProposal(String projectId, String proposalId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        project.getProposalInfo().setShortlistedProposals(
                project.getProposalInfo().getShortlistedProposals() + 1);

        projectRepository.save(project);
        auditService.logAction(project.getEmployerId(), "PROPOSAL_SHORTLISTED", proposalId);
    }

    /**
     * Reject proposal with feedback
     */
    public void rejectProposal(String proposalId, String feedback) {
        // Implementation in ProposalService
        log.info("Rejecting proposal: {} with feedback: {}", proposalId, feedback);
    }

    /**
     * Invite specific freelancer to project
     */
    public void inviteFreelancer(String projectId, String freelancerId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getInvitedFreelancers().contains(freelancerId)) {
            project.getInvitedFreelancers().add(freelancerId);
            projectRepository.save(project);
            notificationService.sendInvitationToFreelancer(freelancerId, projectId);
        }
    }

    // ==================== Hiring & Contract Management ====================

    /**
     * Hire freelancer and create contract
     */
    public Contract hireFreelancer(String projectId, String freelancerId, HireDTO dto) {
        log.info("Hiring freelancer {} for project {}", freelancerId, projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Employer employer = employerRepository.findById(project.getEmployerId())
                .orElseThrow(() -> new RuntimeException("Employer not found"));

        // Create contract with payment milestones
        Contract contract = Contract.builder()
                .projectId(projectId)
                .jobId(projectId)  // for backward compatibility
                .employerId(employer.getId())
                .freelancerId(freelancerId)
                .title(project.getTitle())
                .description(project.getDescription())
                .status(Contract.Status.PENDING)
                .workType(project.getProjectType().getType())
                .contractType(dto.getContractType() != null ? dto.getContractType() : "ONE_TIME")
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .totalAmount(dto.getTotalAmount())
                .currency(project.getBudget().getCurrency())
                .terms(Contract.ContractTerms.builder()
                        .scope(project.getDescription())
                        .deliverables(project.getDescription())
                        .revisionsAllowed(3)
                        .paymentSchedule(dto.getPaymentSchedule())
                        .communicationChannel("CHAT_AND_VIDEO")
                        .ipRights(dto.getIpRights())
                        .confidentiality("BOTH_PARTIES")
                        .build())
                .paymentMilestones(createPaymentMilestones(project, dto.getTotalAmount()))
                .deliverables(new ArrayList<>())
                .attachments(project.getAttachments())
                .build();

        Contract saved = contractRepository.save(contract);

        // Update project status
        project.setSelectedFreelancerId(freelancerId);
        project.setStatus("IN_PROGRESS");
        project.setHiredAt(LocalDateTime.now());
        projectRepository.save(project);

        // Audit log
        auditService.logAction(employer.getUserId(), "FREELANCER_HIRED", saved.getId());

        // Send notifications
        notificationService.sendContractToFreelancer(freelancerId, saved.getId());
        notificationService.sendHiringConfirmationToEmployer(employer.getUserId(), saved.getId());

        return saved;
    }

    /**
     * Create payment milestones based on project and amount
     */
    private List<Contract.PaymentMilestone> createPaymentMilestones(Project project, Double totalAmount) {
        List<Contract.PaymentMilestone> milestones = new ArrayList<>();

        if ("FIXED_PRICE".equals(project.getProjectType().getType()) && project.getMilestones() != null) {
            // Use predefined milestones
            int index = 1;
            for (Project.Milestone m : project.getMilestones()) {
                milestones.add(Contract.PaymentMilestone.builder()
                        .id(UUID.randomUUID().toString())
                        .title(m.getTitle())
                        .amount(m.getAmount())
                        .status("PENDING")
                        .dueDate(m.getDueDate())
                        .deliverables(m.getDeliverables())
                        .percentageComplete(0.0)
                        .approvedByEmployer(false)
                        .build());
                index++;
            }
        } else {
            // Create single milestone for hourly or lump sum
            milestones.add(Contract.PaymentMilestone.builder()
                    .id(UUID.randomUUID().toString())
                    .title("Project Completion")
                    .amount(totalAmount)
                    .status("PENDING")
                    .dueDate(LocalDateTime.now().plusDays(30))
                    .deliverables("Complete project as per specifications")
                    .percentageComplete(0.0)
                    .approvedByEmployer(false)
                    .build());
        }

        return milestones;
    }

    /**
     * Release milestone payment after approval
     */
    @Transactional
    public Contract releaseMilestonePayment(String contractId, String milestoneId, String feedback) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));

        Contract.PaymentMilestone milestone = contract.getPaymentMilestones().stream()
                .filter(m -> m.getId().equals(milestoneId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Milestone not found"));

        milestone.setApprovedByEmployer(true);
        milestone.setApprovedAt(LocalDateTime.now());
        milestone.setFeedbackFromEmployer(feedback);
        milestone.setStatus("RELEASED");
        milestone.setReleaseDate(LocalDateTime.now());

        Contract updated = contractRepository.save(contract);

        // Update escrow
        contract.setEscrowTotalHeld(contract.getEscrowTotalHeld() - milestone.getAmount());

        // Trigger payment processing
        notificationService.sendMilestoneReleasedNotification(contract.getFreelancerId(), milestoneId);
        auditService.logAction(contract.getEmployerId(), "MILESTONE_RELEASED", contractId);

        return updated;
    }

    /**
     * Get contract details with all information
     */
    public Contract getContractDetails(String contractId) {
        return contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));
    }

    // ==================== Ratings & Reviews ====================

    /**
     * Leave rating and review for freelancer after project completion
     */
    public Project rateFreelancer(String projectId, RatingDTO dto) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Project.Rating rating = Project.Rating.builder()
                .score(dto.getScore())
                .feedback(dto.getFeedback())
                .tags(dto.getTags())
                .ratedAt(LocalDateTime.now())
                .freelancerId(project.getSelectedFreelancerId())
                .build();

        project.setRating(rating);
        Project updated = projectRepository.save(project);

        // Update freelancer profile rating
        notificationService.sendRatingNotificationToFreelancer(
                project.getSelectedFreelancerId(), dto.getScore(), dto.getFeedback());

        return updated;
    }

    // ==================== Analytics & Dashboard ====================

    /**
     * Get employer dashboard analytics
     */
    public EmployerAnalyticsDTO getEmployerAnalytics(String employerId) {
        Employer employer = employerRepository.findById(employerId)
                .orElseThrow(() -> new RuntimeException("Employer not found"));

        List<Project> projects = projectRepository.findByEmployerId(employerId, PageRequest.of(0, 100)).getContent();
        List<Contract> contracts = contractRepository.findByEmployerId(employerId);

        double totalSpent = contracts.stream()
                .filter(c -> "COMPLETED".equals(c.getStatus().toString()))
                .mapToDouble(Contract::getTotalAmount)
                .sum();

        double averageRating = projects.stream()
                .filter(p -> p.getRating() != null)
                .mapToDouble(p -> p.getRating().getScore())
                .average()
                .orElse(0.0);

        return EmployerAnalyticsDTO.builder()
                .totalProjectsPosted(employer.getStats().getTotalProjectsPosted())
                .activeProjects(employer.getStats().getActiveProjects())
                .completedProjects(employer.getStats().getCompletedProjects())
                .totalSpent(totalSpent)
                .averageRating(averageRating)
                .totalHired(employer.getStats().getTotalHired())
                .repeatHireRate(calculateRepeatHireRate(contracts))
                .topSkillsRequested(extractTopSkills(projects))
                .spendByCategory(calculateSpendByCategory(contracts))
                .activityOverTime(generateActivityTimeline(contracts))
                .build();
    }

    private Double calculateRepeatHireRate(List<Contract> contracts) {
        if (contracts.isEmpty()) return 0.0;
        long repeatHires = contracts.stream()
                .collect(Collectors.groupingBy(Contract::getFreelancerId, Collectors.counting()))
                .values().stream()
                .filter(count -> count > 1)
                .count();
        return (repeatHires / (double) contracts.size()) * 100;
    }

    private List<String> extractTopSkills(List<Project> projects) {
        return projects.stream()
                .flatMap(p -> p.getSkills().stream())
                .collect(Collectors.groupingBy(String::toString, Collectors.counting()))
                .entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    private Map<String, Double> calculateSpendByCategory(List<Contract> contracts) {
        return contracts.stream()
                .collect(Collectors.groupingBy(
                        c -> "General",  // TODO: get actual category from project
                        Collectors.summingDouble(Contract::getTotalAmount)
                ));
    }

    private List<com.sabahub.web.dto.EmployerDTOs.ActivityDataPointDTO> generateActivityTimeline(List<Contract> contracts) {
        // TODO: Implement timeline generation
        return new ArrayList<>();
    }

    @lombok.Data
    @lombok.Builder
    public static class ActivityDataPoint {
        private LocalDateTime date;
        private Integer count;
        private Double amount;
    }
}
