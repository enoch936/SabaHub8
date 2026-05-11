package com.sabahub.web;

import com.sabahub.service.WorkspaceProfileService;
import com.sabahub.web.dto.WorkspaceProfileDTOs.EmployerProfileUpdateRequest;
import com.sabahub.web.dto.WorkspaceProfileDTOs.EmployerWorkspaceProfile;
import com.sabahub.web.dto.WorkspaceProfileDTOs.WorkspaceProfileSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workspace/profiles")
@RequiredArgsConstructor
public class WorkspaceProfileController {

    private final WorkspaceProfileService workspaceProfileService;

    @GetMapping("/freelancers/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYER', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<WorkspaceProfileSummary> getFreelancerProfile(@PathVariable String id) {
        return ResponseEntity.ok(workspaceProfileService.getFreelancerProfileSummary(id));
    }

    @GetMapping("/employers/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYER', 'FREELANCER', 'ADMIN')")
    public ResponseEntity<WorkspaceProfileSummary> getEmployerProfile(@PathVariable String id) {
        return ResponseEntity.ok(workspaceProfileService.getEmployerProfileSummary(id));
    }

    @GetMapping("/employer/me")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<EmployerWorkspaceProfile> getCurrentEmployerProfile() {
        return ResponseEntity.ok(workspaceProfileService.getCurrentEmployerWorkspaceProfile());
    }

    @PutMapping("/employer/me")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<EmployerWorkspaceProfile> updateCurrentEmployerProfile(
            @RequestBody EmployerProfileUpdateRequest request
    ) {
        return ResponseEntity.ok(workspaceProfileService.updateCurrentEmployerProfile(request));
    }
}
