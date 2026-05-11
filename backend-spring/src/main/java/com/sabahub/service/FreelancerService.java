package com.sabahub.service;

import com.sabahub.domain.*;
import com.sabahub.dto.freelancer.FreelancerDTOs.*;
import com.sabahub.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    public Freelancer createFreelancerProfile(String userId, FreelancerProfileRequest request) {
        log.info("Creating freelancer profile for user: {}", userId);

        boolean existed = findFreelancerByUserReference(userId).isPresent();
        Freelancer freelancer = ensureFreelancerProfile(userId);

        Freelancer saved = freelancerRepository.save(applyProfileRequest(freelancer, request));
        if (existed) {
            auditService.logAction(userId, "FREELANCER_PROFILE_UPDATED", saved.getId());
        }

        return saved;
    }

    public Freelancer getFreelancerByUserId(String userId) {
        return findFreelancerByUserReference(userId)
                .orElseThrow(() -> new RuntimeException("Freelancer profile not found for user: " + userId));
    }

    public Freelancer ensureFreelancerProfile(String userId) {
        Optional<Freelancer> existing = findFreelancerByUserReference(userId);
        if (existing.isPresent()) {
            return existing.get();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found for freelancer profile: " + userId));

        Freelancer baseline = buildBaselineProfile(user);
        try {
            Freelancer saved = freelancerRepository.save(baseline);
            auditService.logAction(userId, "FREELANCER_PROFILE_CREATED", saved.getId());
            return saved;
        } catch (DuplicateKeyException ex) {
            return getFreelancerByUserId(userId);
        }
    }

    public Freelancer getFreelancerById(String id) {
        return freelancerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Freelancer not found: " + id));
    }

    public Freelancer updateProfile(String freelancerId, FreelancerProfileRequest request) {
        Freelancer freelancer = getFreelancerById(freelancerId);

        Freelancer updated = applyProfileRequest(freelancer, request);
        return freelancerRepository.save(updated);
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

    private Optional<Freelancer> findFreelancerByUserReference(String userReference) {
        if (userReference == null || userReference.isBlank()) {
            return Optional.empty();
        }

        Optional<Freelancer> direct = freelancerRepository.findByUserId(userReference);
        if (direct.isPresent()) {
            return direct;
        }

        Optional<User> userById = userRepository.findById(userReference);
        if (userById.isPresent()) {
            return findOrMigrateLegacyProfile(userById.get());
        }

        Optional<User> userByEmail = userRepository.findByEmailIgnoreCase(userReference);
        if (userByEmail.isPresent()) {
            User user = userByEmail.get();

            Optional<Freelancer> canonical = freelancerRepository.findByUserId(user.getId());
            if (canonical.isPresent()) {
                return canonical;
            }

            return findOrMigrateLegacyProfile(user);
        }

        return Optional.empty();
    }

    private Optional<Freelancer> findOrMigrateLegacyProfile(User user) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            return Optional.empty();
        }

        Optional<Freelancer> legacy = freelancerRepository.findByUserId(user.getEmail());
        if (legacy.isEmpty()) {
            return Optional.empty();
        }

        Freelancer freelancer = legacy.get();
        if (user.getId() != null && !user.getId().isBlank() && !user.getId().equals(freelancer.getUserId())) {
            freelancer.setUserId(user.getId());
            freelancer.setUpdatedAt(LocalDateTime.now());
            return Optional.of(freelancerRepository.save(freelancer));
        }

        return Optional.of(freelancer);
    }

    private Freelancer buildBaselineProfile(User user) {
        LocalDateTime now = LocalDateTime.now();
        UserProfile profile = user.getProfile();

        return Freelancer.builder()
                .userId(user.getId())
                .professionalTitle(null)
                .bio(profile != null ? profile.getBio() : null)
                .profilePicture(profile != null ? profile.getProfilePictureUrl() : null)
                .coverImage(null)
                .location(profile != null ? profile.getLocation() : null)
                .timezone(profile != null ? profile.getTimezone() : null)
                .languages(defaultLanguages(profile))
                .skills(defaultSkills(profile))
                .categories(defaultCategories(profile))
                .portfolio(new ArrayList<>())
                .certifications(new ArrayList<>())
                .education(new ArrayList<>())
                .hourlyRate(parseBigDecimal(profile != null ? profile.getHourlyRate() : null))
                .currency("USD")
                .minimumProjectBudget(null)
                .availability(hasText(profile != null ? profile.getAvailability() : null) ? profile.getAvailability() : "FULL_TIME")
                .hoursPerWeek(null)
                .availableFrom(null)
                .preferredProjectTypes(new ArrayList<>())
                .preferredProjectSizes(new ArrayList<>())
                .remoteOnly(Boolean.TRUE)
                .preferredIndustries(new ArrayList<>())
                .totalEarnings(BigDecimal.ZERO)
                .completedProjects(0)
                .activeProjects(0)
                .totalProposals(0)
                .acceptedProposals(0)
                .successRate(0.0)
                .rating(0.0)
                .reviewCount(0)
                .jobSuccessScore(0)
                .verificationStatus("PENDING")
                .verificationDocuments(new ArrayList<>())
                .emailVerified(profile != null ? profile.getEmailVerified() : null)
                .phoneVerified(profile != null ? profile.getPhoneVerified() : null)
                .identityVerified(profile != null ? profile.getIdentityVerified() : null)
                .currentBalance(BigDecimal.ZERO)
                .pendingBalance(BigDecimal.ZERO)
                .totalWithdrawn(BigDecimal.ZERO)
                .createdAt(now)
                .updatedAt(now)
                .lastActive(now)
                .isActive(true)
                .build();
    }

    private Freelancer applyProfileRequest(Freelancer freelancer, FreelancerProfileRequest request) {
        if (request == null) {
            freelancer.setUpdatedAt(LocalDateTime.now());
            return freelancer;
        }

        if (request.getProfessionalTitle() != null) freelancer.setProfessionalTitle(request.getProfessionalTitle());
        if (request.getBio() != null) freelancer.setBio(request.getBio());
        if (request.getProfilePicture() != null) freelancer.setProfilePicture(request.getProfilePicture());
        if (request.getCoverImage() != null) freelancer.setCoverImage(request.getCoverImage());
        if (request.getLocation() != null) freelancer.setLocation(request.getLocation());
        if (request.getTimezone() != null) freelancer.setTimezone(request.getTimezone());
        if (request.getHourlyRate() != null) freelancer.setHourlyRate(request.getHourlyRate());
        if (request.getCurrency() != null) freelancer.setCurrency(request.getCurrency());
        if (request.getMinimumProjectBudget() != null) freelancer.setMinimumProjectBudget(request.getMinimumProjectBudget());
        if (request.getAvailability() != null) freelancer.setAvailability(request.getAvailability());
        if (request.getHoursPerWeek() != null) freelancer.setHoursPerWeek(request.getHoursPerWeek());
        if (request.getAvailableFrom() != null) freelancer.setAvailableFrom(request.getAvailableFrom());
        if (request.getCategories() != null) freelancer.setCategories(new ArrayList<>(request.getCategories()));
        if (request.getLanguages() != null) freelancer.setLanguages(new ArrayList<>(request.getLanguages()));
        if (request.getPreferredProjectTypes() != null) freelancer.setPreferredProjectTypes(new ArrayList<>(request.getPreferredProjectTypes()));
        if (request.getPreferredProjectSizes() != null) freelancer.setPreferredProjectSizes(new ArrayList<>(request.getPreferredProjectSizes()));
        if (request.getRemoteOnly() != null) freelancer.setRemoteOnly(request.getRemoteOnly());
        if (request.getPreferredIndustries() != null) freelancer.setPreferredIndustries(new ArrayList<>(request.getPreferredIndustries()));
        if (request.getSkills() != null) freelancer.setSkills(new ArrayList<>(request.getSkills()));
        if (request.getEducation() != null) freelancer.setEducation(new ArrayList<>(request.getEducation()));

        if (freelancer.getPortfolio() == null) freelancer.setPortfolio(new ArrayList<>());
        if (freelancer.getCertifications() == null) freelancer.setCertifications(new ArrayList<>());
        if (freelancer.getEducation() == null) freelancer.setEducation(new ArrayList<>());
        if (freelancer.getLanguages() == null) freelancer.setLanguages(new ArrayList<>());
        if (freelancer.getSkills() == null) freelancer.setSkills(new ArrayList<>());
        if (freelancer.getCategories() == null) freelancer.setCategories(new ArrayList<>());
        if (freelancer.getPreferredProjectTypes() == null) freelancer.setPreferredProjectTypes(new ArrayList<>());
        if (freelancer.getPreferredProjectSizes() == null) freelancer.setPreferredProjectSizes(new ArrayList<>());
        if (freelancer.getPreferredIndustries() == null) freelancer.setPreferredIndustries(new ArrayList<>());
        if (freelancer.getVerificationDocuments() == null) freelancer.setVerificationDocuments(new ArrayList<>());

        freelancer.setIsActive(Boolean.TRUE.equals(freelancer.getIsActive()) || freelancer.getIsActive() == null);
        freelancer.setLastActive(LocalDateTime.now());
        freelancer.setUpdatedAt(LocalDateTime.now());
        if (freelancer.getCreatedAt() == null) {
            freelancer.setCreatedAt(LocalDateTime.now());
        }

        return freelancer;
    }

    private List<String> defaultLanguages(UserProfile profile) {
        if (profile == null || !hasText(profile.getLanguage())) {
            return new ArrayList<>();
        }
        return new ArrayList<>(List.of(profile.getLanguage().trim()));
    }

    private List<Freelancer.Skill> defaultSkills(UserProfile profile) {
        if (profile == null || profile.getSkills() == null) {
            return new ArrayList<>();
        }

        return profile.getSkills().stream()
                .filter(this::hasText)
                .map(skill -> Freelancer.Skill.builder().name(skill.trim()).level("INTERMEDIATE").build())
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private List<String> defaultCategories(UserProfile profile) {
        if (profile == null || profile.getPreferredCategories() == null) {
            return new ArrayList<>();
        }
        return profile.getPreferredCategories().stream()
                .filter(this::hasText)
                .map(String::trim)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private BigDecimal parseBigDecimal(String value) {
        if (!hasText(value)) {
            return null;
        }
        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    public Proposal submitProposal(String freelancerId, ProposalRequest request) {
        Freelancer freelancer = getFreelancerById(freelancerId);
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
        
        Proposal proposal = new Proposal();
        proposal.setFreelancerId(freelancerId);
        proposal.setJobId(request.getProjectId());  // Request uses projectId but we map it to jobId in domain
        proposal.setCoverLetter(request.getCoverLetter());
        proposal.setBidAmount(request.getBidAmount().doubleValue());
        proposal.setTimelineDays(request.getDeliveryTime());
        proposal.setStatus(Proposal.Status.SUBMITTED);
        
        Proposal saved = proposalRepository.save(proposal);
        auditService.logAction(freelancer.getUserId(), "PROPOSAL_SUBMITTED", saved.getId());

        notificationService.notifyProposalSubmitted(
                project.getEmployerId(),
                project.getId(),
                project.getTitle(),
                freelancer.getUserId(),
                saved.getBidAmount()
        );
        
        return saved;
    }

    public List<Proposal> getProposalsByFreelancer(String freelancerId) {
        return proposalRepository.findByFreelancerId(freelancerId);
    }

    public List<Proposal> getProposalsForFreelancerUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return List.of();
        }

        LinkedHashMap<String, Proposal> unique = new LinkedHashMap<>();

        // Newer proposal flow stores freelancerId as authenticated user id.
        proposalRepository.findByFreelancerId(userId).forEach(proposal -> {
            if (proposal.getId() != null && !proposal.getId().isBlank()) {
                unique.putIfAbsent(proposal.getId(), proposal);
            }
        });

        // Legacy flow stores freelancerId as freelancer profile id.
        freelancerRepository.findByUserId(userId).ifPresent(profile -> {
            if (profile.getId() != null && !profile.getId().isBlank()) {
                proposalRepository.findByFreelancerId(profile.getId()).forEach(proposal -> {
                    if (proposal.getId() != null && !proposal.getId().isBlank()) {
                        unique.putIfAbsent(proposal.getId(), proposal);
                    }
                });
            }
        });

        return unique.values().stream()
                .sorted((left, right) -> {
                    java.time.Instant leftCreated = left.getCreatedAt() == null ? java.time.Instant.EPOCH : left.getCreatedAt();
                    java.time.Instant rightCreated = right.getCreatedAt() == null ? java.time.Instant.EPOCH : right.getCreatedAt();
                    return rightCreated.compareTo(leftCreated);
                })
                .toList();
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
    public Page<MarketplaceFreelancerCard> discoverFreelancers(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 60);
        PageRequest pageable = PageRequest.of(safePage, safeSize);

        Page<Freelancer> verifiedPage = freelancerRepository.findActiveVerifiedFreelancers(pageable);
        Page<Freelancer> sourcePage = verifiedPage;

        if (verifiedPage.isEmpty()) {
            List<Freelancer> fallbackItems = freelancerRepository.findAll().stream()
                    .filter(freelancer -> Boolean.TRUE.equals(freelancer.getIsActive()))
                    .sorted(
                            Comparator.comparing(
                                            (Freelancer freelancer) -> freelancer.getRating() != null ? freelancer.getRating() : 0.0,
                                            Comparator.reverseOrder()
                                    )
                                    .thenComparing(
                                            freelancer -> freelancer.getReviewCount() != null ? freelancer.getReviewCount() : 0,
                                            Comparator.reverseOrder()
                                    )
                                    .thenComparing(
                                            freelancer -> freelancer.getUpdatedAt() != null ? freelancer.getUpdatedAt() : LocalDateTime.MIN,
                                            Comparator.reverseOrder()
                                    )
                    )
                    .toList();

            int fromIndex = Math.min(safePage * safeSize, fallbackItems.size());
            int toIndex = Math.min(fromIndex + safeSize, fallbackItems.size());
            sourcePage = new PageImpl<>(
                    fallbackItems.subList(fromIndex, toIndex),
                    pageable,
                    fallbackItems.size()
            );
        }

        List<MarketplaceFreelancerCard> items = sourcePage.getContent().stream()
                .map(this::toMarketplaceFreelancerCard)
                .toList();

        return new PageImpl<>(items, pageable, sourcePage.getTotalElements());
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

    private MarketplaceFreelancerCard toMarketplaceFreelancerCard(Freelancer freelancer) {
        User user = resolveFreelancerUser(freelancer);
        String name = user != null && user.getFullName() != null && !user.getFullName().isBlank()
                ? user.getFullName()
                : buildDisplayName(freelancer.getUserId());

        List<String> skillNames = freelancer.getSkills() == null
                ? List.of()
                : freelancer.getSkills().stream()
                        .filter(Objects::nonNull)
                        .map(Freelancer.Skill::getName)
                        .filter(Objects::nonNull)
                        .map(String::trim)
                        .filter(value -> !value.isEmpty())
                        .distinct()
                        .toList();

        List<String> certifications = freelancer.getCertifications() == null
                ? List.of()
                : freelancer.getCertifications().stream()
                        .filter(Objects::nonNull)
                        .map(Freelancer.Certification::getName)
                        .filter(Objects::nonNull)
                        .map(String::trim)
                        .filter(value -> !value.isEmpty())
                        .distinct()
                        .toList();

        return new MarketplaceFreelancerCard(
                freelancer.getId(),
                freelancer.getUserId(),
                name,
                freelancer.getProfessionalTitle(),
                freelancer.getBio(),
                freelancer.getProfilePicture(),
                skillNames,
                freelancer.getHourlyRate() != null ? freelancer.getHourlyRate().doubleValue() : null,
                freelancer.getCurrency(),
                freelancer.getRating(),
                freelancer.getReviewCount(),
                freelancer.getCompletedProjects(),
                freelancer.getAvailability(),
                freelancer.getLocation(),
                freelancer.getLanguages() == null ? List.of() : List.copyOf(freelancer.getLanguages()),
                certifications,
                freelancer.getLastActive() != null ? freelancer.getLastActive().toString() : null,
                "VERIFIED".equalsIgnoreCase(freelancer.getVerificationStatus())
                        || Boolean.TRUE.equals(freelancer.getIdentityVerified())
        );
    }

    private User resolveFreelancerUser(Freelancer freelancer) {
        if (freelancer == null) {
            return null;
        }

        if (freelancer.getUserId() != null && !freelancer.getUserId().isBlank()) {
            Optional<User> byId = userRepository.findById(freelancer.getUserId());
            if (byId.isPresent()) {
                return byId.get();
            }
            Optional<User> byEmail = userRepository.findByEmail(freelancer.getUserId());
            if (byEmail.isPresent()) {
                return byEmail.get();
            }
        }

        return null;
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

    public record MarketplaceFreelancerCard(
            String id,
            String userId,
            String name,
            String title,
            String bio,
            String profileImageUrl,
            List<String> skills,
            Double hourlyRate,
            String currency,
            Double rating,
            Integer reviewCount,
            Integer completedProjects,
            String availability,
            String location,
            List<String> languages,
            List<String> certifications,
            String lastActive,
            boolean verified
    ) {}

    public record ReviewSeedResult(
            int seededCount,
            int clearedCount,
            List<FeaturedFreelancerReview> preview
    ) {}
}
