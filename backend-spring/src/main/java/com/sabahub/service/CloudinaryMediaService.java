package com.sabahub.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.*;

/**
 * Cloudinary Media Service
 * Handles upload, transformation, and management of all media types:
 * - Images (profiles, posts, logos)
 * - Videos (training, promotional, user content)
 * - Audio (podcasts, voice notes)
 * - Documents (resumes, contracts, reports, certificates)
 * - Files (archives, spreadsheets, misc)
 */
@Slf4j
@Service
public class CloudinaryMediaService {

    @Autowired
    private Cloudinary cloudinary;

    // ========== Folder Configuration ==========
    @Value("${cloudinary.folder.profile-images:sabahub/images/profiles}")
    private String profileImagesFolder;

    @Value("${cloudinary.folder.post-images:sabahub/images/posts}")
    private String postImagesFolder;

    @Value("${cloudinary.folder.gallery-images:sabahub/images/gallery}")
    private String galleryImagesFolder;

    @Value("${cloudinary.folder.company-logos:sabahub/images/logos}")
    private String companyLogosFolder;

    @Value("${cloudinary.folder.training-videos:sabahub/videos/training}")
    private String trainingVideosFolder;

    @Value("${cloudinary.folder.promo-videos:sabahub/videos/promotional}")
    private String promoVideosFolder;

    @Value("${cloudinary.folder.user-videos:sabahub/videos/user-content}")
    private String userVideosFolder;

    @Value("${cloudinary.folder.podcasts:sabahub/audios/podcasts}")
    private String podcastsFolder;

    @Value("${cloudinary.folder.voice-notes:sabahub/audios/voice-notes}")
    private String voiceNotesFolder;

    @Value("${cloudinary.folder.audio-content:sabahub/audios/content}")
    private String audioContentFolder;

    @Value("${cloudinary.folder.resumes:sabahub/documents/resumes}")
    private String resumesFolder;

    @Value("${cloudinary.folder.contracts:sabahub/documents/contracts}")
    private String contractsFolder;

    @Value("${cloudinary.folder.reports:sabahub/documents/reports}")
    private String reportsFolder;

    @Value("${cloudinary.folder.certificates:sabahub/documents/certificates}")
    private String certificatesFolder;

    @Value("${cloudinary.folder.archives:sabahub/files/archives}")
    private String archivesFolder;

    @Value("${cloudinary.folder.spreadsheets:sabahub/files/spreadsheets}")
    private String spreadsheetsFolder;

    @Value("${cloudinary.folder.misc:sabahub/files/misc}")
    private String miscFolder;

    // ========== Upload Limits ==========
    @Value("${cloudinary.max.image-size:10485760}")
    private long maxImageSize;

    @Value("${cloudinary.max.video-size:104857600}")
    private long maxVideoSize;

    @Value("${cloudinary.max.audio-size:52428800}")
    private long maxAudioSize;

    @Value("${cloudinary.max.document-size:20971520}")
    private long maxDocumentSize;

    @Value("${cloudinary.max.file-size:52428800}")
    private long maxFileSize;

    // ========== Allowed Formats ==========
    @Value("${cloudinary.allowed.image-formats:jpg,jpeg,png,gif,webp,svg,bmp,ico,avif,heic,heif}")
    private String allowedImageFormats;

    @Value("${cloudinary.allowed.video-formats:mp4,avi,mov,wmv,flv,webm,mkv,m4v}")
    private String allowedVideoFormats;

    @Value("${cloudinary.allowed.audio-formats:mp3,wav,ogg,aac,flac,m4a,wma}")
    private String allowedAudioFormats;

    @Value("${cloudinary.allowed.document-formats:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt}")
    private String allowedDocumentFormats;

    @Value("${cloudinary.allowed.file-formats:zip,rar,7z,tar,gz,csv,json,xml}")
    private String allowedFileFormats;

    // ========== Image Upload Methods ==========

