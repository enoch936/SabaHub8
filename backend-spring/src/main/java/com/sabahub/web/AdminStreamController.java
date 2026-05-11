package com.sabahub.web;

import com.sabahub.domain.User;
import com.sabahub.service.CurrentUserService;
import com.sabahub.service.StreamService;
import com.sabahub.web.dto.stream.StreamingDTOs;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/streams")
public class AdminStreamController {

    private final StreamService streamService;
    private final CurrentUserService currentUserService;

    public AdminStreamController(StreamService streamService, CurrentUserService currentUserService) {
        this.streamService = streamService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/overview")
    @PreAuthorize("@streamingAccessService.canAdminister(authentication)")
    public ResponseEntity<StreamingDTOs.AdminOverview> overview() {
        return ResponseEntity.ok(streamService.getAdminOverview());
    }

    @PostMapping("/{streamId}/terminate")
    @PreAuthorize("@streamingAccessService.canAdminister(authentication)")
    public ResponseEntity<StreamingDTOs.StreamDetail> terminateStream(@PathVariable String streamId,
                                                                      @RequestBody(required = false) StreamingDTOs.AdminTerminateRequest request) {
        User admin = currentUserService.requireUser();
        String reason = request != null ? request.reason() : "Admin terminated stream";
        return ResponseEntity.ok(streamService.terminateStream(admin, streamId, reason));
    }

    @PostMapping("/{streamId}/ban")
    @PreAuthorize("@streamingAccessService.canAdminister(authentication)")
    public ResponseEntity<?> banViewer(@PathVariable String streamId,
                                       @RequestBody StreamingDTOs.ModerationCommand request) {
        User admin = currentUserService.requireUser();
        streamService.kickViewer(admin, streamId, request);
        return ResponseEntity.ok().build();
    }
}
