package com.sabahub.service;

import com.sabahub.domain.Contract;
import com.sabahub.domain.Employer;
import com.sabahub.domain.Freelancer;
import com.sabahub.domain.FreelancerProjectPost;
import com.sabahub.domain.Gig;
import com.sabahub.domain.User;
import com.sabahub.domain.UserProfile;
import com.sabahub.repository.ContractRepository;
import com.sabahub.repository.EmployerRepository;
import com.sabahub.repository.FreelancerProjectPostRepository;
import com.sabahub.repository.FreelancerRepository;
import com.sabahub.repository.GigRepository;
import com.sabahub.repository.UserRepository;
import com.sabahub.web.dto.WorkspaceProfileDTOs.EmployerProfileUpdateRequest;
import com.sabahub.web.dto.WorkspaceProfileDTOs.EmployerWorkspaceProfile;
import com.sabahub.web.dto.WorkspaceProfileDTOs.ProfilePortfolioItem;
import com.sabahub.web.dto.WorkspaceProfileDTOs.ProfileReview;
import com.sabahub.web.dto.WorkspaceProfileDTOs.ProfileStats;
import com.sabahub.web.dto.WorkspaceProfileDTOs.ProfileTrustSignals;
import com.sabahub.web.dto.WorkspaceProfileDTOs.PublishedGig;
import com.sabahub.web.dto.WorkspaceProfileDTOs.PublishedProject;
import com.sabahub.web.dto.WorkspaceProfileDTOs.PublishedStory;
import com.sabahub.web.dto.WorkspaceProfileDTOs.WorkspaceProfileSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WorkspaceProfileService {

    private final EmployerRepository employerRepository;
    private final FreelancerRepository freelancerRepository;
    private final UserRepository userRepository;
    private final ContractRepository contractRepository;
    private final FreelancerProjectPostRepository freelancerProjectPostRepository;
    private final GigRepository gigRepository;
    private final CurrentUserService currentUserService;
    private final EmployerWorkspaceService employerWorkspaceService;

    public WorkspaceProfileSummary getFreelancerProfileSummary(String reference) {
        Freelancer freelancer = resolveFreelancer(reference);
        User user = resolveFreelancerUser(freelancer);

        Set<String> identityKeys = freelancerIdentityKeys(freelancer, user);
        List<ProfileReview> reviews = collectReviewsForTarget(identityKeys);
        List<Contract> contracts = collectContractsByParticipant(identityKeys, false);

        return new WorkspaceProfileSummary(
                "FREELANCER",
                freelancer.getId(),
                freelancer.getUserId(),
                firstNonBlank(
                        user != null ? user.getFullName() : null,
                        user != null ? user.getUsername() : null,
                        buildDisplayName(freelancer.getUserId()),
                        "Freelancer"
                ),
                firstNonBlank(freelancer.getProfessionalTitle(), "Freelancer"),
                firstNonBlank(freelancer.getBio(), user != null && user.getProfile() != null ? user.getProfile().getBio() : null),
                firstNonBlank(
                        freelancer.getProfilePicture(),
                        user != null && user.getProfile() != null ? user.getProfile().getProfilePictureUrl() : null
                ),
                freelancer.getCoverImage(),
                firstNonBlank(
                        freelancer.getLocation(),
                        user != null && user.getProfile() != null ? user.getProfile().getLocation() : null
                ),
                firstNonBlank(
                        freelancer.getTimezone(),
                        user != null && user.getProfile() != null ? user.getProfile().getTimezone() : null
                ),
                null,
                null,
                null,
                freelancer.getAvailability(),
                freelancer.getHourlyRate() != null ? freelancer.getHourlyRate().doubleValue() : null,
                firstNonBlank(freelancer.getCurrency(), "USD"),
                firstNonNull(freelancer.getCreatedAt(), toLocalDateTime(user != null ? user.getCreatedAt() : null)),
                buildFreelancerBadges(freelancer, reviews),
                freelancerSkillNames(freelancer, user),
                safeCopy(freelancer.getCategories()),
                safeCopy(freelancer.getLanguages()),
                buildFreelancerTrust(user, freelancer),
                buildFreelancerStats(freelancer, contracts, reviews),
                buildPortfolio(freelancer),
                reviews,
                buildPublishedProjects(identityKeys),
                buildPublishedGigs(identityKeys),
                buildPublishedStories(freelancer)
        );
    }

    public WorkspaceProfileSummary getEmployerProfileSummary(String reference) {
        Employer employer = resolveEmployer(reference);
        User user = resolveEmployerUser(employer);
        Employer.CompanyProfile companyProfile = ensureCompanyProfile(employer);

        Set<String> identityKeys = employerIdentityKeys(employer, user);
        List<ProfileReview> reviews = collectReviewsForTarget(identityKeys);
        List<Contract> contracts = collectContractsByParticipant(identityKeys, true);

        return new WorkspaceProfileSummary(
                "EMPLOYER",
                employer.getId(),
                employer.getUserId(),
                firstNonBlank(
                        companyProfile.getCompanyName(),
                        user != null ? user.getFullName() : null,
                        "Employer"
                ),
                firstNonBlank(companyProfile.getIndustry(), "Hiring team"),
                companyProfile.getDescription(),
                firstNonBlank(
                        companyProfile.getCompanyLogo(),
                        user != null && user.getProfile() != null ? user.getProfile().getProfilePictureUrl() : null
                ),
                null,
                joinLocation(companyProfile.getCity(), companyProfile.getCountry()),
                user != null && user.getProfile() != null ? user.getProfile().getTimezone() : null,
                companyProfile.getCompanyWebsite(),
                companyProfile.getIndustry(),
                companyProfile.getEmployeeCount(),
                null,
                null,
                null,
                firstNonNull(employer.getCreatedAt(), toLocalDateTime(user != null ? user.getCreatedAt() : null)),
                safeCopy(employer.getBadges()),
                List.of(),
                List.of(),
                List.of(),
                buildEmployerTrust(user, employer),
                buildEmployerStats(employer, contracts, reviews),
                List.of(),
                reviews,
                List.of(),
                List.of(),
                List.of()
        );
    }

    public EmployerWorkspaceProfile getCurrentEmployerWorkspaceProfile() {
        User user = currentUserService.requireUser();
        currentUserService.requireEmployerMode(user);

        Employer employer = employerWorkspaceService.getOrCreateEmployerForCurrentUser();
        User resolvedUser = resolveEmployerUser(employer);
        Employer.CompanyProfile companyProfile = ensureCompanyProfile(employer);
        Employer.PaymentMethod paymentMethod = ensurePaymentMethod(employer);

        Set<String> identityKeys = employerIdentityKeys(employer, resolvedUser);
        List<ProfileReview> reviews = collectReviewsForTarget(identityKeys);
        List<Contract> contracts = collectContractsByParticipant(identityKeys, true);

        return new EmployerWorkspaceProfile(
                employer.getId(),
                employer.getUserId(),
                companyProfile.getCompanyName(),
                companyProfile.getCompanyWebsite(),
                companyProfile.getCompanyLogo(),
                companyProfile.getIndustry(),
                companyProfile.getEmployeeCount(),
                companyProfile.getDescription(),
                companyProfile.getAddress(),
                companyProfile.getCity(),
                companyProfile.getCountry(),
                companyProfile.getTaxId(),
                companyProfile.getRegistrationNumber(),
                paymentMethod.getType(),
                paymentMethod.getAccountId(),
                paymentMethod.getCurrency(),
                firstNonNull(employer.getCreatedAt(), toLocalDateTime(resolvedUser != null ? resolvedUser.getCreatedAt() : null)),
                safeCopy(employer.getBadges()),
                buildEmployerTrust(resolvedUser, employer),
                buildEmployerStats(employer, contracts, reviews),
                reviews
        );
    }

    @Transactional
    public EmployerWorkspaceProfile updateCurrentEmployerProfile(EmployerProfileUpdateRequest request) {
        User user = currentUserService.requireUser();
        currentUserService.requireEmployerMode(user);

        Employer employer = employerWorkspaceService.getOrCreateEmployerForCurrentUser();
        Employer.CompanyProfile companyProfile = ensureCompanyProfile(employer);
        Employer.PaymentMethod paymentMethod = ensurePaymentMethod(employer);
        Employer.VerificationStatus verificationStatus = ensureVerificationStatus(employer, user);

        companyProfile.setCompanyName(normalizeOptional(request.companyName()));
        companyProfile.setCompanyWebsite(normalizeOptional(request.companyWebsite()));
        companyProfile.setCompanyLogo(normalizeOptional(request.companyLogo()));
        companyProfile.setIndustry(normalizeOptional(request.industry()));
        companyProfile.setEmployeeCount(request.employeeCount());
        companyProfile.setDescription(normalizeOptional(request.description()));
        companyProfile.setAddress(normalizeOptional(request.address()));
        companyProfile.setCity(normalizeOptional(request.city()));
        companyProfile.setCountry(normalizeOptional(request.country()));
        companyProfile.setTaxId(normalizeOptional(request.taxId()));
        companyProfile.setRegistrationNumber(normalizeOptional(request.registrationNumber()));

        paymentMethod.setType(normalizeOptional(request.paymentType()));
        paymentMethod.setAccountId(normalizeOptional(request.paymentAccountId()));
        paymentMethod.setCurrency(firstNonBlank(normalizeOptional(request.paymentCurrency()), paymentMethod.getCurrency(), "USD"));
        if (paymentMethod.getAddedAt() == null && hasText(paymentMethod.getAccountId())) {
            paymentMethod.setAddedAt(LocalDateTime.now());
        }
        if (paymentMethod.getIsDefault() == null) {
            paymentMethod.setIsDefault(Boolean.TRUE);
        }

        verificationStatus.setEmail(firstNonBlank(verificationStatus.getEmail(), user.getEmail()));
        if (hasText(paymentMethod.getAccountId()) || hasText(paymentMethod.getType())) {
            verificationStatus.setPaymentVerified(Boolean.TRUE);
        }

        employerRepository.save(employer);
        return getCurrentEmployerWorkspaceProfile();
    }

    private Employer resolveEmployer(String reference) {
        String normalized = normalizeOptional(reference);
        if (normalized == null) {
            throw new IllegalArgumentException("Employer reference is required");
        }

        return employerRepository.findById(normalized)
                .or(() -> employerRepository.findByUserId(normalized))
                .or(() -> userRepository.findById(normalized)
                        .flatMap(user -> employerRepository.findByUserId(user.getId())
                                .or(() -> employerRepository.findByUserId(user.getEmail()))))
                .or(() -> userRepository.findByEmailIgnoreCase(normalized)
                        .flatMap(user -> employerRepository.findByUserId(user.getId())
                                .or(() -> employerRepository.findByUserId(user.getEmail()))))
                .orElseThrow(() -> new IllegalArgumentException("Employer profile not found"));
    }

    private Freelancer resolveFreelancer(String reference) {
        String normalized = normalizeOptional(reference);
        if (normalized == null) {
            throw new IllegalArgumentException("Freelancer reference is required");
        }

        return freelancerRepository.findById(normalized)
                .or(() -> freelancerRepository.findByUserId(normalized))
                .or(() -> userRepository.findById(normalized)
                        .flatMap(user -> freelancerRepository.findByUserId(user.getId())
                                .or(() -> freelancerRepository.findByUserId(user.getEmail()))))
                .or(() -> userRepository.findByEmailIgnoreCase(normalized)
                        .flatMap(user -> freelancerRepository.findByUserId(user.getId())
                                .or(() -> freelancerRepository.findByUserId(user.getEmail()))))
                .orElseThrow(() -> new IllegalArgumentException("Freelancer profile not found"));
    }

    private User resolveEmployerUser(Employer employer) {
        if (employer == null || !hasText(employer.getUserId())) {
            return null;
        }

        return userRepository.findById(employer.getUserId())
                .or(() -> userRepository.findByEmailIgnoreCase(employer.getUserId()))
                .orElse(null);
    }

    private User resolveFreelancerUser(Freelancer freelancer) {
        if (freelancer == null || !hasText(freelancer.getUserId())) {
            return null;
        }

        return userRepository.findById(freelancer.getUserId())
                .or(() -> userRepository.findByEmailIgnoreCase(freelancer.getUserId()))
                .orElse(null);
    }

    private ProfileTrustSignals buildFreelancerTrust(User user, Freelancer freelancer) {
        UserProfile profile = user != null ? user.getProfile() : null;
        boolean emailVerified = Boolean.TRUE.equals(freelancer.getEmailVerified())
                || Boolean.TRUE.equals(profile != null ? profile.getEmailVerified() : null);
        boolean phoneVerified = Boolean.TRUE.equals(freelancer.getPhoneVerified())
                || Boolean.TRUE.equals(profile != null ? profile.getPhoneVerified() : null);
        boolean identityVerified = Boolean.TRUE.equals(freelancer.getIdentityVerified())
                || Boolean.TRUE.equals(profile != null ? profile.getIdentityVerified() : null)
                || Boolean.TRUE.equals(user != null ? user.isDocumentsVerified() : false);
        String kycStatus = firstNonBlank(freelancer.getVerificationStatus(), identityVerified ? "VERIFIED" : "PENDING");

        return new ProfileTrustSignals(
                emailVerified,
                phoneVerified,
                identityVerified,
                false,
                hasText(freelancer.getPaymentMethod()) || hasText(freelancer.getStripeConnectedAccountId()),
                Boolean.TRUE.equals(user != null ? user.isDocumentsVerified() : false),
                "VERIFIED".equalsIgnoreCase(kycStatus) || identityVerified,
                kycStatus
        );
    }

    private ProfileTrustSignals buildEmployerTrust(User user, Employer employer) {
        Employer.VerificationStatus verificationStatus = ensureVerificationStatus(employer, user);
        Employer.KYCVerification kycVerification = ensureKycVerification(employer);

        boolean documentsVerified = Boolean.TRUE.equals(user != null ? user.isDocumentsVerified() : false);
        boolean identityVerified = documentsVerified || "VERIFIED".equalsIgnoreCase(kycVerification.getStatus());

        return new ProfileTrustSignals(
                Boolean.TRUE.equals(verificationStatus.getEmailVerified()),
                Boolean.TRUE.equals(verificationStatus.getPhoneVerified()),
                identityVerified,
                Boolean.TRUE.equals(verificationStatus.getBusinessVerified()),
                Boolean.TRUE.equals(verificationStatus.getPaymentVerified())
                        || hasText(employer.getPaymentMethod() != null ? employer.getPaymentMethod().getAccountId() : null),
                documentsVerified,
                "VERIFIED".equalsIgnoreCase(kycVerification.getStatus()),
                firstNonBlank(kycVerification.getStatus(), "PENDING")
        );
    }

    private ProfileStats buildFreelancerStats(Freelancer freelancer, List<Contract> contracts, List<ProfileReview> reviews) {
        int completedContracts = (int) contracts.stream()
                .filter(contract -> contract.getStatus() == Contract.Status.COMPLETED)
                .count();
        int activeContracts = (int) contracts.stream()
                .filter(this::isActiveContract)
                .count();

        double rating = firstNonNullNumber(
                freelancer.getRating(),
                averageRating(reviews),
                0.0
        );
        int reviewCount = firstNonNullInt(freelancer.getReviewCount(), reviews.size());
        double totalEarnings = freelancer.getTotalEarnings() != null
                ? freelancer.getTotalEarnings().doubleValue()
                : contracts.stream()
                        .filter(contract -> contract.getStatus() == Contract.Status.COMPLETED)
                        .mapToDouble(contract -> contract.getPaidAmount() != null ? contract.getPaidAmount() : safe(contract.getTotalAmount()))
                        .sum();

        return new ProfileStats(
                firstNonNullInt(freelancer.getCompletedProjects(), completedContracts),
                firstNonNullInt(freelancer.getActiveProjects(), activeContracts),
                0,
                0,
                rating,
                reviewCount,
                null,
                totalEarnings,
                freelancer.getSuccessRate() != null ? freelancer.getSuccessRate().intValue() : null,
                freelancer.getJobSuccessScore()
        );
    }

    private ProfileStats buildEmployerStats(Employer employer, List<Contract> contracts, List<ProfileReview> reviews) {
        Employer.EmployerStats stats = employer.getStats();
        int completedContracts = (int) contracts.stream()
                .filter(contract -> contract.getStatus() == Contract.Status.COMPLETED)
                .count();
        int activeContracts = (int) contracts.stream()
                .filter(this::isActiveContract)
                .count();
        int uniqueHires = (int) contracts.stream()
                .map(Contract::getFreelancerId)
                .filter(this::hasText)
                .distinct()
                .count();

        return new ProfileStats(
                completedContracts,
                activeContracts,
                firstNonNullInt(stats != null ? stats.getTotalProjectsPosted() : null, 0),
                firstNonNullInt(stats != null ? stats.getTotalHired() : null, uniqueHires),
                firstNonNullNumber(stats != null ? stats.getRatingScore() : null, averageRating(reviews), 0.0),
                firstNonNullInt(stats != null ? stats.getRatingCount() : null, reviews.size()),
                firstNonNullNumber(stats != null ? stats.getTotalSpent() : null, contracts.stream()
                        .mapToDouble(contract -> contract.getPaidAmount() != null ? contract.getPaidAmount() : 0.0)
                        .sum(), 0.0),
                null,
                stats != null ? stats.getRepeatHireRate() : null,
                null
        );
    }

    private List<ProfilePortfolioItem> buildPortfolio(Freelancer freelancer) {
        if (freelancer.getPortfolio() == null || freelancer.getPortfolio().isEmpty()) {
            return List.of();
        }

        return freelancer.getPortfolio().stream()
                .filter(Objects::nonNull)
                .map(item -> new ProfilePortfolioItem(
                        item.getId(),
                        item.getTitle(),
                        item.getDescription(),
                        safeCopy(item.getImages()),
                        item.getProjectUrl(),
                        safeCopy(item.getTechnologies()),
                        item.getTestimonial(),
                        item.getCompletedAt()
                ))
                .toList();
    }

    private List<PublishedProject> buildPublishedProjects(Set<String> identityKeys) {
        if (identityKeys == null || identityKeys.isEmpty()) {
            return List.of();
        }

        return freelancerProjectPostRepository.findVisibleByStatusOrderByUpdatedAtDesc(FreelancerProjectPost.Status.PUBLISHED).stream()
                .filter(Objects::nonNull)
                .filter(post -> identityKeys.contains(normalizeKey(post.getFreelancerId())))
                .map(post -> new PublishedProject(
                        post.getId(),
                        post.getTitle(),
                        post.getDescription(),
                        post.getCategory(),
                        safeCopy(post.getSkills()),
                        post.getBudgetMin(),
                        post.getBudgetMax(),
                        post.getCurrency(),
                        post.getDeliveryDays(),
                        post.getThumbnailUrl(),
                        safeCopy(post.getSampleImageUrls()),
                        safeCopy(post.getSampleVideoUrls()),
                        safeCopy(post.getSampleDocumentUrls()),
                        toLocalDateTime(firstNonNull(post.getUpdatedAt(), post.getCreatedAt()))
                ))
                .toList();
    }

    private List<PublishedGig> buildPublishedGigs(Set<String> identityKeys) {
        if (identityKeys == null || identityKeys.isEmpty()) {
            return List.of();
        }

        return gigRepository.findVisibleByStatusOrderByUpdatedAtDesc(Gig.Status.PUBLISHED).stream()
                .filter(Objects::nonNull)
                .filter(gig -> identityKeys.contains(normalizeKey(gig.getFreelancerId())))
                .map(gig -> new PublishedGig(
                        gig.getId(),
                        gig.getTitle(),
                        gig.getDescription(),
                        safeCopy(gig.getSkills()),
                        gig.getPrice(),
                        gig.getCurrency(),
                        gig.getDeliveryDays(),
                        gig.getThumbnailUrl(),
                        safeCopy(gig.getSampleImageUrls()),
                        safeCopy(gig.getSampleVideoUrls()),
                        safeCopy(gig.getSampleDocumentUrls()),
                        toLocalDateTime(firstNonNull(gig.getUpdatedAt(), gig.getCreatedAt()))
                ))
                .toList();
    }

    private List<PublishedStory> buildPublishedStories(Freelancer freelancer) {
        if (freelancer == null || freelancer.getPortfolio() == null || freelancer.getPortfolio().isEmpty()) {
            return List.of();
        }

        return freelancer.getPortfolio().stream()
                .filter(Objects::nonNull)
                .filter(item -> hasText(item.getTitle())
                        || hasText(item.getDescription())
                        || hasText(item.getProjectUrl())
                        || hasAnyText(item.getImages()))
                .sorted(Comparator.comparing(
                        Freelancer.PortfolioItem::getCompletedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .map(item -> new PublishedStory(
                        firstNonBlank(
                                item.getId(),
                                "story-" + Math.abs(Objects.hash(
                                        firstNonBlank(item.getTitle(), ""),
                                        firstNonBlank(item.getProjectUrl(), ""),
                                        firstNonBlank(item.getDescription(), "")
                                ))
                        ),
                        firstNonBlank(item.getTitle(), "Portfolio Story"),
                        item.getDescription(),
                        item.getCategory(),
                        safeCopy(item.getTechnologies()),
                        safeCopy(item.getImages()),
                        item.getProjectUrl(),
                        item.getCompletedAt()
                ))
                .toList();
    }

    private List<ProfileReview> collectReviewsForTarget(Set<String> targetIds) {
        if (targetIds.isEmpty()) {
            return List.of();
        }

        return employerRepository.findAll().stream()
                .filter(Objects::nonNull)
                .flatMap(employer -> {
                    List<Employer.EmployerReview> reviews = employer.getReviews();
                    return reviews == null ? java.util.stream.Stream.<Employer.EmployerReview>empty() : reviews.stream();
                })
                .filter(Objects::nonNull)
                .filter(review -> targetIds.contains(normalizeKey(review.getTargetId())))
                .sorted(Comparator.comparing(
                        Employer.EmployerReview::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .map(review -> new ProfileReview(
                        review.getId(),
                        review.getContractId(),
                        review.getReviewerId(),
                        review.getReviewerName(),
                        review.getReviewerAvatar(),
                        review.getRating(),
                        review.getComment(),
                        review.getSentiment(),
                        Boolean.TRUE.equals(review.getVerified()),
                        review.getCreatedAt(),
                        review.getTags() == null ? List.of() : List.copyOf(review.getTags())
                ))
                .toList();
    }

    private List<Contract> collectContractsByParticipant(Set<String> identityKeys, boolean employerSide) {
        if (identityKeys.isEmpty()) {
            return List.of();
        }

        return contractRepository.findAll().stream()
                .filter(Objects::nonNull)
                .filter(contract -> identityKeys.contains(normalizeKey(employerSide ? contract.getEmployerId() : contract.getFreelancerId())))
                .toList();
    }

    private Set<String> freelancerIdentityKeys(Freelancer freelancer, User user) {
        LinkedHashSet<String> keys = new LinkedHashSet<>();
        addIdentityKey(keys, freelancer != null ? freelancer.getId() : null);
        addIdentityKey(keys, freelancer != null ? freelancer.getUserId() : null);
        addIdentityKey(keys, user != null ? user.getId() : null);
        addIdentityKey(keys, user != null ? user.getEmail() : null);
        return keys;
    }

    private Set<String> employerIdentityKeys(Employer employer, User user) {
        LinkedHashSet<String> keys = new LinkedHashSet<>();
        addIdentityKey(keys, employer != null ? employer.getId() : null);
        addIdentityKey(keys, employer != null ? employer.getUserId() : null);
        addIdentityKey(keys, user != null ? user.getId() : null);
        addIdentityKey(keys, user != null ? user.getEmail() : null);
        return keys;
    }

    private void addIdentityKey(Set<String> keys, String value) {
        String normalized = normalizeKey(value);
        if (normalized != null) {
            keys.add(normalized);
        }
    }

    private List<String> freelancerSkillNames(Freelancer freelancer, User user) {
        List<String> skills = new ArrayList<>();
        if (freelancer.getSkills() != null) {
            freelancer.getSkills().stream()
                    .filter(Objects::nonNull)
                    .map(Freelancer.Skill::getName)
                    .filter(this::hasText)
                    .map(String::trim)
                    .forEach(skills::add);
        }

        if (skills.isEmpty() && user != null && user.getProfile() != null && user.getProfile().getSkills() != null) {
            user.getProfile().getSkills().stream()
                    .filter(this::hasText)
                    .map(String::trim)
                    .forEach(skills::add);
        }

        return skills.stream().distinct().toList();
    }

    private List<String> buildFreelancerBadges(Freelancer freelancer, List<ProfileReview> reviews) {
        LinkedHashSet<String> badges = new LinkedHashSet<>();
        String verificationStatus = firstNonBlank(freelancer.getVerificationStatus(), "");
        if ("VERIFIED".equalsIgnoreCase(verificationStatus) || Boolean.TRUE.equals(freelancer.getIdentityVerified())) {
            badges.add("Verified");
        }
        double rating = firstNonNullNumber(freelancer.getRating(), averageRating(reviews), 0.0);
        int reviewCount = firstNonNullInt(freelancer.getReviewCount(), reviews.size());
        if (rating >= 4.7 && reviewCount >= 5) {
            badges.add("Top Rated");
        }
        if (freelancer.getSuccessRate() != null && freelancer.getSuccessRate() >= 90.0) {
            badges.add("High Success");
        }
        return List.copyOf(badges);
    }

    private boolean isActiveContract(Contract contract) {
        return contract.getStatus() == Contract.Status.ACTIVE
                || contract.getStatus() == Contract.Status.IN_PROGRESS
                || contract.getStatus() == Contract.Status.DELIVERED;
    }

    private double averageRating(List<ProfileReview> reviews) {
        if (reviews == null || reviews.isEmpty()) {
            return 0.0;
        }
        return reviews.stream()
                .map(ProfileReview::rating)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);
    }

    private Employer.CompanyProfile ensureCompanyProfile(Employer employer) {
        if (employer.getCompanyProfile() == null) {
            employer.setCompanyProfile(Employer.CompanyProfile.builder().build());
        }
        return employer.getCompanyProfile();
    }

    private Employer.PaymentMethod ensurePaymentMethod(Employer employer) {
        if (employer.getPaymentMethod() == null) {
            employer.setPaymentMethod(Employer.PaymentMethod.builder().isDefault(Boolean.TRUE).currency("USD").build());
        }
        return employer.getPaymentMethod();
    }

    private Employer.VerificationStatus ensureVerificationStatus(Employer employer, User user) {
        if (employer.getVerificationStatus() == null) {
            employer.setVerificationStatus(Employer.VerificationStatus.builder()
                    .email(user != null ? user.getEmail() : null)
                    .emailVerified(Boolean.FALSE)
                    .phoneVerified(Boolean.FALSE)
                    .businessVerified(Boolean.FALSE)
                    .paymentVerified(Boolean.FALSE)
                    .build());
        }
        return employer.getVerificationStatus();
    }

    private Employer.KYCVerification ensureKycVerification(Employer employer) {
        if (employer.getKycVerification() == null) {
            employer.setKycVerification(Employer.KYCVerification.builder().status("PENDING").build());
        }
        return employer.getKycVerification();
    }

    private String joinLocation(String city, String country) {
        if (!hasText(city) && !hasText(country)) {
            return null;
        }
        if (!hasText(city)) {
            return country.trim();
        }
        if (!hasText(country)) {
            return city.trim();
        }
        return city.trim() + ", " + country.trim();
    }

    private String buildDisplayName(String userId) {
        if (!hasText(userId)) {
            return "Freelancer";
        }

        String raw = userId.contains("@") ? userId.substring(0, userId.indexOf('@')) : userId;
        String normalized = raw.replaceAll("[._-]+", " ").trim().replaceAll("\\s+", " ");
        if (normalized.isBlank()) {
            return "Freelancer";
        }

        StringBuilder builder = new StringBuilder();
        for (String part : normalized.split(" ")) {
            if (part.isBlank()) {
                continue;
            }
            if (!builder.isEmpty()) {
                builder.append(' ');
            }
            builder.append(part.substring(0, 1).toUpperCase(Locale.ROOT));
            if (part.length() > 1) {
                builder.append(part.substring(1).toLowerCase(Locale.ROOT));
            }
        }
        return builder.toString();
    }

    private LocalDateTime toLocalDateTime(Instant value) {
        return value == null ? null : LocalDateTime.ofInstant(value, ZoneOffset.UTC);
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String normalizeKey(String value) {
        String normalized = normalizeOptional(value);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }

    private boolean hasText(String value) {
        return normalizeOptional(value) != null;
    }

    private boolean hasAnyText(List<String> values) {
        return values != null && values.stream().anyMatch(this::hasText);
    }

    private double safe(Double value) {
        return value == null ? 0.0 : value;
    }

    private <T> List<T> safeCopy(List<T> value) {
        return value == null || value.isEmpty() ? List.of() : List.copyOf(value);
    }

    @SafeVarargs
    private final <T> T firstNonNull(T... values) {
        for (T value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private Integer firstNonNullInt(Integer primary, Integer fallback) {
        return primary != null ? primary : fallback;
    }

    private Double firstNonNullNumber(Double primary, Double fallback, Double defaultValue) {
        if (primary != null) {
            return primary;
        }
        if (fallback != null) {
            return fallback;
        }
        return defaultValue;
    }
}
