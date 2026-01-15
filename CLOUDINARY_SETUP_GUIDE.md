# 🎨 Cloudinary Media Storage Setup Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Configuration](#configuration)
- [Media Types](#media-types)
- [Folder Structure](#folder-structure)
- [Upload Limits](#upload-limits)
- [Allowed Formats](#allowed-formats)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## 🌟 Overview

Cloudinary is configured as the primary media storage solution for SabaHub, supporting:
- ✅ **Images** (profiles, posts, logos, galleries)
- ✅ **Videos** (training, promotional, user content)
- ✅ **Audio** (podcasts, voice notes, audio content)
- ✅ **Documents** (resumes, contracts, reports, certificates)
- ✅ **Files** (archives, spreadsheets, misc files)

## 🔧 Configuration

### Environment Variables (.env)

```env
# Core Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=dljfns1nm
CLOUDINARY_API_KEY=532585927464811
CLOUDINARY_API_SECRET=CdeJPjf1MRY7E-zFdWxjHnDAA9o
CLOUDINARY_SECURE=true
```

### Get Your Credentials
1. Sign up at [Cloudinary.com](https://cloudinary.com/)
2. Go to Dashboard
3. Copy:
   - Cloud Name
   - API Key
   - API Secret

## 📁 Media Types

### 1. Images 🖼️
**Resource Type**: `image`
**Upload Folders**:
- `sabahub/images/profiles` - User profile pictures
- `sabahub/images/posts` - Post images
- `sabahub/images/gallery` - Gallery images
- `sabahub/images/logos` - Company logos

**Formats**: jpg, jpeg, png, gif, webp, svg, bmp, ico
**Max Size**: 10 MB
**Max Dimensions**: 4096 x 4096 px

### 2. Videos 🎥
**Resource Type**: `video`
**Upload Folders**:
- `sabahub/videos/training` - Training videos
- `sabahub/videos/promotional` - Marketing videos
- `sabahub/videos/user-content` - User-uploaded videos

**Formats**: mp4, avi, mov, wmv, flv, webm, mkv, m4v
**Max Size**: 100 MB
**Max Duration**: 10 minutes (600 seconds)

### 3. Audio 🎵
**Resource Type**: `video` (Cloudinary treats audio as video)
**Upload Folders**:
- `sabahub/audios/podcasts` - Podcast episodes
- `sabahub/audios/voice-notes` - Voice recordings
- `sabahub/audios/content` - Audio content

**Formats**: mp3, wav, ogg, aac, flac, m4a, wma
**Max Size**: 50 MB
**Max Duration**: 30 minutes (1800 seconds)

### 4. Documents 📄
**Resource Type**: `raw`
**Upload Folders**:
- `sabahub/documents/resumes` - Job applicant resumes
- `sabahub/documents/contracts` - Employment contracts
- `sabahub/documents/reports` - Business reports
- `sabahub/documents/certificates` - Certificates

**Formats**: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, rtf, odt
**Max Size**: 20 MB

### 5. Files 📦
**Resource Type**: `raw`
**Upload Folders**:
- `sabahub/files/archives` - ZIP, RAR files
- `sabahub/files/spreadsheets` - Excel, CSV files
- `sabahub/files/misc` - Other files

**Formats**: zip, rar, 7z, tar, gz, csv, json, xml
**Max Size**: 50 MB

## 📂 Folder Structure

```
sabahub/
├── images/
│   ├── profiles/          # User avatars
│   ├── posts/             # Post images
│   ├── gallery/           # Gallery images
│   └── logos/             # Company logos
├── videos/
│   ├── training/          # Training videos
│   ├── promotional/       # Marketing videos
│   └── user-content/      # User uploads
├── audios/
│   ├── podcasts/          # Podcast episodes
│   ├── voice-notes/       # Voice recordings
│   └── content/           # Audio content
├── documents/
│   ├── resumes/           # Job applications
│   ├── contracts/         # Legal documents
│   ├── reports/           # Business reports
│   └── certificates/      # Certificates
└── files/
    ├── archives/          # Compressed files
    ├── spreadsheets/      # Excel/CSV files
    └── misc/              # Other files
```

## 📊 Upload Limits

| Media Type | Max Size | Additional Limits |
|------------|----------|-------------------|
| **Images** | 10 MB | 4096 x 4096 px max dimensions |
| **Videos** | 100 MB | 10 minutes max duration |
| **Audio** | 50 MB | 30 minutes max duration |
| **Documents** | 20 MB | - |
| **Files** | 50 MB | - |

## 🎯 Allowed Formats

### Images
```
jpg, jpeg, png, gif, webp, svg, bmp, ico
```

### Videos
```
mp4, avi, mov, wmv, flv, webm, mkv, m4v
```

### Audio
```
mp3, wav, ogg, aac, flac, m4a, wma
```

### Documents
```
pdf, doc, docx, xls, xlsx, ppt, pptx, txt, rtf, odt
```

### Files/Archives
```
zip, rar, 7z, tar, gz, csv, json, xml
```

## 💡 Usage Examples

### Upload Image (Java)
```java
@Autowired
private Cloudinary cloudinary;

@Value("${cloudinary.folder.profile-images}")
private String profileImagesFolder;

public String uploadProfileImage(MultipartFile file) throws IOException {
    Map<String, Object> params = new HashMap<>();
    params.put("folder", profileImagesFolder);
    params.put("resource_type", "image");
    params.put("quality", "auto:good");
    params.put("fetch_format", "auto");
    
    Map uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
    return (String) uploadResult.get("secure_url");
}
```

### Upload Video (Java)
```java
public String uploadTrainingVideo(MultipartFile file) throws IOException {
    Map<String, Object> params = new HashMap<>();
    params.put("folder", "sabahub/videos/training");
    params.put("resource_type", "video");
    params.put("quality", "auto:good");
    
    Map uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
    return (String) uploadResult.get("secure_url");
}
```

### Upload Document (Java)
```java
public String uploadResume(MultipartFile file) throws IOException {
    Map<String, Object> params = new HashMap<>();
    params.put("folder", "sabahub/documents/resumes");
    params.put("resource_type", "raw");
    
    Map uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
    return (String) uploadResult.get("secure_url");
}
```

### Upload Audio (Java)
```java
public String uploadPodcast(MultipartFile file) throws IOException {
    Map<String, Object> params = new HashMap<>();
    params.put("folder", "sabahub/audios/podcasts");
    params.put("resource_type", "video"); // Audio uses video resource type
    
    Map uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
    return (String) uploadResult.get("secure_url");
}
```

### Get Optimized Image URL
```java
public String getOptimizedImageUrl(String publicId) {
    return cloudinary.url()
        .transformation(new Transformation()
            .quality("auto:good")
            .fetchFormat("auto")
            .width(800)
            .height(800)
            .crop("limit"))
        .generate(publicId);
}
```

### Generate Thumbnail
```java
public String getThumbnailUrl(String publicId) {
    return cloudinary.url()
        .transformation(new Transformation()
            .width(200)
            .height(200)
            .crop("thumb")
            .gravity("face"))
        .generate(publicId);
}
```

### Delete File
```java
public void deleteFile(String publicId, String resourceType) throws IOException {
    Map<String, Object> params = new HashMap<>();
    params.put("resource_type", resourceType);
    
    cloudinary.uploader().destroy(publicId, params);
}
```

## 🎯 Best Practices

### 1. File Validation
```java
public boolean isValidImage(MultipartFile file) {
    String[] allowedFormats = {"jpg", "jpeg", "png", "gif", "webp"};
    String extension = getFileExtension(file.getOriginalFilename());
    return Arrays.asList(allowedFormats).contains(extension.toLowerCase());
}

public boolean isValidSize(MultipartFile file, long maxSize) {
    return file.getSize() <= maxSize;
}
```

### 2. Secure URLs
Always use HTTPS URLs for security:
```java
params.put("secure", true);
String url = (String) uploadResult.get("secure_url"); // Not "url"
```

### 3. Error Handling
```java
try {
    Map uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
    return (String) uploadResult.get("secure_url");
} catch (IOException e) {
    log.error("Cloudinary upload failed: {}", e.getMessage());
    throw new MediaUploadException("Failed to upload media", e);
}
```

### 4. Folder Organization
- Use consistent folder naming
- Group by purpose/type
- Keep folder structure shallow (max 3 levels)

### 5. File Naming
```java
public String generateUniqueFileName(String originalFilename) {
    String extension = getFileExtension(originalFilename);
    String timestamp = String.valueOf(System.currentTimeMillis());
    String uuid = UUID.randomUUID().toString().substring(0, 8);
    return String.format("%s_%s.%s", timestamp, uuid, extension);
}
```

### 6. Transformations
Apply transformations on-the-fly:
```java
// Responsive images
String responsiveUrl = cloudinary.url()
    .transformation(new Transformation()
        .quality("auto")
        .fetchFormat("auto")
        .responsive()
        .width("auto")
        .crop("scale"))
    .generate(publicId);
```

### 7. Lazy Loading
Use Cloudinary's lazy loading for better performance:
```html
<img data-src="cloudinary-url" class="cld-responsive" loading="lazy">
```

### 8. Video Streaming
For videos, use adaptive streaming:
```java
String videoUrl = cloudinary.url()
    .transformation(new Transformation()
        .streamingProfile("full_hd")
        .format("m3u8"))
    .generate(videoPublicId);
```

## 🔐 Security

### 1. Signed URLs
For sensitive content, use signed URLs:
```java
public String getSignedUrl(String publicId, long expiresIn) {
    return cloudinary.url()
        .signed(true)
        .type("authenticated")
        .generate(publicId);
}
```

### 2. Access Control
Implement access control in your backend:
```java
@PreAuthorize("hasRole('USER')")
public String uploadFile(MultipartFile file) {
    // Upload logic
}
```

### 3. Rate Limiting
Limit upload frequency:
```java
@RateLimiter(name = "upload", fallbackMethod = "uploadFallback")
public String uploadFile(MultipartFile file) {
    // Upload logic
}
```

## 📈 Monitoring

### Check Cloudinary Usage
Visit your [Cloudinary Dashboard](https://cloudinary.com/console) to monitor:
- Storage usage
- Bandwidth usage
- Transformations
- API calls

### Logging
```java
@Slf4j
@Service
public class MediaService {
    public String uploadMedia(MultipartFile file) {
        log.info("Uploading file: {}, size: {} bytes", 
            file.getOriginalFilename(), file.getSize());
        
        // Upload logic
        
        log.info("File uploaded successfully: {}", url);
        return url;
    }
}
```

## 🚀 Performance Tips

1. **Use Auto Quality**: `quality: "auto:good"`
2. **Enable Auto Format**: `fetch_format: "auto"`
3. **Lazy Load Images**: Use lazy loading attributes
4. **CDN Caching**: Leverage Cloudinary's CDN
5. **Compress Before Upload**: Pre-compress large files
6. **Use Thumbnails**: Generate thumbnails for lists/grids
7. **Batch Operations**: Upload multiple files in parallel
8. **Progressive Loading**: Use progressive JPEGs

## 📞 Support

- **Cloudinary Docs**: [cloudinary.com/documentation](https://cloudinary.com/documentation)
- **API Reference**: [cloudinary.com/documentation/image_upload_api_reference](https://cloudinary.com/documentation/image_upload_api_reference)
- **Community**: [community.cloudinary.com](https://community.cloudinary.com)

## ✅ Quick Checklist

- [ ] Cloudinary account created
- [ ] Credentials added to `.env`
- [ ] Folder structure configured
- [ ] File size limits set
- [ ] Allowed formats defined
- [ ] Upload endpoints tested
- [ ] Error handling implemented
- [ ] Security measures in place
- [ ] Monitoring setup complete

---

**SabaHub Media Storage** | Powered by Cloudinary ☁️
