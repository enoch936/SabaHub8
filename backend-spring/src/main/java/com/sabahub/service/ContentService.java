

package com.sabahub.service;

import com.sabahub.domain.ContentItem;
import com.sabahub.domain.User;
import com.sabahub.repository.ContentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ContentService {

    private final ContentRepository contentRepository;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;

    public ContentService(ContentRepository contentRepository, CurrentUserService currentUserService,
                                       AuditService auditService) {
        this.contentRepository = contentRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
    }

    public List<ContentItem> listPublic(String type) {
        ContentItem.Type t = ContentItem.Type.valueOf(type);
        return contentRepository.findByTypeAndStatus(t, ContentItem.Status.PUBLISHED);
    }

    public List<ContentItem> adminList(String type, String status) {
        User me = currentUserService.requireUser();
        if (!hasContentAdminAccess(me)) {
            throw new IllegalStateException("Forbidden");
        }

        ContentItem.Type typeFilter = null;
        ContentItem.Status statusFilter = null;
        if (type != null && !type.isBlank()) {
            typeFilter = ContentItem.Type.valueOf(type.trim().toUpperCase());
        }
        if (status != null && !status.isBlank()) {
            statusFilter = ContentItem.Status.valueOf(status.trim().toUpperCase());
        }

        ContentItem.Type finalTypeFilter = typeFilter;
        ContentItem.Status finalStatusFilter = statusFilter;
        return contentRepository.findAll().stream()
                .filter(item -> finalTypeFilter == null || item.getType() == finalTypeFilter)
                .filter(item -> finalStatusFilter == null || item.getStatus() == finalStatusFilter)
                .toList();
    }

    public ContentItem adminCreate(ContentItem item) {
        User me = currentUserService.requireUser();
        if (!hasContentAdminAccess(me)) {
            throw new IllegalStateException("Forbidden");
        }

        item.setId(null);
        if (item.getStatus() == null) {
            item.setStatus(ContentItem.Status.DRAFT);
        }
        ContentItem saved = contentRepository.save(item);
        
        // Audit log: content created by admin
        auditService.log("CONTENT_CREATE", "CONTENT", saved.getId(), java.util.Map.of(
            "type", item.getType().name(),
            "slug", item.getSlug() != null ? item.getSlug() : "",
            "status", saved.getStatus().name(),
            "admin_id", me.getId()
        ));
        
        return saved;
    }

    public ContentItem adminUpdate(String id, ContentItem patch) {
        User me = currentUserService.requireUser();
        if (!hasContentAdminAccess(me)) {
            throw new IllegalStateException("Forbidden");
        }

        ContentItem existing = contentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Content not found"));

        if (patch.getType() != null) existing.setType(patch.getType());
        if (patch.getSlug() != null) existing.setSlug(patch.getSlug());
        if (patch.getTitle() != null) existing.setTitle(patch.getTitle());
        if (patch.getBody() != null) existing.setBody(patch.getBody());
        if (patch.getStatus() != null) existing.setStatus(patch.getStatus());
        if (patch.getMediaAssetIds() != null) existing.setMediaAssetIds(patch.getMediaAssetIds());

        ContentItem updated = contentRepository.save(existing);
        
        // Audit log: content updated by admin
        auditService.log("CONTENT_UPDATE", "CONTENT", updated.getId(), java.util.Map.of(
            "type", updated.getType().name(),
            "slug", updated.getSlug() != null ? updated.getSlug() : "",
            "status", updated.getStatus().name(),
            "admin_id", me.getId()
        ));
        
        return updated;
    }

    private boolean hasContentAdminAccess(User user) {
        return currentUserService.hasRole(user, "ADMIN")
                || currentUserService.hasRole(user, "SUPER_ADMIN");
    }
}