    /**
     * Upload profile image
     */
    public Map<String, String> uploadProfileImage(MultipartFile file) throws IOException {
        validateFile(file, allowedImageFormats, maxImageSize);
        log.info("Uploading profile image: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(profileImagesFolder, "image");
        params.put("transformation", new Transformation()
                .quality("auto:good")
                .fetchFormat("auto")
                .width(800)
                .height(800)
                .crop("limit"));

        return uploadAndGetResult(file, params);
    }

    /**
     * Upload post image
     */
    public Map<String, String> uploadPostImage(MultipartFile file) throws IOException {
        validateFile(file, allowedImageFormats, maxImageSize);
        log.info("Uploading post image: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(postImagesFolder, "image");
        params.put("transformation", new Transformation()
                .quality("auto:good")
                .fetchFormat("auto"));

        return uploadAndGetResult(file, params);
    }

    /**
     * Upload gallery image
     */
    public Map<String, String> uploadGalleryImage(MultipartFile file) throws IOException {
        validateFile(file, allowedImageFormats, maxImageSize);
        log.info("Uploading gallery image: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(galleryImagesFolder, "image");
        params.put("transformation", new Transformation()
                .quality("auto:good")
                .fetchFormat("auto"));

        return uploadAndGetResult(file, params);
    }

    /**
     * Upload company logo
     */
    public Map<String, String> uploadCompanyLogo(MultipartFile file) throws IOException {
        validateFile(file, allowedImageFormats, maxImageSize);
        log.info("Uploading company logo: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(companyLogosFolder, "image");
        params.put("transformation", new Transformation()
                .quality("auto:good")
                .fetchFormat("png")
                .width(500)
                .height(500)
                .crop("limit"));

        return uploadAndGetResult(file, params);
    }

    // ========== Video Upload Methods ==========

    /**
     * Upload training video
     */
    public Map<String, String> uploadTrainingVideo(MultipartFile file) throws IOException {
        validateFile(file, allowedVideoFormats, maxVideoSize);
        log.info("Uploading training video: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(trainingVideosFolder, "video");
        params.put("quality", "auto:good");

        return uploadAndGetResult(file, params);
    }

    /**
     * Upload promotional video
     */
    public Map<String, String> uploadPromoVideo(MultipartFile file) throws IOException {
        validateFile(file, allowedVideoFormats, maxVideoSize);
        log.info("Uploading promotional video: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(promoVideosFolder, "video");
        params.put("quality", "auto:good");

        return uploadAndGetResult(file, params);
    }

    /**
     * Upload user video content
     */
    public Map<String, String> uploadUserVideo(MultipartFile file) throws IOException {
        validateFile(file, allowedVideoFormats, maxVideoSize);
        log.info("Uploading user video: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(userVideosFolder, "video");
        params.put("quality", "auto:good");

        return uploadAndGetResult(file, params);
    }

    // ========== Audio Upload Methods ==========

    /**
     * Upload podcast episode
     */
    public Map<String, String> uploadPodcast(MultipartFile file) throws IOException {
        validateFile(file, allowedAudioFormats, maxAudioSize);
        log.info("Uploading podcast: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(podcastsFolder, "video");
        // Note: Cloudinary uses "video" resource type for audio files

        return uploadAndGetResult(file, params);
    }

    /**
     * Upload voice note
     */
    public Map<String, String> uploadVoiceNote(MultipartFile file) throws IOException {
        validateFile(file, allowedAudioFormats, maxAudioSize);
        log.info("Uploading voice note: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(voiceNotesFolder, "video");

        return uploadAndGetResult(file, params);
    }

    /**
     * Upload audio content
     */
    public Map<String, String> uploadAudioContent(MultipartFile file) throws IOException {
        validateFile(file, allowedAudioFormats, maxAudioSize);
        log.info("Uploading audio content: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(audioContentFolder, "video");

        return uploadAndGetResult(file, params);
    }

    // ========== Document Upload Methods ==========

    /**
     * Upload resume
     */
    public Map<String, String> uploadResume(MultipartFile file) throws IOException {
        validateFile(file, allowedDocumentFormats, maxDocumentSize);
        log.info("Uploading resume: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(resumesFolder, "raw");

        return uploadAndGetResult(file, params);
    }

    /**
     * Upload contract
     */
    public Map<String, String> uploadContract(MultipartFile file) throws IOException {
        validateFile(file, allowedDocumentFormats, maxDocumentSize);
        log.info("Uploading contract: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(contractsFolder, "raw");

        return uploadAndGetResult(file, params);
    }

    /**
     * Upload report
     */
    public Map<String, String> uploadReport(MultipartFile file) throws IOException {
        validateFile(file, allowedDocumentFormats, maxDocumentSize);
        log.info("Uploading report: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(reportsFolder, "raw");

        return uploadAndGetResult(file, params);
    }

    /**
     * Upload certificate
     */
    public Map<String, String> uploadCertificate(MultipartFile file) throws IOException {
        validateFile(file, allowedDocumentFormats, maxDocumentSize);
        log.info("Uploading certificate: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(certificatesFolder, "raw");

        return uploadAndGetResult(file, params);
    }

    // ========== File Upload Methods ==========

    /**
     * Upload archive file
     */
    public Map<String, String> uploadArchive(MultipartFile file) throws IOException {
        validateFile(file, allowedFileFormats, maxFileSize);
        log.info("Uploading archive: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(archivesFolder, "raw");

        return uploadAndGetResult(file, params);
    }

    /**
     * Upload spreadsheet
     */
    public Map<String, String> uploadSpreadsheet(MultipartFile file) throws IOException {
        validateFile(file, allowedDocumentFormats + ",csv", maxFileSize);
        log.info("Uploading spreadsheet: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(spreadsheetsFolder, "raw");

        return uploadAndGetResult(file, params);
    }

    /**
     * Upload miscellaneous file
     */
    public Map<String, String> uploadMiscFile(MultipartFile file) throws IOException {
        validateFile(file, allowedFileFormats, maxFileSize);
        log.info("Uploading misc file: {}", file.getOriginalFilename());

        Map<String, Object> params = buildUploadParams(miscFolder, "raw");

        return uploadAndGetResult(file, params);
    }

    // ========== Utility Methods ==========

    /**
     * Generate thumbnail URL for image
     */
    public String getThumbnailUrl(String publicId) {
        return cloudinary.url()
                .transformation(new Transformation()
                        .width(200)
                        .height(200)
                        .crop("thumb")
                        .gravity("face")
                        .quality("auto"))
                .generate(publicId);
    }

    /**
     * Generate optimized image URL
     */
    public String getOptimizedImageUrl(String publicId, int width, int height) {
        return cloudinary.url()
                .transformation(new Transformation()
                        .width(width)
                        .height(height)
                        .crop("limit")
                        .quality("auto:good")
                        .fetchFormat("auto"))
                .generate(publicId);
    }

    /**
     * Delete file from Cloudinary
     */
    public void deleteFile(String publicId, String resourceType) throws IOException {
        log.info("Deleting file: {} (type: {})", publicId, resourceType);

        Map<String, Object> params = ObjectUtils.asMap(
                "resource_type", resourceType,
                "invalidate", true
        );

        cloudinary.uploader().destroy(publicId, params);
        log.info("File deleted successfully: {}", publicId);
    }

    // ========== Private Helper Methods ==========

    /**
     * Build upload parameters
     */
    private Map<String, Object> buildUploadParams(String folder, String resourceType) {
        return ObjectUtils.asMap(
                "folder", folder,
                "resource_type", resourceType,
                "secure", true,
                "use_filename", true,
                "unique_filename", true,
                "overwrite", false
        );
    }

    /**
     * Upload file and get result
     */
    private Map<String, String> uploadAndGetResult(MultipartFile file, Map<String, Object> params) throws IOException {
        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), params);

            Map<String, String> result = new HashMap<>();
            result.put("url", (String) uploadResult.get("secure_url"));
            result.put("publicId", (String) uploadResult.get("public_id"));
            result.put("format", (String) uploadResult.get("format"));
            result.put("resourceType", (String) uploadResult.get("resource_type"));
            result.put("bytes", String.valueOf(uploadResult.get("bytes")));
            result.put("width", String.valueOf(uploadResult.get("width")));
            result.put("height", String.valueOf(uploadResult.get("height")));

            log.info("File uploaded successfully: {}", result.get("url"));
            return result;

        } catch (IOException e) {
            log.error("Cloudinary upload failed for file: {}", file.getOriginalFilename(), e);
            throw new IOException("Failed to upload file to Cloudinary: " + e.getMessage(), e);
        }
    }

    /**
     * Validate file before upload
     */
    private void validateFile(MultipartFile file, String allowedFormats, long maxSize) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty or null");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("File name is missing");
        }

        String extension = getFileExtension(originalFilename);
        if (!isFormatAllowed(extension, allowedFormats)) {
            throw new IllegalArgumentException(
                    String.format("File format '%s' is not allowed. Allowed formats: %s", 
                            extension, allowedFormats));
        }

        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException(
                    String.format("File size exceeds maximum limit of %d bytes", maxSize));
        }

        if (isImageUpload(allowedFormats)) {
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("File must be an image");
            }

            if (shouldDecodeImage(extension)) {
                try {
                    BufferedImage image = ImageIO.read(file.getInputStream());
                    if (image == null) {
                        log.warn("ImageIO could not decode image. filename={}, contentType={}, size={}, extension={}",
                                originalFilename, contentType, file.getSize(), extension);
                    }
                } catch (IOException e) {
                    log.warn("ImageIO failed to decode image. filename={}, contentType={}, size={}, extension={}",
                            originalFilename, contentType, file.getSize(), extension, e);
                }
            }
        }
    }

    private boolean isImageUpload(String allowedFormats) {
        return allowedFormats != null && allowedFormats.equalsIgnoreCase(allowedImageFormats);
    }

    private boolean shouldDecodeImage(String extension) {
        if (extension == null) {
            return false;
        }
        return Set.of("jpg", "jpeg", "png", "gif", "bmp").contains(extension.toLowerCase());
    }

    /**
     * Get file extension
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }

        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return "";
        }

        return filename.substring(lastDotIndex + 1).toLowerCase();
    }

    /**
     * Check if file format is allowed
     */
    private boolean isFormatAllowed(String extension, String allowedFormats) {
        if (extension == null || extension.isEmpty()) {
            return false;
        }

        String[] formats = allowedFormats.toLowerCase().split(",");
        return Arrays.asList(formats).contains(extension.toLowerCase());
    }

    /**
     * Generate unique filename
     */
    public String generateUniqueFileName(String originalFilename) {
        String extension = getFileExtension(originalFilename);
        String timestamp = String.valueOf(System.currentTimeMillis());
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return String.format("%s_%s.%s", timestamp, uuid, extension);
    }
}
