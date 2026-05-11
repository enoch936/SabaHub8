package com.sabahub.web;

import com.sabahub.service.WorkspaceDemoDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workspace")
public class WorkspaceBootstrapController {

    private final WorkspaceDemoDataService workspaceDemoDataService;

    public WorkspaceBootstrapController(WorkspaceDemoDataService workspaceDemoDataService) {
        this.workspaceDemoDataService = workspaceDemoDataService;
    }

    @PostMapping("/bootstrap")
    @PreAuthorize("hasAnyRole('EMPLOYER', 'FREELANCER')")
    public ResponseEntity<WorkspaceDemoDataService.BootstrapResult> bootstrapWorkspace() {
        return ResponseEntity.ok(workspaceDemoDataService.bootstrapCurrentUserWorkspace());
    }
}
