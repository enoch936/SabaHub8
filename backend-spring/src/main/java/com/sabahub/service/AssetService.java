package com.sabahub.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.sabahub.domain.Asset;
import com.sabahub.repository.AssetRepository;
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

    public AssetService(AssetRepository repository, Cloudinary cloudinary) {
        this.repository = repository;
        this.cloudinary = cloudinary;
    }

    public List<Asset> list() {
        return repository.findAll();
    }

    public Optional<Asset> get(String id) {
        return repository.findById(id);
    }

    public Asset upload(String title, MultipartFile file) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
        String url = (String) uploadResult.get("secure_url");
        String publicId = (String) uploadResult.get("public_id");
        Asset asset = new Asset(title, url, publicId);
        return repository.save(asset);
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
    }
}