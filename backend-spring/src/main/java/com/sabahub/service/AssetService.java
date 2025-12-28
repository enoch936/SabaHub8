package com.sabahub.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.sabahub.domain.Asset;
import com.sabahub.repository.AssetRepository;
import java.util.HashMap;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AssetService {
    private final AssetRepository repository;
    private final Cloudinary cloudinary;
    private final AuditService auditService;

    public AssetService(AssetRepository repository, Cloudinary cloudinary, AuditService auditService) {
        this.repository = repository;
        this.cloudinary = cloudinary;
        this.auditService = auditService;
    }

    public List<Asset> list() {
        return repository.findAll();
    }

    public Optional<Asset> get(String id) {
        return repository.findById(id);
    }

    /**
     * Server-side multipart upload (kept for compatibility).
     */
    public Asset upload(String ownerId, String scope, String title, MultipartFile file) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
        Asset saved = saveFromCloudinaryResult(ownerId, scope, title, uploadResult);
        // Audit: asset uploaded via server-side multipart
        auditService.log("ASSET_UPLOAD", "ASSET", saved.getId(), Map.of(
                "ownerId", ownerId,
                "scope", scope,
                "mimeType", saved.getMimeType(),
                "size", saved.getSize() == null ? 0L : saved.getSize(),
                "publicId", saved.getPublicId()
        ));
        return saved;
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
        return saved;
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

    private Asset saveFromCloudinaryResult(String ownerId, String scope, String title, Map uploadResult) {
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