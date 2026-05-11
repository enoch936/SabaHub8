package com.sabahub.web;

import com.sabahub.domain.Employer;
import com.sabahub.service.EmployerWorkspaceService;
import com.sabahub.service.WorkspaceReviewService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/workspace/reviews")
@RequiredArgsConstructor
@Validated
public class WorkspaceReviewController {

    private final WorkspaceReviewService workspaceReviewService;

    @GetMapping
    @PreAuthorize("hasAnyRole('EMPLOYER', 'FREELANCER')")
    public ResponseEntity<List<Employer.EmployerReview>> listReviews() {
        return ResponseEntity.ok(workspaceReviewService.listReviews());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('EMPLOYER', 'FREELANCER')")
    public ResponseEntity<Employer.EmployerReview> addReview(@Valid @RequestBody CreateReviewRequest request) {
        Employer.EmployerReview review = workspaceReviewService.addReview(
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

    public record CreateReviewRequest(
            String contractId,
            String targetId,
            @Min(1) @Max(5) int rating,
            @NotBlank String comment,
            List<String> tags
    ) {}
}
