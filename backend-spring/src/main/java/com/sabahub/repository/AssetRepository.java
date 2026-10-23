package com.sabahub.repository;

import com.sabahub.domain.Asset;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface AssetRepository extends MongoRepository<Asset, String> {
    List<Asset> findAllByOwnerId(String ownerId);
    List<Asset> findAllByOwnerIdAndScope(String ownerId, String scope);
}
