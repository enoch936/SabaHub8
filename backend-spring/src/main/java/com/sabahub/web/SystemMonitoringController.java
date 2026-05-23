package com.sabahub.web;

import com.sabahub.domain.User;
import com.sabahub.service.AdminCommandCenterService;
import com.sabahub.service.CurrentUserService;
import com.sabahub.web.dto.admin.AdminCommandCenterDTOs;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/admin/monitoring")
@RequiredArgsConstructor
public class SystemMonitoringController {

    private final AdminCommandCenterService adminCommandCenterService;
    private final CurrentUserService currentUserService;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    @GetMapping(value = "/stream-metrics", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamMetrics() {
        requireAdmin();
        SseEmitter emitter = new SseEmitter(1800000L); // 30 minutes
        
        executor.execute(() -> {
            try {
                while (true) {
                    try {
                        AdminCommandCenterDTOs.DomainResponse data = adminCommandCenterService.getDomain("system-monitoring-health-management");
                        emitter.send(SseEmitter.event().name("metrics").data(data));
                    } catch (Exception e) {
                        // ignore send errors, emitter might be closed
                        break;
                    }
                    Thread.sleep(2000); 
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                emitter.complete();
            }
        });
        
        return emitter;
    }

    @GetMapping(value = "/stream-logs", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamLogs() {
        requireAdmin();
        SseEmitter emitter = new SseEmitter(1800000L);
        
        executor.execute(() -> {
            try {
                Path logPath = Paths.get("../.run/logs/backend.log");
                if (!Files.exists(logPath)) {
                    // try local path as fallback
                    logPath = Paths.get(".run/logs/backend.log");
                }
                
                if (!Files.exists(logPath)) {
                    emitter.send(SseEmitter.event().name("logs").data("Log file not found at " + logPath.toAbsolutePath()));
                    emitter.complete();
                    return;
                }
                
                long lastPos = Files.size(logPath) - 8192; 
                if (lastPos < 0) lastPos = 0;

                while (true) {
                    long currentSize = Files.size(logPath);
                    if (currentSize > lastPos) {
                        try (java.io.RandomAccessFile reader = new java.io.RandomAccessFile(logPath.toFile(), "r")) {
                            reader.seek(lastPos);
                            String line;
                            while ((line = reader.readLine()) != null) {
                                emitter.send(SseEmitter.event().name("logs").data(line));
                            }
                            lastPos = reader.getFilePointer();
                        }
                    }
                    Thread.sleep(1000);
                }
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
        
        return emitter;
    }

    private void requireAdmin() {
        User me;
        try {
            me = currentUserService.requireUser();
        } catch (IllegalStateException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        boolean allowed = currentUserService.hasRole(me, "ADMIN")
                || currentUserService.hasRole(me, "SUPER_ADMIN")
                || currentUserService.hasRole(me, "SUPPORT_ADMIN");
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin privileges required");
        }
    }
}
