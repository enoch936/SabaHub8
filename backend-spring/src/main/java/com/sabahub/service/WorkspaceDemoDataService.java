package com.sabahub.service;

import com.sabahub.domain.Contract;
import com.sabahub.domain.Employer;
import com.sabahub.domain.Freelancer;
import com.sabahub.domain.Job;
import com.sabahub.domain.Proposal;
import com.sabahub.domain.User;
import com.sabahub.repository.ContractRepository;
import com.sabahub.repository.EmployerRepository;
import com.sabahub.repository.FreelancerRepository;
import com.sabahub.repository.JobRepository;
import com.sabahub.repository.ProposalRepository;
import com.sabahub.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class WorkspaceDemoDataService {

    private static final String DEMO_PASSWORD = "Demo@123456";

    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final EmployerRepository employerRepository;
    private final FreelancerRepository freelancerRepository;
    private final JobRepository jobRepository;
    private final ProposalRepository proposalRepository;
    private final ContractRepository contractRepository;
    private final PasswordEncoder passwordEncoder;
    private final SocialService socialService;

    public WorkspaceDemoDataService(CurrentUserService currentUserService,
                                    UserRepository userRepository,
                                    EmployerRepository employerRepository,
                                    FreelancerRepository freelancerRepository,
                                    JobRepository jobRepository,
                                    ProposalRepository proposalRepository,
                                    ContractRepository contractRepository,
                                    PasswordEncoder passwordEncoder,
                                    SocialService socialService) {
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.employerRepository = employerRepository;
        this.freelancerRepository = freelancerRepository;
        this.jobRepository = jobRepository;
        this.proposalRepository = proposalRepository;
        this.contractRepository = contractRepository;
        this.passwordEncoder = passwordEncoder;
        this.socialService = socialService;
    }

    public BootstrapResult bootstrapCurrentUserWorkspace() {
        User currentUser = currentUserService.requireUser();
        String activeRole = currentUserService.getActiveWorkspaceRole();
        SeedStats stats = new SeedStats();

        // Seed global social content first
        socialService.seedData();

        boolean seedEmployer = shouldSeedRole(currentUser, activeRole, "EMPLOYER");
        boolean seedFreelancer = shouldSeedRole(currentUser, activeRole, "FREELANCER");

        if (seedEmployer) {
            seedEmployerWorkspace(currentUser, stats);
        }
        if (seedFreelancer) {
            seedFreelancerWorkspace(currentUser, stats);
        }

        return new BootstrapResult(
                stats.createdAny(),
                seedEmployer,
                seedFreelancer,
                stats.supportUsersCreated,
                stats.employerProfilesCreated,
                stats.freelancerProfilesCreated,
                stats.jobsCreated,
                stats.proposalsCreated,
                stats.contractsCreated
        );
    }

    private boolean shouldSeedRole(User currentUser, String activeRole, String role) {
        if (!currentUserService.hasRole(currentUser, role)) {
            return false;
        }
        return activeRole == null || role.equalsIgnoreCase(activeRole);
    }

    private void seedEmployerWorkspace(User currentUser, SeedStats stats) {
        Employer employerProfile = ensureEmployerProfile(
                currentUser,
                resolveCompanyName(currentUser, "SabaHub Studio"),
                "Software",
                "Ethiopia",
                stats,
                false
        );

        String scope = scopedKey(currentUser);
        SeededFreelancer amina = ensureSupportFreelancer(
                scope,
                "employer-talent-1",
                "Amina Tesfaye",
                "Senior Product Designer",
                "Add depth and polish to B2B workflows, onboarding, and pricing journeys.",
                List.of("Product Design", "UX Strategy", "Figma"),
                "Addis Ababa, ET",
                58,
                4.9,
                46,
                stats
        );
        SeededFreelancer noah = ensureSupportFreelancer(
                scope,
                "employer-talent-2",
                "Noah Bekele",
                "Motion Designer",
                "Translates product launches into crisp motion systems and explainer assets.",
                List.of("After Effects", "Motion Design", "Storyboarding"),
                "Nairobi, KE",
                52,
                4.8,
                33,
                stats
        );
        SeededFreelancer liya = ensureSupportFreelancer(
                scope,
                "employer-talent-3",
                "Liya Alemu",
                "Brand Strategist",
                "Shapes messaging systems, launch campaigns, and cross-channel brand kits.",
                List.of("Brand Strategy", "Creative Direction", "Messaging"),
                "Kigali, RW",
                49,
                4.7,
                29,
                stats
        );

        Job queueJob = ensureJob(
                currentUser.getId(),
                employerProfile,
                "Brand System QA Sprint",
                "Audit and polish a marketplace brand system before public launch.",
                "Refine buttons, motion cues, and responsive states across the customer journey.",
                Job.Status.OPEN,
                Job.EngagementType.CONTRACT,
                Job.DeliverableType.IMAGE_DESIGN,
                Job.PricingModel.HOURLY,
                List.of("Design Systems", "Figma", "UX Audit"),
                "design-systems",
                1600,
                3200,
                Instant.now().minusSeconds(3 * 86400L),
                stats
        );

        Job activeJob = ensureJob(
                currentUser.getId(),
                employerProfile,
                "Launch Video Storyboards",
                "Produce storyboard frames and shot planning for a launch-week product film.",
                "Align narrative beats, transitions, and CTA framing for paid social and landing pages.",
                Job.Status.IN_PROGRESS,
                Job.EngagementType.PROJECT_BASED,
                Job.DeliverableType.VIDEO_PRODUCTION,
                Job.PricingModel.FIXED_PRICE,
                List.of("Storyboarding", "Motion Design", "Video Strategy"),
                "video-production",
                2400,
                4200,
                Instant.now().minusSeconds(8 * 86400L),
                stats
        );

        Job completedJob = ensureJob(
                currentUser.getId(),
                employerProfile,
                "Sales Deck Refresh",
                "Refresh enterprise sales materials for a new outbound campaign.",
                "Deliver a cleaner structure, stronger hierarchy, and updated data-storytelling layouts.",
                Job.Status.COMPLETED,
                Job.EngagementType.RETAINER,
                Job.DeliverableType.DOCUMENT_DEVELOPMENT,
                Job.PricingModel.FIXED_PRICE,
                List.of("Presentation Design", "Copy Structure", "Brand Systems"),
                "presentation-design",
                1200,
                2100,
                Instant.now().minusSeconds(18 * 86400L),
                stats
        );

        Proposal queuedProposal = ensureProposal(
                queueJob,
                noah.user(),
                "I can tighten the motion language and help the system feel premium across launch surfaces.",
                2750,
                7,
                Proposal.Status.SUBMITTED,
                Instant.now().minusSeconds(2 * 86400L),
                stats
        );
        Proposal shortlistedProposal = ensureProposal(
                queueJob,
                liya.user(),
                "I would lead the audit and map the brand touchpoints that need a stronger narrative system.",
                2950,
                10,
                Proposal.Status.SHORTLISTED,
                Instant.now().minusSeconds(36 * 3600L),
                stats
        );
        Proposal activeProposal = ensureProposal(
                activeJob,
                amina.user(),
                "I can own storyboard structure, visual pacing, and cross-team review loops for the launch film.",
                3900,
                12,
                Proposal.Status.ACCEPTED,
                Instant.now().minusSeconds(7 * 86400L),
                stats
        );
        Proposal completedProposal = ensureProposal(
                completedJob,
                amina.user(),
                "I can modernize the sales narrative and rebuild the deck with cleaner hierarchy and templates.",
                1980,
                6,
                Proposal.Status.ACCEPTED,
                Instant.now().minusSeconds(16 * 86400L),
                stats
        );

        Contract activeContract = ensureContract(
                activeJob,
                amina.user(),
                activeProposal,
                "Launch Video Storyboards",
                "Active production contract covering storyboard delivery and review cycles.",
                Contract.Status.ACTIVE,
                LocalDateTime.now().minusDays(6),
                LocalDateTime.now().plusDays(8),
                stats
        );
        Contract completedContract = ensureContract(
                completedJob,
                amina.user(),
                completedProposal,
                "Sales Deck Refresh",
                "Completed sales enablement engagement with approved deliverables and handoff.",
                Contract.Status.COMPLETED,
                LocalDateTime.now().minusDays(15),
                LocalDateTime.now().minusDays(4),
                stats
        );

        syncFreelancerSnapshot(amina.freelancer(), List.of(activeProposal, completedProposal), List.of(activeContract, completedContract));
        syncFreelancerSnapshot(noah.freelancer(), List.of(queuedProposal), List.of());
        syncFreelancerSnapshot(liya.freelancer(), List.of(shortlistedProposal), List.of());
        syncEmployerSnapshot(employerProfile, currentUser.getId());
    }

    private void seedFreelancerWorkspace(User currentUser, SeedStats stats) {
        Freelancer freelancerProfile = ensureFreelancerProfile(
                currentUser,
                "Senior Creative Freelancer",
                "Trusted across product, brand, and launch systems with a bias for crisp delivery.",
                List.of("Product Design", "Brand Systems", "Motion Strategy"),
                "Remote",
                57,
                4.8,
                24,
                stats,
                false
        );

        String scope = scopedKey(currentUser);
        SeededEmployer atlas = ensureSupportEmployer(
                scope,
                "freelancer-client-1",
                "Atlas Commerce",
                "Retail Technology",
                "Ethiopia",
                "Commerce team preparing new conversion flows and GTM assets.",
                stats
        );
        SeededEmployer northstar = ensureSupportEmployer(
                scope,
                "freelancer-client-2",
                "Northstar Labs",
                "B2B SaaS",
                "Kenya",
                "Product organization tightening launch systems and storytelling assets.",
                stats
        );
        SeededEmployer riverside = ensureSupportEmployer(
                scope,
                "freelancer-client-3",
                "Riverside Health",
                "Digital Health",
                "Rwanda",
                "Operations team simplifying onboarding collateral for new enterprise buyers.",
                stats
        );

        Job submittedJob = ensureJob(
                atlas.user().getId(),
                atlas.employer(),
                "Checkout UX Audit",
                "Review a mobile checkout journey and recommend fixes for friction-heavy steps.",
                "Map drop-off points, rewrite microcopy, and package pragmatic design recommendations.",
                Job.Status.OPEN,
                Job.EngagementType.CONTRACT,
                Job.DeliverableType.IMAGE_DESIGN,
                Job.PricingModel.HOURLY,
                List.of("UX Audit", "Funnel Analysis", "Mobile UX"),
                "ux-audit",
                900,
                1800,
                Instant.now().minusSeconds(4 * 86400L),
                stats
        );

        Job activeJob = ensureJob(
                northstar.user().getId(),
                northstar.employer(),
                "Explainer Animation Retainer",
                "Build a short explainer sequence and reusable motion language for feature launches.",
                "Own concept frames, transition logic, and lightweight production assets.",
                Job.Status.IN_PROGRESS,
                Job.EngagementType.LONG_TERM_PARTNERSHIP,
                Job.DeliverableType.VIDEO_PRODUCTION,
                Job.PricingModel.RETAINER,
                List.of("Motion Design", "Narrative Systems", "After Effects"),
                "motion-design",
                2200,
                3600,
                Instant.now().minusSeconds(9 * 86400L),
                stats
        );

        Job completedJob = ensureJob(
                riverside.user().getId(),
                riverside.employer(),
                "Case Study Layout Refresh",
                "Refresh case study templates for enterprise sales and onboarding collateral.",
                "Upgrade structure, hierarchy, and reusable sections for the internal content system.",
                Job.Status.COMPLETED,
                Job.EngagementType.PROJECT_BASED,
                Job.DeliverableType.DOCUMENT_DEVELOPMENT,
                Job.PricingModel.FIXED_PRICE,
                List.of("Editorial Design", "Template Systems", "Typography"),
                "document-design",
                1300,
                2400,
                Instant.now().minusSeconds(20 * 86400L),
                stats
        );

        Proposal submittedProposal = ensureProposal(
                submittedJob,
                currentUser,
                "I can audit the journey quickly and package a fix list your team can ship right away.",
                1450,
                5,
                Proposal.Status.SUBMITTED,
                Instant.now().minusSeconds(3 * 86400L),
                stats
        );
        Proposal activeProposal = ensureProposal(
                activeJob,
                currentUser,
                "I can translate your release roadmap into repeatable motion patterns and launch assets.",
                3300,
                14,
                Proposal.Status.ACCEPTED,
                Instant.now().minusSeconds(8 * 86400L),
                stats
        );
        Proposal completedProposal = ensureProposal(
                completedJob,
                currentUser,
                "I can rebuild the case study system with modular layouts and polished presentation structure.",
                1980,
                7,
                Proposal.Status.ACCEPTED,
                Instant.now().minusSeconds(18 * 86400L),
                stats
        );

        Contract activeContract = ensureContract(
                activeJob,
                currentUser,
                activeProposal,
                "Explainer Animation Retainer",
                "Active retainer covering concepting, storyboarding, and delivery of launch-ready assets.",
                Contract.Status.ACTIVE,
                LocalDateTime.now().minusDays(7),
                LocalDateTime.now().plusDays(9),
                stats
        );
        Contract completedContract = ensureContract(
                completedJob,
                currentUser,
                completedProposal,
                "Case Study Layout Refresh",
                "Completed project with approved layouts, exports, and reusable narrative templates.",
                Contract.Status.COMPLETED,
                LocalDateTime.now().minusDays(17),
                LocalDateTime.now().minusDays(5),
                stats
        );

        syncFreelancerSnapshot(
                freelancerProfile,
                List.of(submittedProposal, activeProposal, completedProposal),
                List.of(activeContract, completedContract)
        );
    }

    private Employer ensureEmployerProfile(User user,
                                           String companyName,
                                           String industry,
                                           String country,
                                           SeedStats stats,
                                           boolean supportProfile) {
        Optional<Employer> existing = employerRepository.findByUserId(user.getId());
        Employer employer = existing.orElseGet(Employer::new);
        boolean created = employer.getId() == null;

        employer.setUserId(user.getId());
        employer.setIsActive(true);
        employer.setTier("PROFESSIONAL");
        employer.setBadges(List.of("VERIFIED"));

        Employer.CompanyProfile profile = employer.getCompanyProfile() != null
                ? employer.getCompanyProfile()
                : new Employer.CompanyProfile();
        if (profile.getCompanyName() == null || profile.getCompanyName().isBlank() || supportProfile) {
            profile.setCompanyName(companyName);
        }
        if (profile.getIndustry() == null || profile.getIndustry().isBlank() || supportProfile) {
            profile.setIndustry(industry);
        }
        if (profile.getCountry() == null || profile.getCountry().isBlank() || supportProfile) {
            profile.setCountry(country);
        }
        if (profile.getDescription() == null || profile.getDescription().isBlank()) {
            profile.setDescription("Live development workspace account used to validate hiring flows.");
        }
        employer.setCompanyProfile(profile);

        Employer.EmployerStats employerStats = employer.getStats() != null
                ? employer.getStats()
                : new Employer.EmployerStats();
        if (employerStats.getTotalProjectsPosted() == null) employerStats.setTotalProjectsPosted(0);
        if (employerStats.getActiveProjects() == null) employerStats.setActiveProjects(0);
        if (employerStats.getCompletedProjects() == null) employerStats.setCompletedProjects(0);
        if (employerStats.getTotalSpent() == null) employerStats.setTotalSpent(0.0);
        if (employerStats.getTotalHired() == null) employerStats.setTotalHired(0);
        if (employerStats.getRepeatHireRate() == null) employerStats.setRepeatHireRate(0);
        employer.setStats(employerStats);

        Employer.VerificationStatus verificationStatus = employer.getVerificationStatus() != null
                ? employer.getVerificationStatus()
                : new Employer.VerificationStatus();
        verificationStatus.setEmail(user.getEmail());
        verificationStatus.setEmailVerified(Boolean.TRUE);
        verificationStatus.setPhoneVerified(Boolean.TRUE);
        verificationStatus.setBusinessVerified(Boolean.TRUE);
        verificationStatus.setPaymentVerified(Boolean.TRUE);
        employer.setVerificationStatus(verificationStatus);

        Employer saved = employerRepository.save(employer);
        if (created) {
            stats.employerProfilesCreated += 1;
        }
        return saved;
    }

    private Freelancer ensureFreelancerProfile(User user,
                                               String title,
                                               String bio,
                                               List<String> skills,
                                               String location,
                                               double hourlyRate,
                                               double rating,
                                               int reviewCount,
                                               SeedStats stats,
                                               boolean supportProfile) {
        Optional<Freelancer> existing = freelancerRepository.findByUserId(user.getId());
        Freelancer freelancer = existing.orElseGet(Freelancer::new);
        boolean created = freelancer.getId() == null;

        freelancer.setUserId(user.getId());
        if (freelancer.getProfessionalTitle() == null || freelancer.getProfessionalTitle().isBlank() || supportProfile) {
            freelancer.setProfessionalTitle(title);
        }
        if (freelancer.getBio() == null || freelancer.getBio().isBlank() || supportProfile) {
            freelancer.setBio(bio);
        }
        if (freelancer.getLocation() == null || freelancer.getLocation().isBlank() || supportProfile) {
            freelancer.setLocation(location);
        }
        freelancer.setIsActive(true);
        freelancer.setVerificationStatus("VERIFIED");
        freelancer.setEmailVerified(Boolean.TRUE);
        freelancer.setPhoneVerified(Boolean.TRUE);
        freelancer.setIdentityVerified(Boolean.TRUE);
        freelancer.setHourlyRate(BigDecimal.valueOf(hourlyRate));
        freelancer.setCurrency("USD");
        freelancer.setAvailability("FULL_TIME");
        freelancer.setRemoteOnly(Boolean.TRUE);
        freelancer.setLanguages(List.of("English"));
        freelancer.setCategories(List.of(slugify(skills.get(0))));
        freelancer.setPreferredProjectTypes(List.of("FIXED_PRICE", "HOURLY"));
        freelancer.setPreferredProjectSizes(List.of("SMALL", "MEDIUM", "LARGE"));
        freelancer.setPreferredIndustries(List.of("SaaS", "E-commerce"));
        freelancer.setSkills(toFreelancerSkills(skills));
        freelancer.setPortfolio(buildPortfolioItems(title));
        freelancer.setRating(rating);
        freelancer.setReviewCount(reviewCount);
        freelancer.setJobSuccessScore(freelancer.getJobSuccessScore() == null ? (int) Math.round(rating * 20.0) : freelancer.getJobSuccessScore());
        freelancer.setLastActive(LocalDateTime.now().minusHours(2));
        freelancer.setUpdatedAt(LocalDateTime.now());
        if (freelancer.getCreatedAt() == null) {
            freelancer.setCreatedAt(LocalDateTime.now().minusDays(40));
        }

        Freelancer saved = freelancerRepository.save(freelancer);
        if (created) {
            stats.freelancerProfilesCreated += 1;
        }
        return saved;
    }

    private SeededFreelancer ensureSupportFreelancer(String scope,
                                                     String suffix,
                                                     String fullName,
                                                     String title,
                                                     String bio,
                                                     List<String> skills,
                                                     String location,
                                                     double hourlyRate,
                                                     double rating,
                                                     int reviewCount,
                                                     SeedStats stats) {
        User user = ensureSupportUser(
                "demo+" + scope + "-" + suffix + "@sabahub.local",
                fullName,
                Set.of("ROLE_FREELANCER"),
                stats
        );
        Freelancer freelancer = ensureFreelancerProfile(
                user,
                title,
                bio,
                skills,
                location,
                hourlyRate,
                rating,
                reviewCount,
                stats,
                true
        );
        return new SeededFreelancer(user, freelancer);
    }

    private SeededEmployer ensureSupportEmployer(String scope,
                                                 String suffix,
                                                 String companyName,
                                                 String industry,
                                                 String country,
                                                 String companyDescription,
                                                 SeedStats stats) {
        User user = ensureSupportUser(
                "demo+" + scope + "-" + suffix + "@sabahub.local",
                companyName + " Hiring Team",
                Set.of("ROLE_EMPLOYER"),
                stats
        );
        Employer employer = ensureEmployerProfile(user, companyName, industry, country, stats, true);
        if (employer.getCompanyProfile() != null) {
            employer.getCompanyProfile().setDescription(companyDescription);
            employer = employerRepository.save(employer);
        }
        return new SeededEmployer(user, employer);
    }

    private User ensureSupportUser(String email, String fullName, Set<String> roles, SeedStats stats) {
        Optional<User> existing = userRepository.findByEmail(email.toLowerCase());
        if (existing.isPresent()) {
            User user = existing.get();
            user.setFullName(fullName);
            user.setRoles(roles);
            if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
                user.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
            }
            user.setLastSeenAt(Instant.now().minusSeconds(6 * 3600L));
            return userRepository.save(user);
        }

        User user = new User(email.toLowerCase(), fullName, passwordEncoder.encode(DEMO_PASSWORD), roles);
        user.setLastSeenAt(Instant.now().minusSeconds(6 * 3600L));
        User saved = userRepository.save(user);
        stats.supportUsersCreated += 1;
        return saved;
    }

    private Job ensureJob(String employerUserId,
                          Employer employerProfile,
                          String title,
                          String description,
                          String overview,
                          Job.Status status,
                          Job.EngagementType engagementType,
                          Job.DeliverableType deliverableType,
                          Job.PricingModel pricingModel,
                          List<String> skills,
                          String categoryId,
                          double budgetMin,
                          double budgetMax,
                          Instant createdAt,
                          SeedStats stats) {
        Optional<Job> existing = jobRepository.findByEmployerId(employerUserId).stream()
                .filter(job -> title.equalsIgnoreCase(job.getTitle()))
                .findFirst();

        Job job = existing.orElseGet(Job::new);
        boolean created = job.getId() == null;

        job.setEmployerId(employerUserId);
        job.setTitle(title);
        job.setDescription(description);
        job.setOverviewText(overview);
        job.setStatus(status);
        job.setIsEnterpriseOnly(false);
        job.setEngagementType(engagementType);
        job.setDeliverableType(deliverableType);
        job.setPricingModel(pricingModel);
        job.setWorkLocation("Remote");
        job.setBudgetMin(budgetMin);
        job.setBudgetMax(budgetMax);
        job.setCurrency("USD");
        job.setRequiredSkills(skills);
        job.setSkills(skills);
        job.setIndustry(List.of(
                employerProfile.getCompanyProfile() != null && employerProfile.getCompanyProfile().getIndustry() != null
                        ? employerProfile.getCompanyProfile().getIndustry()
                        : "Technology"
        ));
        job.setCompanyName(employerProfile.getCompanyProfile() != null && employerProfile.getCompanyProfile().getCompanyName() != null
                ? employerProfile.getCompanyProfile().getCompanyName()
                : "SabaHub Client");
        job.setCategoryId(categoryId);
        job.setMinYearsExperience(3);
        job.setPreferredExperience(List.of("Senior", "Independent contributor"));
        job.setRequiredQualifications(List.of("Portfolio", "Strong communication"));
        job.setRequiresPortfolio(Boolean.TRUE);
        job.setCreatedAt(createdAt);

        Job saved = jobRepository.save(job);
        if (created) {
            stats.jobsCreated += 1;
        }
        return saved;
    }

    private Proposal ensureProposal(Job job,
                                    User freelancerUser,
                                    String coverLetter,
                                    double bidAmount,
                                    int timelineDays,
                                    Proposal.Status status,
                                    Instant createdAt,
                                    SeedStats stats) {
        Optional<Proposal> existing = proposalRepository.findByJobIdAndFreelancerId(job.getId(), freelancerUser.getId());
        Proposal proposal = existing.orElseGet(Proposal::new);
        boolean created = proposal.getId() == null;

        proposal.setJobId(job.getId());
        proposal.setFreelancerId(freelancerUser.getId());
        proposal.setCoverLetter(coverLetter);
        proposal.setBidAmount(bidAmount);
        proposal.setTimelineDays(timelineDays);
        proposal.setStatus(status);
        proposal.setCreatedAt(createdAt);

        Proposal saved = proposalRepository.save(proposal);
        if (created) {
            stats.proposalsCreated += 1;
        }
        return saved;
    }

    private Contract ensureContract(Job job,
                                    User freelancerUser,
                                    Proposal proposal,
                                    String title,
                                    String description,
                                    Contract.Status status,
                                    LocalDateTime startDate,
                                    LocalDateTime endDate,
                                    SeedStats stats) {
        Optional<Contract> existing = contractRepository.findByJobId(job.getId());
        Contract contract = existing.orElseGet(Contract::new);
        boolean created = contract.getId() == null;

        contract.setJobId(job.getId());
        contract.setEmployerId(job.getEmployerId());
        contract.setFreelancerId(freelancerUser.getId());
        contract.setTitle(title);
        contract.setDescription(description);
        contract.setStatus(status);
        contract.setTotalAmount(proposal.getBidAmount());
        contract.setCurrency(job.getCurrency() == null ? "USD" : job.getCurrency());
        contract.setEscrowTotalHeld(0.0);
        contract.setWorkType(job.getPricingModel() == Job.PricingModel.HOURLY ? "HOURLY" : "FIXED_PRICE");
        contract.setContractType(job.getEngagementType() == Job.EngagementType.LONG_TERM_PARTNERSHIP ? "ONGOING" : "ONE_TIME");
        contract.setStartDate(startDate);
        contract.setEndDate(endDate);
        contract.setAcceptedAt(startDate);
        contract.setCompletedAt(status == Contract.Status.COMPLETED ? endDate : null);
        contract.setTerms(Contract.ContractTerms.builder()
                .scope(job.getOverviewText())
                .deliverables("Approved design and content deliverables")
                .revisionsAllowed(2)
                .paymentSchedule("Milestone based")
                .communicationChannel("SabaHub Workspace")
                .build());
        contract.setPaymentMilestones(List.of(
                Contract.PaymentMilestone.builder()
                        .id(UUID.randomUUID().toString())
                        .title("Delivery milestone")
                        .amount(proposal.getBidAmount())
                        .status(status == Contract.Status.COMPLETED ? "RELEASED" : "IN_ESCROW")
                        .dueDate(endDate)
                        .releaseDate(status == Contract.Status.COMPLETED ? endDate : null)
                        .deliverables("Final approved files and handoff")
                        .percentageComplete(status == Contract.Status.COMPLETED ? 100.0 : 72.0)
                        .approvedByEmployer(status == Contract.Status.COMPLETED)
                        .approvedAt(status == Contract.Status.COMPLETED ? endDate : null)
                        .build()
        ));

        Contract saved = contractRepository.save(contract);
        if (created) {
            stats.contractsCreated += 1;
        }
        return saved;
    }

    private void syncFreelancerSnapshot(Freelancer freelancer, List<Proposal> proposals, List<Contract> contracts) {
        long acceptedProposals = proposals.stream()
                .filter(proposal -> proposal.getStatus() == Proposal.Status.ACCEPTED)
                .count();
        long completedContracts = contracts.stream()
                .filter(contract -> contract.getStatus() == Contract.Status.COMPLETED)
                .count();
        long activeContracts = contracts.stream()
                .filter(contract -> contract.getStatus() == Contract.Status.ACTIVE
                        || contract.getStatus() == Contract.Status.IN_PROGRESS
                        || contract.getStatus() == Contract.Status.DELIVERED)
                .count();
        double totalEarnings = contracts.stream()
                .filter(contract -> contract.getStatus() == Contract.Status.COMPLETED)
                .mapToDouble(contract -> contract.getTotalAmount() == null ? 0.0 : contract.getTotalAmount())
                .sum();
        double pendingBalance = contracts.stream()
                .filter(contract -> contract.getStatus() == Contract.Status.ACTIVE
                        || contract.getStatus() == Contract.Status.IN_PROGRESS
                        || contract.getStatus() == Contract.Status.DELIVERED)
                .mapToDouble(contract -> contract.getTotalAmount() == null ? 0.0 : contract.getTotalAmount())
                .sum();

        freelancer.setTotalProposals(proposals.size());
        freelancer.setAcceptedProposals((int) acceptedProposals);
        freelancer.setCompletedProjects((int) completedContracts);
        freelancer.setActiveProjects((int) activeContracts);
        freelancer.setTotalEarnings(BigDecimal.valueOf(totalEarnings));
        freelancer.setCurrentBalance(BigDecimal.valueOf(totalEarnings));
        freelancer.setPendingBalance(BigDecimal.valueOf(pendingBalance));
        freelancer.setSuccessRate(proposals.isEmpty() ? 0.0 : (acceptedProposals * 100.0) / proposals.size());
        freelancer.setJobSuccessScore((int) Math.round(freelancer.getSuccessRate() == null ? 0.0 : freelancer.getSuccessRate()));
        freelancer.setUpdatedAt(LocalDateTime.now());
        freelancerRepository.save(freelancer);
    }

    private void syncEmployerSnapshot(Employer employer, String employerUserId) {
        List<Job> jobs = jobRepository.findByEmployerId(employerUserId);
        List<Contract> contracts = contractRepository.findByEmployerId(employerUserId);

        Employer.EmployerStats snapshot = employer.getStats() != null ? employer.getStats() : new Employer.EmployerStats();
        snapshot.setTotalProjectsPosted(jobs.size());
        snapshot.setActiveProjects((int) jobs.stream()
                .filter(job -> job.getStatus() == Job.Status.OPEN || job.getStatus() == Job.Status.IN_PROGRESS)
                .count());
        snapshot.setCompletedProjects((int) jobs.stream()
                .filter(job -> job.getStatus() == Job.Status.COMPLETED || job.getStatus() == Job.Status.CLOSED)
                .count());
        snapshot.setTotalSpent(contracts.stream()
                .filter(contract -> contract.getStatus() == Contract.Status.COMPLETED)
                .mapToDouble(contract -> contract.getTotalAmount() == null ? 0.0 : contract.getTotalAmount())
                .sum());
        snapshot.setTotalHired(contracts.size());
        snapshot.setRepeatHireRate((int) Math.round(calculateRepeatHireRate(contracts)));
        employer.setStats(snapshot);
        employerRepository.save(employer);
    }

    private double calculateRepeatHireRate(List<Contract> contracts) {
        if (contracts.isEmpty()) {
            return 0.0;
        }
        long repeatHires = contracts.stream()
                .map(Contract::getFreelancerId)
                .filter(value -> value != null && !value.isBlank())
                .distinct()
                .count();
        return repeatHires == 0 ? 0.0 : ((contracts.size() - repeatHires) * 100.0) / contracts.size();
    }

    private List<Freelancer.Skill> toFreelancerSkills(List<String> skills) {
        return skills.stream()
                .map(skill -> Freelancer.Skill.builder()
                        .name(skill)
                        .level("EXPERT")
                        .yearsOfExperience(4)
                        .build())
                .toList();
    }

    private List<Freelancer.PortfolioItem> buildPortfolioItems(String title) {
        return List.of(
                Freelancer.PortfolioItem.builder()
                        .id(UUID.randomUUID().toString())
                        .title(title + " System")
                        .description("Seeded portfolio project used to validate marketplace visibility and hiring workflows.")
                        .category("Product Design")
                        .technologies(List.of("Figma", "SabaHub"))
                        .completedAt(LocalDateTime.now().minusDays(30))
                        .clientName("SabaHub Client")
                        .testimonial("Delivery was sharp, collaborative, and reliable from kickoff to handoff.")
                        .build()
        );
    }

    private String resolveCompanyName(User user, String fallback) {
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName() + " Studio";
        }
        return fallback;
    }

    private String scopedKey(User user) {
        String basis = user.getId();
        if (basis == null || basis.isBlank()) {
            basis = user.getEmail();
        }
        if (basis == null || basis.isBlank()) {
            basis = "workspace";
        }
        return basis.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
    }

    private String slugify(String value) {
        return value.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
    }

    public record BootstrapResult(
            boolean createdAny,
            boolean employerSeeded,
            boolean freelancerSeeded,
            int supportUsersCreated,
            int employerProfilesCreated,
            int freelancerProfilesCreated,
            int jobsCreated,
            int proposalsCreated,
            int contractsCreated
    ) {}

    private record SeededFreelancer(User user, Freelancer freelancer) {}

    private record SeededEmployer(User user, Employer employer) {}

    private static final class SeedStats {
        private int supportUsersCreated;
        private int employerProfilesCreated;
        private int freelancerProfilesCreated;
        private int jobsCreated;
        private int proposalsCreated;
        private int contractsCreated;

        private boolean createdAny() {
            return supportUsersCreated > 0
                    || employerProfilesCreated > 0
                    || freelancerProfilesCreated > 0
                    || jobsCreated > 0
                    || proposalsCreated > 0
                    || contractsCreated > 0;
        }
    }
}
