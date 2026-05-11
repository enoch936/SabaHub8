package com.sabahub.web;

import com.sabahub.domain.Employer;
import com.sabahub.service.EmployerWorkspaceService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employer/workspace")
@RequiredArgsConstructor
@Slf4j
@Validated
public class EmployerWorkspaceController {

    private final EmployerWorkspaceService employerWorkspaceService;

    @GetMapping("/team")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<TeamResponse> getTeam() {
        EmployerWorkspaceService.TeamSnapshot team = employerWorkspaceService.getTeamSnapshot();
        return ResponseEntity.ok(new TeamResponse(
                team.id(),
                team.name(),
                team.ownerId(),
                team.createdAt(),
                team.members(),
                team.activities()
        ));
    }

    @PostMapping("/team/members/invite")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<Employer.TeamMember> inviteMember(@Valid @RequestBody InviteMemberRequest request) {
        Employer.TeamMember member = employerWorkspaceService.inviteMember(request.email(), request.role());
        return ResponseEntity.ok(member);
    }

    @PatchMapping("/team/members/{userId}/role")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<Employer.TeamMember> updateMemberRole(
            @PathVariable String userId,
            @Valid @RequestBody UpdateRoleRequest request
    ) {
        Employer.TeamMember member = employerWorkspaceService.updateMemberRole(userId, request.role());
        return ResponseEntity.ok(member);
    }

    @DeleteMapping("/team/members/{userId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<Map<String, Object>> removeMember(@PathVariable String userId) {
        employerWorkspaceService.removeMember(userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/reviews")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<List<Employer.EmployerReview>> listReviews() {
        return ResponseEntity.ok(employerWorkspaceService.listReviews());
    }

    @PostMapping("/reviews")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<Employer.EmployerReview> addReview(@Valid @RequestBody CreateReviewRequest request) {
        Employer.EmployerReview review = employerWorkspaceService.addReview(
                new EmployerWorkspaceService.ReviewCreateRequest(
                        request.contractId(),
                        request.targetId(),
                        request.rating(),
                        request.comment(),
                        request.tags()
                )
        );
        return ResponseEntity.ok(review);
    }

    public record TeamResponse(
            String id,
            String name,
            String ownerId,
            java.time.LocalDateTime createdAt,
            List<Employer.TeamMember> members,
            List<Employer.TeamActivity> activities
    ) {}

    public record InviteMemberRequest(
            @Email @NotBlank String email,
            @NotBlank String role
    ) {}

    public record UpdateRoleRequest(@NotBlank String role) {}

    public record CreateReviewRequest(
            String contractId,
            String targetId,
            @Min(1) @Max(5) int rating,
            @NotBlank String comment,
            List<String> tags
    ) {}
}
