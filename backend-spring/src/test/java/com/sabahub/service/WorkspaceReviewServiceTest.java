package com.sabahub.service;

import com.sabahub.domain.Contract;
import com.sabahub.domain.Employer;
import com.sabahub.domain.Freelancer;
import com.sabahub.domain.User;
import com.sabahub.repository.ContractRepository;
import com.sabahub.repository.EmployerRepository;
import com.sabahub.repository.FreelancerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkspaceReviewServiceTest {

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private EmployerWorkspaceService employerWorkspaceService;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private EmployerRepository employerRepository;

    @Mock
    private FreelancerRepository freelancerRepository;

    @InjectMocks
    private WorkspaceReviewService workspaceReviewService;

    @BeforeEach
    void setUp() {
        when(employerRepository.findByUserId(anyString())).thenReturn(Optional.empty());
        when(freelancerRepository.findByUserId(anyString())).thenReturn(Optional.empty());
        when(freelancerRepository.findById(anyString())).thenReturn(Optional.empty());
    }

    @Test
    void addReview_rejectsContractThatIsNotCompleted() {
        User user = user("user-1");
        Contract contract = contract("contract-1", Contract.Status.ACTIVE, "user-1", "freelancer-1");

        when(currentUserService.requireUser()).thenReturn(user);
        when(currentUserService.getActiveWorkspaceRole()).thenReturn("EMPLOYER");
        when(contractRepository.findById("contract-1")).thenReturn(Optional.of(contract));

        EmployerWorkspaceService.ReviewCreateRequest request = new EmployerWorkspaceService.ReviewCreateRequest(
                "contract-1",
                "freelancer-1",
                5,
                "Great work",
                List.of("quality")
        );

        assertThatThrownBy(() -> workspaceReviewService.addReview(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Reviews are only available for completed contracts.");

        verify(employerWorkspaceService, never()).addReview(request);
    }

    @Test
    void addReview_rejectsDuplicateReviewForSameReviewerAndContract() {
        User user = user("user-1");
        Contract contract = contract("contract-2", Contract.Status.COMPLETED, "user-1", "freelancer-2");
        Employer reviewerWorkspace = Employer.builder()
                .id("emp-1")
                .reviews(new ArrayList<>(List.of(
                        Employer.EmployerReview.builder()
                                .id("review-1")
                                .contractId("contract-2")
                                .reviewerId("user-1")
                                .targetId("freelancer-2")
                                .rating(5)
                                .comment("Already reviewed")
                                .createdAt(LocalDateTime.now())
                                .build()
                )))
                .build();

        when(currentUserService.requireUser()).thenReturn(user);
        when(currentUserService.getActiveWorkspaceRole()).thenReturn("EMPLOYER");
        when(contractRepository.findById("contract-2")).thenReturn(Optional.of(contract));
        when(employerRepository.findAll()).thenReturn(List.of(reviewerWorkspace));

        EmployerWorkspaceService.ReviewCreateRequest request = new EmployerWorkspaceService.ReviewCreateRequest(
                "contract-2",
                "freelancer-2",
                5,
                "Great work",
                List.of()
        );

        assertThatThrownBy(() -> workspaceReviewService.addReview(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("You have already submitted a review for this contract.");

        verify(employerWorkspaceService, never()).addReview(request);
    }

    @Test
    void addReview_normalizesTargetToContractCounterpartyForEmployerFlow() {
        User user = user("user-1");
        Contract contract = contract("contract-3", Contract.Status.COMPLETED, "user-1", "freelancer-profile-1");
        Freelancer freelancer = Freelancer.builder()
                .id("freelancer-profile-1")
                .userId("freelancer-user-1")
                .build();
        Employer.EmployerReview createdReview = Employer.EmployerReview.builder()
                .id("review-3")
                .contractId("contract-3")
                .targetId("freelancer-profile-1")
                .reviewerId("user-1")
                .rating(5)
                .comment("Excellent")
                .build();

        when(currentUserService.requireUser()).thenReturn(user);
        when(currentUserService.getActiveWorkspaceRole()).thenReturn("EMPLOYER");
        when(contractRepository.findById("contract-3")).thenReturn(Optional.of(contract));
        when(freelancerRepository.findById("freelancer-profile-1")).thenReturn(Optional.of(freelancer));
        when(employerRepository.findAll()).thenReturn(List.of());
        when(employerWorkspaceService.addReview(org.mockito.ArgumentMatchers.any())).thenReturn(createdReview);

        EmployerWorkspaceService.ReviewCreateRequest request = new EmployerWorkspaceService.ReviewCreateRequest(
                "contract-3",
                "freelancer-user-1",
                5,
                "Excellent collaboration",
                List.of("communication")
        );

        Employer.EmployerReview result = workspaceReviewService.addReview(request);

        ArgumentCaptor<EmployerWorkspaceService.ReviewCreateRequest> captor =
                ArgumentCaptor.forClass(EmployerWorkspaceService.ReviewCreateRequest.class);
        verify(employerWorkspaceService).addReview(captor.capture());

        EmployerWorkspaceService.ReviewCreateRequest forwarded = captor.getValue();
        assertThat(forwarded.contractId()).isEqualTo("contract-3");
        assertThat(forwarded.targetId()).isEqualTo("freelancer-profile-1");
        assertThat(result.getId()).isEqualTo("review-3");
    }

    private User user(String id) {
        User user = new User();
        user.setId(id);
        return user;
    }

    private Contract contract(String id, Contract.Status status, String employerId, String freelancerId) {
        Contract contract = new Contract();
        contract.setId(id);
        contract.setStatus(status);
        contract.setEmployerId(employerId);
        contract.setFreelancerId(freelancerId);
        return contract;
    }
}
