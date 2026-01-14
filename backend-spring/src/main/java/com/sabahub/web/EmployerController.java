package com.sabahub.web;

import com.sabahub.domain.*;
import com.sabahub.service.EmployerService;
import com.sabahub.web.dto.EmployerDTOs.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/employer")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class EmployerController {

    private final EmployerService employerService;

    // ==================== KYC & Account Management ====================

    @PostMapping("/register")
    public ResponseEntity<?> registerEmployer(@Valid @RequestBody EmployerRegistrationDTO dto) {
        try {
            String userId = getCurrentUserId();
            Employer employer = employerService.createEmployerAccount(userId, dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Employer account created successfully",
                            "data", employer
                    ));
        } catch (Exception e) {
            log.error("Error registering employer", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "error", "REGISTRATION_ERROR",
                            "message", e.getMessage()
                    ));
        }
    }

    @PutMapping("/{employerId}/profile")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> updateCompanyProfile(
            @PathVariable String employerId,
            @Valid @RequestBody CompanyProfileDTO dto) {
        try {
            Employer employer = employerService.updateCompanyProfile(employerId, dto);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Company profile updated successfully",
                    "data", employer
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "success", false,
                            "error", "UPDATE_ERROR",
                            "message", e.getMessage()
                    ));
        }
    }

    @PostMapping("/{employerId}/kyc/submit")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> submitKYC(
            @PathVariable String employerId,
            @RequestBody Map<String, String> request) {
        try {
            String documentUrl = request.get("documentUrl");
            Employer employer = employerService.submitKYCVerification(employerId, documentUrl);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "KYC documents submitted for verification",
                    "data", employer
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/{employerId}/payment-method")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> addPaymentMethod(
            @PathVariable String employerId,
            @Valid @RequestBody PaymentMethodDTO dto) {
        try {
            Employer employer = employerService.addPaymentMethod(employerId, dto);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Payment method added successfully",
                    "data", employer
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ==================== Project Management ====================

    @PostMapping("/projects/create")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> postProject(
            @Valid @RequestBody ProjectCreationDTO dto) {
        try {
            String employerId = getCurrentEmployerId();
            Project project = employerService.postProject(employerId, dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Project posted successfully",
                            "data", project
                    ));
        } catch (Exception e) {
            log.error("Error posting project", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/projects")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> getProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        try {
            String employerId = getCurrentEmployerId();
            ProjectFilterDTO filter = new ProjectFilterDTO();
            filter.setStatus(status);

            Page<Project> projects = employerService.getEmployerProjects(employerId, filter, page, size);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", projects.getContent(),
                    "total", projects.getTotalElements(),
                    "page", page,
                    "size", size
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/projects/{projectId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> updateProject(
            @PathVariable String projectId,
            @Valid @RequestBody ProjectUpdateDTO dto) {
        try {
            Project project = employerService.updateProject(projectId, dto);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Project updated successfully",
                    "data", project
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/projects/{projectId}/close")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> closeProject(@PathVariable String projectId) {
        try {
            Project project = employerService.closeProject(projectId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Project closed successfully",
                    "data", project
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ==================== Proposal Management ====================

    @PostMapping("/proposals/{proposalId}/shortlist")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> shortlistProposal(
            @PathVariable String proposalId,
            @RequestParam String projectId) {
        try {
            employerService.shortlistProposal(projectId, proposalId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Proposal shortlisted successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/proposals/{proposalId}/invite-freelancer")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> inviteFreelancer(
            @PathVariable String proposalId,
            @RequestParam String projectId,
            @RequestParam String freelancerId) {
        try {
            employerService.inviteFreelancer(projectId, freelancerId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Freelancer invited successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ==================== Hiring & Contract Management ====================

    @PostMapping("/hire")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> hireFreelancer(
            @Valid @RequestBody HireDTO dto) {
        try {
            Contract contract = employerService.hireFreelancer(
                    dto.getProjectId(),
                    dto.getFreelancerId(),
                    dto
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "success", true,
                            "message", "Freelancer hired successfully",
                            "data", contract
                    ));
        } catch (Exception e) {
            log.error("Error hiring freelancer", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/contracts/{contractId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> getContractDetails(@PathVariable String contractId) {
        try {
            Contract contract = employerService.getContractDetails(contractId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", contract
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/contracts/{contractId}/milestone/{milestoneId}/release")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> releaseMilestonePayment(
            @PathVariable String contractId,
            @PathVariable String milestoneId,
            @RequestBody Map<String, String> request) {
        try {
            String feedback = request.get("feedback");
            Contract contract = employerService.releaseMilestonePayment(contractId, milestoneId, feedback);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Milestone payment released successfully",
                    "data", contract
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ==================== Ratings & Reviews ====================

    @PostMapping("/projects/{projectId}/rate")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> rateFreelancer(
            @PathVariable String projectId,
            @Valid @RequestBody RatingDTO dto) {
        try {
            Project project = employerService.rateFreelancer(projectId, dto);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Rating submitted successfully",
                    "data", project
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ==================== Analytics & Dashboard ====================

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<?> getAnalytics() {
        try {
            String employerId = getCurrentEmployerId();
            EmployerAnalyticsDTO analytics = employerService.getEmployerAnalytics(employerId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", analytics
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ==================== Helper Methods ====================

    private String getCurrentUserId() {
        // TODO: Extract from JWT token
        return "current-user-id";
    }

    private String getCurrentEmployerId() {
        // TODO: Extract from JWT token
        return "current-employer-id";
    }
}
