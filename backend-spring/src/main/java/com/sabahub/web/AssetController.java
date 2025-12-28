package com.sabahub.web;

import com.sabahub.domain.Asset;
import com.sabahub.service.AssetService;
import com.sabahub.service.CurrentUserService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api")
@Validated
public class AssetController {

    private final AssetService service;
    private final CurrentUserService currentUserService;

    public AssetController(AssetService service, CurrentUserService currentUserService) {
        this.service = service;
        this.currentUserService = currentUserService;
    }

    // Public read (matches existing SecurityConfig permitAll for GET /assets/**; now moved under /api/assets/{id}.
    // If you want it public, add permitAll for GET /api/assets/** in SecurityConfig.
    @GetMapping("/assets")
    public List<Asset> list() {
        return service.list();
    }

    @GetMapping("/assets/{id}")
    public Asset get(@PathVariable String id) {
        return service.get(id).orElseThrow(() -> new NoSuchElementException("Asset not found"));
    }

    /**
     * Server-side upload (optional). Requires auth.
     */
    @PostMapping(value = "/assets/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Asset upload(
            @RequestPart("scope") @NotBlank String scope,
            @RequestPart(value = "title", required = false) String title,
            @RequestPart("file") MultipartFile file
    ) throws IOException {
        var me = currentUserService.requireUser();
        return service.upload(me.getId(), scope, title == null ? "" : title, file);
    }

    /**
     * Signed upload signature for direct-to-Cloudinary uploads.
     */
    @PostMapping("/assets/signature")
    public Object signature(@RequestBody java.util.Map<String, Object> body) {
        // Expect caller to send at least: { "timestamp": 1234567890, "folder": "..." }
        // Cloudinary will require timestamp.
        return service.createUploadSignature(body);
    }

    /**
     * Persist metadata after direct upload to Cloudinary.
     */
    @PostMapping("/assets")
    public Asset saveMetadata(@RequestBody java.util.Map<String, Object> body) {
        var me = currentUserService.requireUser();
        String scope = (String) body.getOrDefault("scope", "CHAT");
        String title = (String) body.getOrDefault("title", "");
        String secureUrl = (String) body.get("secureUrl");
        String publicId = (String) body.get("publicId");
        String resourceType = (String) body.getOrDefault("resourceType", "raw");
        String mimeType = (String) body.get("mimeType");

        Long size = null;
        Object sizeObj = body.get("size");
        if (sizeObj instanceof Number n) size = n.longValue();

        if (secureUrl == null || publicId == null) {
            throw new IllegalArgumentException("secureUrl and publicId are required");
        }

        return service.saveMetadata(me.getId(), scope, title, secureUrl, publicId, resourceType, mimeType, size);
    }

    @DeleteMapping("/assets/{id}")
    public void delete(@PathVariable String id) throws IOException {
        var me = currentUserService.requireUser();
        var asset = service.get(id).orElseThrow(() -> new NoSuchElementException("Asset not found"));
        boolean isOwner = asset.getOwnerId() != null && asset.getOwnerId().equals(me.getId());
        boolean isAdmin = currentUserService.hasRole(me, "ADMIN");
        if (!isOwner && !isAdmin) {
            throw new IllegalStateException("Forbidden");
        }
        service.delete(id);
    }
}
