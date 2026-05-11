package com.sabahub.web;

import com.sabahub.domain.Contract;
import com.sabahub.domain.Employer;
import com.sabahub.domain.Freelancer;
import com.sabahub.domain.Job;
import com.sabahub.domain.Project;
import com.sabahub.domain.Proposal;
import com.sabahub.domain.User;
import com.sabahub.repository.ContractRepository;
import com.sabahub.repository.EmployerRepository;
import com.sabahub.repository.FreelancerRepository;
import com.sabahub.repository.JobRepository;
import com.sabahub.repository.ProjectRepository;
import com.sabahub.repository.ProposalRepository;
import com.sabahub.repository.UserRepository;
import com.sabahub.service.CurrentUserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/freelancer/workspace")
public class FreelancerWorkspaceController {

    private static final DateTimeFormatter MONTH_LABEL_FORMAT = DateTimeFormatter.ofPattern("MMM yyyy");

    private final CurrentUserService currentUserService;
    private final ContractRepository contractRepository;
    private final ProposalRepository proposalRepository;
    private final JobRepository jobRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final FreelancerRepository freelancerRepository;
    private final EmployerRepository employerRepository;

    public FreelancerWorkspaceController(CurrentUserService currentUserService,
                                         ContractRepository contractRepository,
                                         ProposalRepository proposalRepository,
                                         JobRepository jobRepository,
                                         ProjectRepository projectRepository,
                                         UserRepository userRepository,
                                         FreelancerRepository freelancerRepository,
                                         EmployerRepository employerRepository) {
        this.currentUserService = currentUserService;
        this.contractRepository = contractRepository;
        this.proposalRepository = proposalRepository;
        this.jobRepository = jobRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.freelancerRepository = freelancerRepository;
        this.employerRepository = employerRepository;
    }

    @GetMapping("/analytics")
    public FreelancerAnalyticsResponse analytics() {
        WorkspaceSnapshot snapshot = loadSnapshot();
        Freelancer freelancer = snapshot.freelancer();

        long completedProjects = snapshot.contracts().stream()
                .filter(c -> c.getStatus() == Contract.Status.COMPLETED)
                .count();
        long activeProjects = snapshot.contracts().stream()
                .filter(c -> c.getStatus() == Contract.Status.ACTIVE || c.getStatus() == Contract.Status.IN_PROGRESS || c.getStatus() == Contract.Status.DELIVERED)
                .count();

        double totalEarnings = snapshot.contracts().stream()
                .filter(c -> c.getStatus() == Contract.Status.COMPLETED)
                .mapToDouble(c -> c.getTotalAmount() == null ? 0.0 : c.getTotalAmount())
                .sum();

        double pendingBalance = snapshot.contracts().stream()
                .filter(c -> c.getStatus() == Contract.Status.ACTIVE || c.getStatus() == Contract.Status.IN_PROGRESS || c.getStatus() == Contract.Status.DELIVERED)
                .mapToDouble(c -> c.getTotalAmount() == null ? 0.0 : c.getTotalAmount())
                .sum();

        long totalProposals = snapshot.proposals().size();
        long acceptedProposals = snapshot.proposals().stream()
                .filter(p -> p.getStatus() == Proposal.Status.ACCEPTED)
                .count();

        double successRate = totalProposals == 0 ? 0.0 : (acceptedProposals * 100.0) / totalProposals;
        double currentBalance = freelancer != null && freelancer.getCurrentBalance() != null
                ? freelancer.getCurrentBalance().doubleValue()
                : totalEarnings;
        double effectivePendingBalance = freelancer != null && freelancer.getPendingBalance() != null
                ? freelancer.getPendingBalance().doubleValue()
                : pendingBalance;
        double rating = freelancer != null && freelancer.getRating() != null ? freelancer.getRating() : 0.0;
        int reviewCount = freelancer != null && freelancer.getReviewCount() != null ? freelancer.getReviewCount() : 0;
        double jobSuccessScore = freelancer != null && freelancer.getJobSuccessScore() != null
                ? freelancer.getJobSuccessScore()
                : successRate;

        return new FreelancerAnalyticsResponse(
                totalEarnings,
                currentBalance,
                effectivePendingBalance,
                (int) completedProjects,
                (int) activeProjects,
                (int) totalProposals,
                (int) acceptedProposals,
                successRate,
                rating,
                reviewCount,
                jobSuccessScore,
                buildMonthlyEarnings(snapshot.contracts())
        );
    }

