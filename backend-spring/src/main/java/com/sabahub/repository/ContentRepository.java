package com.sabahub.repository;

import com.sabahub.domain.ContentItem;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ContentRepository extends MongoRepository<ContentItem, String> {
    List<ContentItem> findByTypeAndStatus(ContentItem.Type type, ContentItem.Status status);

    Optional<ContentItem> findByTypeAndSlug(ContentItem.Type type, String slug);
}
