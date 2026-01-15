package com.sabahub.controller;

import com.sabahub.service.CloudinaryMediaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Media Upload Controller
 * REST endpoints for uploading various media types to Cloudinary
 */
@Slf4j
@RestController
@RequestMapping("/api/media")
@CrossOrigin(origins = "*")
public class MediaUploadController {

    @Autowired
    private CloudinaryMediaService mediaService;

    // ========== Image Upload Endpoints ==========

    @PostMapping("/upload/profile-image")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> uploadProfileImage(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadProfileImage(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload profile image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload image"));
        }
    }

    @PostMapping("/upload/post-image")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> uploadPostImage(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadPostImage(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload post image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload image"));
        }
    }

    @PostMapping("/upload/gallery-image")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> uploadGalleryImage(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadGalleryImage(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload gallery image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload image"));
        }
    }

    @PostMapping("/upload/company-logo")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> uploadCompanyLogo(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadCompanyLogo(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload company logo", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload logo"));
        }
    }

    // ========== Video Upload Endpoints ==========

    @PostMapping("/upload/training-video")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> uploadTrainingVideo(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadTrainingVideo(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload training video", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload video"));
        }
    }

    @PostMapping("/upload/promo-video")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> uploadPromoVideo(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadPromoVideo(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload promotional video", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload video"));
        }
    }

    @PostMapping("/upload/user-video")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> uploadUserVideo(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadUserVideo(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload user video", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload video"));
        }
    }

    // ========== Audio Upload Endpoints ==========

    @PostMapping("/upload/podcast")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> uploadPodcast(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadPodcast(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload podcast", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload audio"));
        }
    }

    @PostMapping("/upload/voice-note")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> uploadVoiceNote(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadVoiceNote(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload voice note", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload audio"));
        }
    }

    @PostMapping("/upload/audio-content")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> uploadAudioContent(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadAudioContent(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload audio content", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload audio"));
        }
    }

    // ========== Document Upload Endpoints ==========

    @PostMapping("/upload/resume")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<?> uploadResume(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadResume(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload resume", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload document"));
        }
    }

    @PostMapping("/upload/contract")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> uploadContract(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadContract(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload contract", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload document"));
        }
    }

    @PostMapping("/upload/report")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> uploadReport(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadReport(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload report", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload document"));
        }
    }

    @PostMapping("/upload/certificate")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> uploadCertificate(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadCertificate(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload certificate", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload document"));
        }
    }

    // ========== File Upload Endpoints ==========

    @PostMapping("/upload/archive")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> uploadArchive(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadArchive(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload archive", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload file"));
        }
    }

    @PostMapping("/upload/spreadsheet")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> uploadSpreadsheet(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadSpreadsheet(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload spreadsheet", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload file"));
        }
    }

    @PostMapping("/upload/misc-file")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> uploadMiscFile(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, String> result = mediaService.uploadMiscFile(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (IOException e) {
            log.error("Failed to upload misc file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to upload file"));
        }
    }

    // ========== Utility Endpoints ==========

    @GetMapping("/thumbnail/{publicId}")
    public ResponseEntity<?> getThumbnail(@PathVariable String publicId) {
        try {
            String thumbnailUrl = mediaService.getThumbnailUrl(publicId);
            Map<String, String> response = new HashMap<>();
            response.put("thumbnailUrl", thumbnailUrl);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to generate thumbnail", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to generate thumbnail"));
        }
    }

    @GetMapping("/optimized/{publicId}")
    public ResponseEntity<?> getOptimizedImage(
            @PathVariable String publicId,
            @RequestParam(defaultValue = "800") int width,
            @RequestParam(defaultValue = "800") int height) {
        try {
            String optimizedUrl = mediaService.getOptimizedImageUrl(publicId, width, height);
            Map<String, String> response = new HashMap<>();
            response.put("optimizedUrl", optimizedUrl);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to generate optimized image URL", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to generate optimized image"));
        }
    }

    @DeleteMapping("/delete/{resourceType}/{publicId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'EMPLOYER')")
    public ResponseEntity<?> deleteFile(
            @PathVariable String resourceType,
            @PathVariable String publicId) {
        try {
            mediaService.deleteFile(publicId, resourceType);
            Map<String, String> response = new HashMap<>();
            response.put("message", "File deleted successfully");
            response.put("publicId", publicId);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("Failed to delete file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to delete file"));
        }
    }

    // ========== Helper Methods ==========

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}