    @GetMapping("/contracts")
    public List<ContractSummary> contracts() {
        WorkspaceSnapshot snapshot = loadSnapshot();
        Map<String, WorkspaceReference> referenceCache = new LinkedHashMap<>();
        Map<String, String> employerNameCache = new LinkedHashMap<>();

        return snapshot.contracts().stream()
                .sorted(Comparator.comparing(this::sortInstantForContract).reversed())
                .map(contract -> {
                    WorkspaceReference reference = resolveReference(contract.getJobId(), contract.getProjectId(), referenceCache);
                    String projectTitle = contract.getTitle() != null && !contract.getTitle().isBlank()
                            ? contract.getTitle()
                            : (reference.title() != null ? reference.title() : "Contract");
                    String employerName = resolveEmployerName(
                            firstNonBlank(contract.getEmployerId(), reference.employerId()),
                            reference.companyName(),
                            employerNameCache
                    );
                    String startDate = firstNonNullDate(contract.getStartDate(), contract.getCreatedAt());
                    String deadline = firstNonNullDate(contract.getEndDate(), contract.getStartDate(), contract.getCreatedAt());
                    String workType = firstNonBlank(contract.getWorkType(), reference.workType(), "N/A");
                    double hourlyRate = resolveHourlyRate(reference, snapshot.freelancer());

                    return new ContractSummary(
                            contract.getId(),
                            projectTitle,
                            employerName,
                            contract.getStatus() != null ? contract.getStatus().name() : "UNKNOWN",
                            contract.getTotalAmount() == null ? 0.0 : contract.getTotalAmount(),
                            startDate,
                            deadline,
                            workType,
                            hourlyRate
                    );
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/proposals")
    public List<ProposalSummary> proposals() {
        WorkspaceSnapshot snapshot = loadSnapshot();
        Map<String, WorkspaceReference> referenceCache = new LinkedHashMap<>();
        Map<String, String> employerNameCache = new LinkedHashMap<>();

        return snapshot.proposals().stream()
                .sorted(Comparator.comparing(this::sortInstantForProposal).reversed())
                .map(proposal -> {
                    WorkspaceReference reference = resolveReference(proposal.getJobId(), null, referenceCache);
                    String employerName = resolveEmployerName(
                            reference.employerId(),
                            reference.companyName(),
                            employerNameCache
                    );

                    return new ProposalSummary(
                            proposal.getId(),
                            Optional.ofNullable(reference.title()).orElse("Job " + proposal.getJobId()),
                            employerName,
                            proposal.getBidAmount() == null ? 0.0 : proposal.getBidAmount(),
                            proposal.getStatus() != null ? proposal.getStatus().name() : "SUBMITTED",
                            proposal.getCreatedAt() != null ? proposal.getCreatedAt().toString() : null
                    );
                })
                .collect(Collectors.toList());
    }

    private WorkspaceSnapshot loadSnapshot() {
        User me = currentUserService.requireUser();
        currentUserService.requireRole(me, "FREELANCER");

        Freelancer freelancer = resolveFreelancerProfile(me).orElse(null);
        Set<String> freelancerKeys = resolveFreelancerKeys(me, freelancer);

        List<Contract> contracts = collectDistinct(
                freelancerKeys,
                contractRepository::findByFreelancerId,
                Contract::getId
        );
        List<Proposal> proposals = collectDistinct(
                freelancerKeys,
                proposalRepository::findByFreelancerId,
                Proposal::getId
        );

        return new WorkspaceSnapshot(freelancer, contracts, proposals);
    }

    private Optional<Freelancer> resolveFreelancerProfile(User me) {
        if (me.getId() != null && !me.getId().isBlank()) {
            Optional<Freelancer> byUserId = freelancerRepository.findByUserId(me.getId());
            if (byUserId.isPresent()) {
                return byUserId;
            }
        }
        if (me.getEmail() != null && !me.getEmail().isBlank()) {
            return freelancerRepository.findByUserId(me.getEmail());
        }
        return Optional.empty();
    }

    private Set<String> resolveFreelancerKeys(User me, Freelancer freelancer) {
        LinkedHashSet<String> keys = new LinkedHashSet<>();
        addIfPresent(keys, me.getId());
        addIfPresent(keys, me.getEmail());
        if (freelancer != null) {
            addIfPresent(keys, freelancer.getId());
            addIfPresent(keys, freelancer.getUserId());
        }
        return keys;
    }

    private <T> List<T> collectDistinct(Set<String> keys,
                                        Function<String, List<T>> finder,
                                        Function<T, String> idExtractor) {
        Map<String, T> unique = new LinkedHashMap<>();
        for (String key : keys) {
            for (T item : finder.apply(key)) {
                String id = idExtractor.apply(item);
                if (id != null && !id.isBlank()) {
                    unique.putIfAbsent(id, item);
                }
            }
        }
        return new ArrayList<>(unique.values());
    }

    private String resolveEmployerName(String employerId,
                                       String fallbackCompanyName,
                                       Map<String, String> employerNameCache) {
        if (employerId == null || employerId.isBlank()) {
            return fallbackCompanyName != null && !fallbackCompanyName.isBlank() ? fallbackCompanyName : "Employer";
        }
        if (employerNameCache.containsKey(employerId)) {
            return employerNameCache.get(employerId);
        }

        String resolved = userRepository.findById(employerId)
                .map(user -> {
                    if (user.getFullName() != null && !user.getFullName().isBlank()) {
                        return user.getFullName();
                    }
                    if (user.getUsername() != null && !user.getUsername().isBlank()) {
                        return "@" + user.getUsername();
                    }
                    return employerId;
                })
                .orElseGet(() -> employerRepository.findById(employerId)
                        .map(this::extractCompanyName)
                        .filter(name -> !name.isBlank())
                        .orElseGet(() -> employerRepository.findByUserId(employerId)
                                .map(this::extractCompanyName)
                                .filter(name -> !name.isBlank())
                                .orElseGet(() -> fallbackCompanyName != null && !fallbackCompanyName.isBlank()
                                        ? fallbackCompanyName
                                        : employerId)));

        employerNameCache.put(employerId, resolved);
        return resolved;
    }

    private String extractCompanyName(Employer employer) {
        if (employer == null || employer.getCompanyProfile() == null) {
            return "";
        }
        return employer.getCompanyProfile().getCompanyName() != null
                ? employer.getCompanyProfile().getCompanyName()
                : "";
    }

    private WorkspaceReference resolveReference(String jobId,
                                               String projectId,
                                               Map<String, WorkspaceReference> cache) {
        String cacheKey = firstNonBlank(jobId, projectId);
        if (cacheKey != null && cache.containsKey(cacheKey)) {
            return cache.get(cacheKey);
        }

        WorkspaceReference resolved = lookupJobReference(jobId)
                .or(() -> lookupProjectReference(jobId))
                .or(() -> lookupProjectReference(projectId))
                .or(() -> lookupJobReference(projectId))
                .orElse(WorkspaceReference.EMPTY);

        if (cacheKey != null) {
            cache.put(cacheKey, resolved);
        }
        return resolved;
    }

    private Optional<WorkspaceReference> lookupJobReference(String jobId) {
        if (jobId == null || jobId.isBlank()) {
            return Optional.empty();
        }
        return jobRepository.findById(jobId)
                .map(job -> new WorkspaceReference(
                        blankToNull(job.getTitle()),
                        blankToNull(job.getEmployerId()),
                        blankToNull(job.getCompanyName()),
                        job.getPricingModel() != null ? job.getPricingModel().name() : null,
                        extractHourlyRate(job)
                ));
    }

    private Optional<WorkspaceReference> lookupProjectReference(String projectId) {
        if (projectId == null || projectId.isBlank()) {
            return Optional.empty();
        }
        return projectRepository.findById(projectId)
                .map(project -> new WorkspaceReference(
                        blankToNull(project.getTitle()),
                        blankToNull(project.getEmployerId()),
                        null,
                        project.getProjectType() != null ? blankToNull(project.getProjectType().getType()) : null,
                        extractHourlyRate(project)
                ));
    }

    private Double extractHourlyRate(Job job) {
        if (job == null || job.getPricingModel() != Job.PricingModel.HOURLY) {
            return null;
        }
        if (job.getRateBreakdown() != null) {
            Double explicitHourly = firstNonNull(job.getRateBreakdown().get("hourly"), job.getRateBreakdown().get("hourlyRate"));
            if (explicitHourly != null) {
                return explicitHourly;
            }
        }
        return firstNonNull(job.getBudgetMax(), job.getBudgetMin());
    }

    private Double extractHourlyRate(Project project) {
        if (project == null || project.getProjectType() == null || !"HOURLY".equalsIgnoreCase(project.getProjectType().getType())) {
            return null;
        }
        if (project.getBudget() == null) {
            return null;
        }
        return firstNonNull(project.getBudget().getMaxAmount(), project.getBudget().getMinAmount());
    }

    private double resolveHourlyRate(WorkspaceReference reference, Freelancer freelancer) {
        if (reference.hourlyRate() != null) {
            return reference.hourlyRate();
        }
        if (freelancer != null && freelancer.getHourlyRate() != null) {
            return freelancer.getHourlyRate().doubleValue();
        }
        return 0.0;
    }

    private String firstNonNullDate(LocalDateTime primary, LocalDateTime fallback, Instant createdAt) {
        if (primary != null) {
            return primary.toString();
        }
        if (fallback != null) {
            return fallback.toString();
        }
        return createdAt != null ? createdAt.toString() : null;
    }

    private String firstNonNullDate(LocalDateTime primary, Instant fallback) {
        if (primary != null) {
            return primary.toString();
        }
        return fallback != null ? fallback.toString() : null;
    }

    private List<MonthlyEarning> buildMonthlyEarnings(List<Contract> contracts) {
        Map<YearMonth, MonthlyAggregate> monthly = new LinkedHashMap<>();

        contracts.stream()
                .filter(contract -> contract.getStatus() == Contract.Status.COMPLETED)
                .forEach(contract -> {
                    YearMonth bucket = resolveMonth(contract);
                    MonthlyAggregate aggregate = monthly.computeIfAbsent(bucket, ignored -> new MonthlyAggregate());
                    aggregate.amount += contract.getTotalAmount() == null ? 0.0 : contract.getTotalAmount();
                    aggregate.projectCount += 1;
                });

        return monthly.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new MonthlyEarning(
                        entry.getKey().format(MONTH_LABEL_FORMAT),
                        entry.getValue().amount,
                        entry.getValue().projectCount
                ))
                .collect(Collectors.toList());
    }

    private YearMonth resolveMonth(Contract contract) {
        if (contract.getCompletedAt() != null) {
            return YearMonth.from(contract.getCompletedAt());
        }
        if (contract.getEndDate() != null) {
            return YearMonth.from(contract.getEndDate());
        }
        if (contract.getUpdatedAt() != null) {
            return YearMonth.from(contract.getUpdatedAt().atZone(ZoneOffset.UTC));
        }
        if (contract.getAcceptedAt() != null) {
            return YearMonth.from(contract.getAcceptedAt());
        }
        if (contract.getCreatedAt() != null) {
            return YearMonth.from(contract.getCreatedAt().atZone(ZoneOffset.UTC));
        }
        return YearMonth.now(ZoneOffset.UTC);
    }

    private Instant sortInstantForContract(Contract contract) {
        if (contract.getUpdatedAt() != null) {
            return contract.getUpdatedAt();
        }
        if (contract.getCreatedAt() != null) {
            return contract.getCreatedAt();
        }
        if (contract.getEndDate() != null) {
            return contract.getEndDate().toInstant(ZoneOffset.UTC);
        }
        if (contract.getStartDate() != null) {
            return contract.getStartDate().toInstant(ZoneOffset.UTC);
        }
        return Instant.EPOCH;
    }

    private Instant sortInstantForProposal(Proposal proposal) {
        if (proposal.getUpdatedAt() != null) {
            return proposal.getUpdatedAt();
        }
        if (proposal.getCreatedAt() != null) {
            return proposal.getCreatedAt();
        }
        return Instant.EPOCH;
    }

    private void addIfPresent(Set<String> values, String candidate) {
        if (candidate != null && !candidate.isBlank()) {
            values.add(candidate);
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private Double firstNonNull(Double... values) {
        for (Double value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private record WorkspaceSnapshot(Freelancer freelancer, List<Contract> contracts, List<Proposal> proposals) {}

    private record WorkspaceReference(String title,
                                      String employerId,
                                      String companyName,
                                      String workType,
                                      Double hourlyRate) {
        private static final WorkspaceReference EMPTY = new WorkspaceReference(null, null, null, null, null);
    }

    private static class MonthlyAggregate {
        private double amount;
        private int projectCount;
    }

    public static class FreelancerAnalyticsResponse {
        public double totalEarnings;
        public double currentBalance;
        public double pendingBalance;
        public int completedProjects;
        public int activeProjects;
        public int totalProposals;
        public int acceptedProposals;
        public double successRate;
        public double rating;
        public int reviewCount;
        public double jobSuccessScore;
        public List<MonthlyEarning> monthlyEarnings;

        public FreelancerAnalyticsResponse(double totalEarnings,
                                           double currentBalance,
                                           double pendingBalance,
                                           int completedProjects,
                                           int activeProjects,
                                           int totalProposals,
                                           int acceptedProposals,
                                           double successRate,
                                           double rating,
                                           int reviewCount,
                                           double jobSuccessScore,
                                           List<MonthlyEarning> monthlyEarnings) {
            this.totalEarnings = totalEarnings;
            this.currentBalance = currentBalance;
            this.pendingBalance = pendingBalance;
            this.completedProjects = completedProjects;
            this.activeProjects = activeProjects;
            this.totalProposals = totalProposals;
            this.acceptedProposals = acceptedProposals;
            this.successRate = successRate;
            this.rating = rating;
            this.reviewCount = reviewCount;
            this.jobSuccessScore = jobSuccessScore;
            this.monthlyEarnings = monthlyEarnings;
        }
    }

    public static class ContractSummary {
        public String id;
        public String projectTitle;
        public String employerName;
        public String status;
        public double totalAmount;
        public String startDate;
        public String deadline;
        public String workType;
        public double hourlyRate;

        public ContractSummary(String id,
                               String projectTitle,
                               String employerName,
                               String status,
                               double totalAmount,
                               String startDate,
                               String deadline,
                               String workType,
                               double hourlyRate) {
            this.id = id;
            this.projectTitle = projectTitle;
            this.employerName = employerName;
            this.status = status;
            this.totalAmount = totalAmount;
            this.startDate = startDate;
            this.deadline = deadline;
            this.workType = workType;
            this.hourlyRate = hourlyRate;
        }
    }

    public static class MonthlyEarning {
        public String month;
        public double amount;
        public int projectCount;

        public MonthlyEarning(String month, double amount, int projectCount) {
            this.month = month;
            this.amount = amount;
            this.projectCount = projectCount;
        }
    }

    public static class ProposalSummary {
        public String id;
        public String projectTitle;
        public String employerName;
        public double bidAmount;
        public String status;
        public String submittedAt;

        public ProposalSummary(String id,
                               String projectTitle,
                               String employerName,
                               double bidAmount,
                               String status,
                               String submittedAt) {
            this.id = id;
            this.projectTitle = projectTitle;
            this.employerName = employerName;
            this.bidAmount = bidAmount;
            this.status = status;
            this.submittedAt = submittedAt;
        }
    }
}
