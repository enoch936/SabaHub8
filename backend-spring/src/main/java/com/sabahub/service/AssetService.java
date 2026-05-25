package com.sabahub.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.sabahub.domain.Asset;
import com.sabahub.repository.AssetRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AssetService {
    private final AssetRepository repository;
    private final Cloudinary cloudinary;
    private final AuditService auditService;
    private final LiveActivityService liveActivityService;

    public AssetService(AssetRepository repository, Cloudinary cloudinary, AuditService auditService, LiveActivityService liveActivityService) {
        this.repository = repository;
        this.cloudinary = cloudinary;
        this.auditService = auditService;
        this.liveActivityService = liveActivityService;
    }

    public List<Asset> list() {
        return repository.findAll().stream()
                .map(this::withDownloadUrl)
                .toList();
    }

    public Optional<Asset> get(String id) {
        return repository.findById(id).map(this::withDownloadUrl);
    }

    /**
     * Server-side multipart upload (kept for compatibility).
     */
    public Asset upload(String ownerId, String scope, String title, MultipartFile file) throws IOException {
        Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
        Asset saved = saveFromCloudinaryResult(ownerId, scope, title, uploadResult);
        // Audit: asset uploaded via server-side multipart
        auditService.log("ASSET_UPLOAD", "ASSET", saved.getId(), Map.of(
                "ownerId", ownerId,
                "scope", scope,
                "mimeType", saved.getMimeType(),
                "size", saved.getSize() == null ? 0L : saved.getSize(),
                "publicId", saved.getPublicId()
        ));

        // Live Activity: asset upload
        liveActivityService.broadcast(
                "UPLOAD",
                "New file uploaded: " + (title != null && !title.isBlank() ? title : saved.getPublicId()),
                ownerId,
                null,
                null,
                "info",
                Map.of("scope", scope, "mimeType", saved.getMimeType())
        );

        return withDownloadUrl(saved);
    }

    /**
     * Signed-upload flow: save metadata after client uploads directly to Cloudinary.
     */
    public Asset saveMetadata(String ownerId,
                              String scope,
                              String title,
                              String secureUrl,
                              String publicId,
                              String resourceType,
                              String mimeType,
                              Long size) {
        Asset asset = new Asset();
        asset.setOwnerId(ownerId);
        asset.setScope(scope);
        asset.setTitle(title);
        asset.setUrl(secureUrl);
        asset.setPublicId(publicId);
        asset.setResourceType(resourceType);
        asset.setMimeType(mimeType);
        asset.setSize(size);
        Asset saved = repository.save(asset);
        // Audit: asset metadata saved after signed upload
        auditService.log("ASSET_UPLOAD", "ASSET", saved.getId(), Map.of(
            "ownerId", ownerId,
            "scope", scope,
            "mimeType", mimeType,
            "size", size == null ? 0L : size,
            "publicId", publicId,
            "signed", true
        ));

        // Live Activity: asset upload
        liveActivityService.broadcast(
                "UPLOAD",
                "New file uploaded: " + (title != null && !title.isBlank() ? title : publicId),
                ownerId,
                null,
                null,
                "info",
                Map.of("scope", scope, "mimeType", mimeType, "signed", true)
        );

        return withDownloadUrl(saved);
    }

    public Map<String, Object> createUploadSignature(Map<String, Object> paramsToSign) {
        // Cloudinary requires signing of sorted params. The SDK handles signature generation.
        // Caller should include 'timestamp' and any relevant parameters (folder, eager, etc.).
        String signature = cloudinary.apiSignRequest(paramsToSign, cloudinary.config.apiSecret);
        return Map.of(
                "signature", signature,
                "apiKey", cloudinary.config.apiKey,
                "cloudName", cloudinary.config.cloudName,
                "params", paramsToSign
        );
    }

    public void delete(String id) throws IOException {
        Optional<Asset> existing = repository.findById(id);
        if (existing.isEmpty()) {
            return;
        }
        Asset asset = existing.get();
        if (asset.getPublicId() != null) {
            cloudinary.uploader().destroy(asset.getPublicId(), ObjectUtils.emptyMap());
        }
        repository.deleteById(id);
        // Audit: asset deleted
        auditService.log("ASSET_DELETE", "ASSET", asset.getId(), Map.of(
                "ownerId", asset.getOwnerId(),
                "scope", asset.getScope(),
                "publicId", asset.getPublicId()
        ));
    }

    public Map<String, Object> getStorageAnalytics() {
        List<Asset> all = repository.findAll();
        long totalSize = all.stream().mapToLong(a -> a.getSize() != null ? a.getSize() : 0).sum();

        Map<String, Long> sizeByType = new HashMap<>();
        Map<String, Long> countByType = new HashMap<>();

        for (Asset a : all) {
            String type = a.getResourceType() != null ? a.getResourceType() : "other";
            sizeByType.put(type, sizeByType.getOrDefault(type, 0L) + (a.getSize() != null ? a.getSize() : 0));
            countByType.put(type, countByType.getOrDefault(type, 0L) + 1);
        }

        return Map.of(
                "totalSize", totalSize,
                "totalCount", (long) all.size(),
                "sizeByType", sizeByType,
                "countByType", countByType,
                "storageTotal", 5368709120L // 5GB default
        );
    }

    private Asset withDownloadUrl(Asset asset) {
        if (asset == null || asset.getPublicId() == null || asset.getPublicId().isBlank()) {
            return asset;
        }
        try {
            String format = resolveFormat(asset);
            if (format == null || format.isBlank()) {
                return asset;
            }
            Map<String, Object> options = new HashMap<>();
            if (asset.getResourceType() != null && !asset.getResourceType().isBlank()) {
                options.put("resource_type", asset.getResourceType());
            }
            options.put("type", "upload");
            String downloadUrl = cloudinary.privateDownload(asset.getPublicId(), format, options);
            asset.setDownloadUrl(downloadUrl);
        } catch (Exception ignored) {
            // Best-effort: leave downloadUrl unset if signing fails.
        }
        return asset;
    }

    private String resolveFormat(Asset asset) {
        String fromUrl = extractFormatFromUrl(asset.getUrl());
        if (fromUrl != null) {
            return fromUrl;
        }
        String mimeType = asset.getMimeType();
        if (mimeType == null) {
            return null;
        }
        int slash = mimeType.lastIndexOf('/');
        if (slash == -1 || slash == mimeType.length() - 1) {
            return null;
        }
        return mimeType.substring(slash + 1);
    }

    private String extractFormatFromUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String trimmed = url;
        int queryIndex = trimmed.indexOf('?');
        if (queryIndex >= 0) {
            trimmed = trimmed.substring(0, queryIndex);
        }
        int lastSlash = trimmed.lastIndexOf('/');
        String filename = lastSlash >= 0 ? trimmed.substring(lastSlash + 1) : trimmed;
        int dot = filename.lastIndexOf('.');
        if (dot <= 0 || dot == filename.length() - 1) {
            return null;
        }
        return filename.substring(dot + 1);
    }

    private Asset saveFromCloudinaryResult(String ownerId, String scope, String title, Map<String, Object> uploadResult) {
        Asset asset = new Asset();
        asset.setOwnerId(ownerId);
        asset.setScope(scope);
        asset.setTitle(title);
        asset.setUrl((String) uploadResult.get("secure_url"));
        asset.setPublicId((String) uploadResult.get("public_id"));
        asset.setResourceType((String) uploadResult.get("resource_type"));
        asset.setMimeType((String) uploadResult.get("format"));

        Object bytes = uploadResult.get("bytes");
        if (bytes instanceof Number n) {
            asset.setSize(n.longValue());
        }
        return repository.save(asset);
    }
}
