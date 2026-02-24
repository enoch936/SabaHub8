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

    private static final String REVIEW_SEED_PREFIX = "seeded.review.";
    private static final List<String> REVIEW_SEED_TITLES = List.of(
            "Senior Product Designer",
            "Lead Full-Stack Engineer",
            "Growth Marketing Strategist",
            "Cloud Solutions Architect",
            "Data Analytics Consultant",
            "Enterprise QA Specialist"
    );
    private static final List<String> REVIEW_SEED_QUOTES = List.of(
            "Delivered enterprise-level quality with excellent communication and fast turnaround.",
            "Handled complex requirements professionally and shipped production-ready work.",
            "Strong ownership from kickoff to final delivery with reliable execution.",
            "Excellent collaboration across stakeholders, timelines, and compliance constraints.",
            "Consistent quality output with practical recommendations that improved project outcomes.",
            "Brought clarity, speed, and technical depth to a high-priority initiative."
    );
    private static final List<String> REVIEW_SEED_AVATARS = List.of(
            "/images/icons/placeholders/avatar-1.png",
            "/images/icons/placeholders/avatar-2.png",
            "/images/icons/placeholders/avatar-3.png"
    );

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

    @Transactional(readOnly = true)
    public List<FeaturedFreelancerReview> getFeaturedReviews(int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 12);
        try {
            return freelancerRepository.findByMinimumRating(4.0).stream()
                    .filter(freelancer -> Boolean.TRUE.equals(freelancer.getIsActive()))
                    .filter(freelancer -> freelancer.getRating() != null)
                    .filter(freelancer -> freelancer.getReviewCount() != null && freelancer.getReviewCount() > 0)
                    .sorted(
                            Comparator.comparing(Freelancer::getRating, Comparator.reverseOrder())
                                    .thenComparing(Freelancer::getReviewCount, Comparator.reverseOrder())
                                    .thenComparing(freelancer -> freelancer.getUpdatedAt() != null ? freelancer.getUpdatedAt() : LocalDateTime.MIN,
                                            Comparator.reverseOrder())
                    )
                    .map(this::toFeaturedReview)
                    .limit(safeLimit)
                    .toList();
        } catch (Exception exception) {
            log.error("Failed to load featured freelancer reviews", exception);
            return List.of();
        }
    }

    @Transactional
    public ReviewSeedResult seedFeaturedReviewFreelancers(int count, boolean clear) {
        int safeCount = Math.min(Math.max(count, 3), 24);
        LocalDateTime now = LocalDateTime.now();

        List<Freelancer> allFreelancers = freelancerRepository.findAll();
        List<Freelancer> seededFreelancers = allFreelancers.stream()
                .filter(freelancer -> freelancer.getUserId() != null && freelancer.getUserId().startsWith(REVIEW_SEED_PREFIX))
                .toList();

        int clearedCount = 0;
        if (clear && !seededFreelancers.isEmpty()) {
            freelancerRepository.deleteAll(seededFreelancers);
            clearedCount = seededFreelancers.size();
        }

        Map<String, Freelancer> byUserId = freelancerRepository.findAll().stream()
                .filter(freelancer -> freelancer.getUserId() != null && !freelancer.getUserId().isBlank())
                .collect(Collectors.toMap(Freelancer::getUserId, freelancer -> freelancer, (left, right) -> left));

        List<Freelancer> toSave = new ArrayList<>();
        for (int index = 0; index < safeCount; index++) {
            String userId = REVIEW_SEED_PREFIX + (index + 1) + "@sabahub.local";
            int templateIndex = index % REVIEW_SEED_TITLES.size();

            Freelancer freelancer = byUserId.get(userId);
            if (freelancer == null) {
                freelancer = new Freelancer();
                freelancer.setUserId(userId);
                freelancer.setCreatedAt(now.minusDays(Math.max(1L, safeCount - index)));
            }

            double rating = Math.min(5.0, 4.5 + ((index % 5) * 0.1));
            int reviewCount = 16 + (index * 9);
            int completedProjects = 9 + (index * 2);

            freelancer.setProfessionalTitle(REVIEW_SEED_TITLES.get(templateIndex));
            freelancer.setBio("Seeded freelancer profile for reliable landing page review content.");
            freelancer.setIsActive(true);
            freelancer.setVerificationStatus("VERIFIED");
            freelancer.setEmailVerified(Boolean.TRUE);
            freelancer.setRating(rating);
            freelancer.setReviewCount(reviewCount);
            freelancer.setCompletedProjects(completedProjects);
            freelancer.setSuccessRate(Math.min(99.0, 90.0 + index));
            freelancer.setProfilePicture(REVIEW_SEED_AVATARS.get(index % REVIEW_SEED_AVATARS.size()));
            freelancer.setLastActive(now.minusHours(index));
            freelancer.setUpdatedAt(now);

            if (freelancer.getCurrency() == null || freelancer.getCurrency().isBlank()) {
                freelancer.setCurrency("USD");
            }
            if (freelancer.getHourlyRate() == null) {
                freelancer.setHourlyRate(java.math.BigDecimal.valueOf(40 + (index * 4L)));
            }

            List<Freelancer.PortfolioItem> portfolio = freelancer.getPortfolio() != null
                    ? new ArrayList<>(freelancer.getPortfolio())
                    : new ArrayList<>();

            Freelancer.PortfolioItem seededItem = Freelancer.PortfolioItem.builder()
                    .id(UUID.randomUUID().toString())
                    .title("Enterprise Delivery Program")
                    .description("Seeded portfolio project for review/testimonial visibility on landing page.")
                    .testimonial(REVIEW_SEED_QUOTES.get(templateIndex))
                    .completedAt(now.minusDays(14 + index))
                    .build();

            if (portfolio.isEmpty()) {
                portfolio.add(seededItem);
            } else {
                Freelancer.PortfolioItem first = portfolio.get(0);
                if (first == null) {
                    portfolio.set(0, seededItem);
                } else {
                    if (first.getId() == null || first.getId().isBlank()) first.setId(UUID.randomUUID().toString());
                    if (first.getTitle() == null || first.getTitle().isBlank()) first.setTitle("Enterprise Delivery Program");
                    if (first.getDescription() == null || first.getDescription().isBlank()) {
                        first.setDescription("Seeded portfolio project for review/testimonial visibility on landing page.");
                    }
                    first.setTestimonial(REVIEW_SEED_QUOTES.get(templateIndex));
                    if (first.getCompletedAt() == null) first.setCompletedAt(now.minusDays(14 + index));
                }
            }

            freelancer.setPortfolio(portfolio);
            toSave.add(freelancer);
        }

        List<Freelancer> saved = freelancerRepository.saveAll(toSave);
        List<FeaturedFreelancerReview> preview = saved.stream()
                .sorted(Comparator.comparing(Freelancer::getRating, Comparator.reverseOrder())
                        .thenComparing(Freelancer::getReviewCount, Comparator.reverseOrder()))
                .map(this::toFeaturedReview)
                .limit(6)
                .toList();

        return new ReviewSeedResult(saved.size(), clearedCount, preview);
    }

    private FeaturedFreelancerReview toFeaturedReview(Freelancer freelancer) {
        String quote = selectReviewBody(freelancer);
        String role = freelancer.getProfessionalTitle() != null && !freelancer.getProfessionalTitle().isBlank()
                ? freelancer.getProfessionalTitle()
                : "Freelancer";

        return new FeaturedFreelancerReview(
                freelancer.getId(),
                quote,
                buildDisplayName(freelancer.getUserId()),
                role,
                freelancer.getRating() != null ? freelancer.getRating() : 0.0,
                freelancer.getReviewCount() != null ? freelancer.getReviewCount() : 0,
                freelancer.getProfilePicture()
        );
    }

    private String selectReviewBody(Freelancer freelancer) {
        if (freelancer.getPortfolio() != null) {
            for (Freelancer.PortfolioItem item : freelancer.getPortfolio()) {
                if (item == null || item.getTestimonial() == null) continue;
                String testimonial = item.getTestimonial().trim();
                if (!testimonial.isEmpty()) return testimonial;
            }
        }

        double rating = freelancer.getRating() != null ? freelancer.getRating() : 0.0;
        int reviewCount = freelancer.getReviewCount() != null ? freelancer.getReviewCount() : 0;
        int completedProjects = freelancer.getCompletedProjects() != null ? freelancer.getCompletedProjects() : 0;

        if (completedProjects > 0) {
            return String.format(
                    Locale.US,
                    "Consistently rated %.1f/5 across %d reviews with %d completed projects on SabaHub.",
                    rating,
                    reviewCount,
                    completedProjects
            );
        }

        return String.format(
                Locale.US,
                "Maintains a %.1f/5 rating across %d verified platform reviews.",
                rating,
                reviewCount
        );
    }

    private String buildDisplayName(String userId) {
        if (userId == null || userId.isBlank()) return "Verified Freelancer";

        String raw = userId.contains("@") ? userId.substring(0, userId.indexOf('@')) : userId;
        String normalized = raw.replaceAll("[._-]+", " ").trim().replaceAll("\\s+", " ");
        if (normalized.isBlank()) return "Verified Freelancer";

        StringBuilder builder = new StringBuilder();
        for (String part : normalized.split(" ")) {
            if (part.isBlank()) continue;
            if (!builder.isEmpty()) builder.append(' ');
            builder.append(part.substring(0, 1).toUpperCase(Locale.US));
            if (part.length() > 1) builder.append(part.substring(1).toLowerCase(Locale.US));
        }

        return builder.isEmpty() ? "Verified Freelancer" : builder.toString();
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

    public record FeaturedFreelancerReview(
            String id,
            String quote,
            String name,
            String role,
            Double rating,
            Integer reviewCount,
            String avatarUrl
    ) {}

    public record ReviewSeedResult(
            int seededCount,
            int clearedCount,
            List<FeaturedFreelancerReview> preview
    ) {}
}
