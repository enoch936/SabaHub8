package com.sabahub.service;

import com.sabahub.domain.Contract;
import com.sabahub.domain.Freelancer;
import com.sabahub.domain.Job;
import com.sabahub.domain.Proposal;
import com.sabahub.domain.User;
import com.sabahub.domain.UserProfile;
import com.sabahub.repository.ContractRepository;
import com.sabahub.repository.EmployerRepository;
import com.sabahub.repository.FreelancerRepository;
import com.sabahub.repository.JobRepository;
import com.sabahub.repository.ProjectRepository;
import com.sabahub.repository.ProposalRepository;
import com.sabahub.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProposalServiceTest {

    @Mock
    private ProposalRepository proposalRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private EmployerRepository employerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FreelancerRepository freelancerRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private AuditService auditService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ProposalService proposalService;

    @BeforeEach
    void setUp() {
        lenient().when(employerRepository.findByUserId(anyString())).thenReturn(Optional.empty());
        lenient().when(employerRepository.findById(anyString())).thenReturn(Optional.empty());
        lenient().when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        lenient().when(freelancerRepository.findById(anyString())).thenReturn(Optional.empty());
        lenient().when(freelancerRepository.findByUserId(anyString())).thenReturn(Optional.empty());
    }

    @Test
    void listProposalViewsForEmployerJobRanksSubmittedProposalsByAiFit() {
        Job job = buildJob();
        Proposal weakProposal = buildProposal("proposal-weak", "freelancer-weak", 4500.0, 30,
                "I can help with this project.");
        Proposal strongProposal = buildProposal("proposal-strong", "freelancer-strong", 2200.0, 12,
                "I will deliver React TypeScript dashboards with API milestones, analytics acceptance checks, and weekly demos.");

        stubEmployerJob(job);
        stubFreelancer("freelancer-strong", List.of("React", "TypeScript", "API integration"), 4.8, 24, 96.0);
        stubFreelancer("freelancer-weak", List.of("Copywriting"), 3.8, 2, 55.0);
        when(proposalRepository.findByJobId("job-1")).thenReturn(List.of(weakProposal, strongProposal));

        List<ProposalService.ProposalView> views = proposalService.listProposalViewsForEmployerJob("job-1");

        assertThat(views).extracting(ProposalService.ProposalView::id)
                .containsExactly("proposal-strong", "proposal-weak");
        assertThat(views.get(0).aiRank()).isEqualTo(1);
        assertThat(views.get(0).aiScore()).isGreaterThan(views.get(1).aiScore());
        assertThat(views.get(0).aiReasons()).isNotEmpty();
    }

    @Test
    void acceptTopRankedProposalAcceptsHighestRankedEligibleProposal() {
        Job job = buildJob();
        Proposal weakProposal = buildProposal("proposal-weak", "freelancer-weak", 4500.0, 30,
                "I can help with this project.");
        Proposal strongProposal = buildProposal("proposal-strong", "freelancer-strong", 2200.0, 12,
                "I will deliver React TypeScript dashboards with API milestones, analytics acceptance checks, and weekly demos.");

        stubEmployerJob(job);
        stubFreelancer("freelancer-strong", List.of("React", "TypeScript", "API integration"), 4.8, 24, 96.0);
        stubFreelancer("freelancer-weak", List.of("Copywriting"), 3.8, 2, 55.0);
        when(proposalRepository.findByJobId("job-1")).thenReturn(List.of(weakProposal, strongProposal));
        when(proposalRepository.findById("proposal-strong")).thenReturn(Optional.of(strongProposal));
        when(contractRepository.findByJobIdAndFreelancerId("job-1", "freelancer-strong")).thenReturn(Optional.empty());
        when(contractRepository.findAllByJobId("job-1")).thenReturn(List.of());
        when(proposalRepository.save(any(Proposal.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> {
            Contract contract = invocation.getArgument(0);
            contract.setId("contract-1");
            return contract;
        });

        Contract contract = proposalService.acceptTopRankedProposal("job-1");

        assertThat(contract.getId()).isEqualTo("contract-1");
        assertThat(contract.getFreelancerId()).isEqualTo("freelancer-strong");
        assertThat(strongProposal.getStatus()).isEqualTo(Proposal.Status.ACCEPTED);
        assertThat(weakProposal.getStatus()).isEqualTo(Proposal.Status.SUBMITTED);
        verify(auditService).log(eq("PROPOSAL_AI_TOP_SELECTED"), eq("PROPOSAL"), eq("proposal-strong"), anyMap());
    }

    private void stubEmployerJob(Job job) {
        User employer = new User();
        employer.setId("employer-user");
        employer.setEmail("employer@sabahub.test");
        employer.setFullName("Employer User");

        when(currentUserService.requireUser()).thenReturn(employer);
        when(jobRepository.findById("job-1")).thenReturn(Optional.of(job));
        lenient().when(userRepository.findById("employer-user")).thenReturn(Optional.of(employer));
    }

    private void stubFreelancer(String userId,
                                List<String> skills,
                                double rating,
                                int completedProjects,
                                double successRate) {
        UserProfile profile = new UserProfile();
        profile.setSkills(skills);
        profile.setAverageRating(rating);
        profile.setCompletedProjects(completedProjects);
        profile.setSuccessRate(Math.round(successRate));
        profile.setYearsOfExperience(6);
        profile.setIdentityVerified(true);

        User user = new User();
        user.setId(userId);
        user.setEmail(userId + "@sabahub.test");
        user.setFullName(userId);
        user.setProfile(profile);

        Freelancer freelancer = Freelancer.builder()
                .id(userId + "-profile")
                .userId(userId)
                .skills(skills.stream()
                        .map(skill -> Freelancer.Skill.builder().name(skill).level("EXPERT").build())
                        .toList())
                .rating(rating)
                .completedProjects(completedProjects)
                .successRate(successRate)
                .yearsOfExperience(6)
                .identityVerified(true)
                .verificationStatus("VERIFIED")
                .build();

        when(freelancerRepository.findByUserId(userId)).thenReturn(Optional.of(freelancer));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    }

    private Job buildJob() {
        Job job = new Job();
        job.setId("job-1");
        job.setEmployerId("employer-user");
        job.setStatus(Job.Status.OPEN);
        job.setTitle("React TypeScript Analytics Dashboard");
        job.setDescription("Build a React dashboard with TypeScript, API integration, analytics charts, and milestone demos.");
        job.setRequiredSkills(List.of("React", "TypeScript", "API integration"));
        job.setSkills(List.of("Analytics", "Dashboard"));
        job.setBudgetMin(1500.0);
        job.setBudgetMax(3000.0);
        job.setSlaDeliveryDays(14);
        return job;
    }

    private Proposal buildProposal(String id, String freelancerId, double bidAmount, int timelineDays, String coverLetter) {
        Proposal proposal = new Proposal();
        proposal.setId(id);
        proposal.setJobId("job-1");
        proposal.setFreelancerId(freelancerId);
        proposal.setBidAmount(bidAmount);
        proposal.setTimelineDays(timelineDays);
        proposal.setCoverLetter(coverLetter);
        proposal.setStatus(Proposal.Status.SUBMITTED);
        return proposal;
    }
}
