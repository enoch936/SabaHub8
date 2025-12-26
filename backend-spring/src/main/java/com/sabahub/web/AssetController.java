package com.sabahub.web;

import com.sabahub.domain.Asset;
import com.sabahub.service.AssetService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/assets")
@Validated
public class AssetController {

    private final AssetService service;

    public AssetController(AssetService service) {
        this.service = service;
    }

    @GetMapping
    public List<Asset> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public Asset get(@PathVariable String id) {
        return service.get(id).orElseThrow(() -> new NoSuchElementException("Asset not found"));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Asset upload(@RequestPart("title") @NotBlank String title,
                        @RequestPart("file") MultipartFile file) throws IOException {
        return service.upload(title, file);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) throws IOException {
        service.delete(id);
    }
}
