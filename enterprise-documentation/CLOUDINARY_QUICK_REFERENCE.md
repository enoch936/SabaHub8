# 📸 Cloudinary Media Upload - Quick Reference

## 🎯 Overview
Complete Cloudinary integration for SabaHub supporting all media types with organized folder structure and comprehensive upload limits.

## 📁 Media Types Supported

| Type | Max Size | Formats | Folder |
|------|----------|---------|--------|
| **Images** | 10 MB | jpg, jpeg, png, gif, webp, svg, bmp, ico | `sabahub/images/*` |
| **Videos** | 100 MB | mp4, avi, mov, wmv, flv, webm, mkv, m4v | `sabahub/videos/*` |
| **Audio** | 50 MB | mp3, wav, ogg, aac, flac, m4a, wma | `sabahub/audios/*` |
| **Documents** | 20 MB | pdf, doc, docx, xls, xlsx, ppt, pptx, txt, rtf, odt | `sabahub/documents/*` |
| **Files** | 50 MB | zip, rar, 7z, tar, gz, csv, json, xml | `sabahub/files/*` |

## 🔑 Environment Variables

```env
# Core Credentials
CLOUDINARY_CLOUD_NAME=dljfns1nm
CLOUDINARY_API_KEY=532585927464811
CLOUDINARY_API_SECRET=CdeJPjf1MRY7E-zFdWxjHnDAA9o
CLOUDINARY_SECURE=true

# Upload Limits (bytes)
CLOUDINARY_MAX_IMAGE_SIZE=10485760       # 10 MB
CLOUDINARY_MAX_VIDEO_SIZE=104857600      # 100 MB
CLOUDINARY_MAX_AUDIO_SIZE=52428800       # 50 MB
CLOUDINARY_MAX_DOCUMENT_SIZE=20971520    # 20 MB
CLOUDINARY_MAX_FILE_SIZE=52428800        # 50 MB
```

## 🌐 API Endpoints

### Authentication Required
All endpoints require JWT Bearer token in Authorization header.

### Image Uploads

```http
POST /api/media/upload/profile-image
POST /api/media/upload/post-image
POST /api/media/upload/gallery-image
POST /api/media/upload/company-logo
```

### Video Uploads

```http
POST /api/media/upload/training-video
POST /api/media/upload/promo-video
POST /api/media/upload/user-video
```

### Audio Uploads

```http
POST /api/media/upload/podcast
POST /api/media/upload/voice-note
POST /api/media/upload/audio-content
```

### Document Uploads

```http
POST /api/media/upload/resume
POST /api/media/upload/contract
POST /api/media/upload/report
POST /api/media/upload/certificate
```

### File Uploads

```http
POST /api/media/upload/archive
POST /api/media/upload/spreadsheet
POST /api/media/upload/misc-file
```

### Utility Endpoints

```http
GET  /api/media/thumbnail/{publicId}
GET  /api/media/optimized/{publicId}?width=800&height=800
DELETE /api/media/delete/{resourceType}/{publicId}
```

## 📤 Upload Request Format

### Using cURL
```bash
curl -X POST http://localhost:8080/api/media/upload/profile-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

### Using JavaScript/Fetch
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:8080/api/media/upload/profile-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  },
  body: formData
});

const result = await response.json();
console.log('Uploaded:', result.url);
```

### Using Postman
1. Import collection: `SabaHub_Cloudinary_Media.postman_collection.json`
2. Login to get JWT token (saved automatically)
3. Select upload endpoint
4. Choose file in Body > form-data
5. Send request

## 📥 Response Format

### Success Response
```json
{
  "url": "https://res.cloudinary.com/dljfns1nm/image/upload/v1234567890/sabahub/images/profiles/sample.jpg",
  "publicId": "sabahub/images/profiles/sample",
  "format": "jpg",
  "resourceType": "image",
  "bytes": "524288",
  "width": "800",
  "height": "600"
}
```

### Error Response
```json
{
  "error": "File format 'bmp' is not allowed. Allowed formats: jpg,jpeg,png,gif,webp,svg"
}
```

## 🔒 Security & Permissions

| Endpoint | Roles Allowed |
|----------|---------------|
| Profile Image | USER, ADMIN, EMPLOYER |
| Post Image | USER, ADMIN, EMPLOYER |
| Gallery Image | USER, ADMIN, EMPLOYER |
| Company Logo | **ADMIN, EMPLOYER** |
| Training Video | **ADMIN, EMPLOYER** |
| Promo Video | **ADMIN, EMPLOYER** |
| User Video | USER, ADMIN, EMPLOYER |
| Podcast | **ADMIN, EMPLOYER** |
| Voice Note | USER, ADMIN, EMPLOYER |
| Audio Content | USER, ADMIN, EMPLOYER |
| Resume | **USER, ADMIN** |
| Contract | **ADMIN, EMPLOYER** |
| Report | **ADMIN, EMPLOYER** |
| Certificate | USER, ADMIN, EMPLOYER |
| Archive | USER, ADMIN, EMPLOYER |
| Spreadsheet | USER, ADMIN, EMPLOYER |
| Misc File | USER, ADMIN, EMPLOYER |

## 📂 Folder Structure

```
sabahub/
├── images/
│   ├── profiles/          # User profile pictures
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

## 🚀 Quick Start

### 1. Setup Cloudinary Account
```bash
# Sign up at: https://cloudinary.com/
# Get your credentials from Dashboard
```

### 2. Configure Environment
```bash
# Edit backend-spring/.env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Start Backend
```bash
cd backend-spring
./mvnw spring-boot:run
```

### 4. Test Upload
```bash
# Login first
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sabahub.local","password":"Admin@12345"}'

# Upload image (use token from login response)
curl -X POST http://localhost:8080/api/media/upload/profile-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@image.jpg"
```

## ⚙️ Configuration Files

- **Environment**: `backend-spring/.env`
- **Properties**: `backend-spring/src/main/resources/application.properties`
- **Service**: `backend-spring/src/main/java/com/sabahub/service/CloudinaryMediaService.java`
- **Controller**: `backend-spring/src/main/java/com/sabahub/controller/MediaUploadController.java`
- **Config**: `backend-spring/src/main/java/com/sabahub/config/CloudinaryConfig.java`

## 📚 Documentation

- **Full Guide**: [CLOUDINARY_SETUP_GUIDE.md](CLOUDINARY_SETUP_GUIDE.md)
- **Postman Collection**: [SabaHub_Cloudinary_Media.postman_collection.json](SabaHub_Cloudinary_Media.postman_collection.json)
- **Official Docs**: [cloudinary.com/documentation](https://cloudinary.com/documentation)

## 🔍 Common Issues

### Issue: File too large
**Solution**: Check file size against limits in `.env`

### Issue: Format not allowed
**Solution**: Verify file extension matches allowed formats

### Issue: Authentication failed
**Solution**: Ensure valid JWT token in Authorization header

### Issue: Upload failed
**Solution**: Check Cloudinary credentials and internet connection

## 💡 Best Practices

1. ✅ Always validate files before upload
2. ✅ Use appropriate endpoint for media type
3. ✅ Compress large files before upload
4. ✅ Use thumbnails for lists/previews
5. ✅ Delete unused files to save space
6. ✅ Monitor Cloudinary usage dashboard
7. ✅ Use optimized URLs for better performance
8. ✅ Implement proper error handling

## 📊 Monitoring

Check your Cloudinary Dashboard:
- Storage Usage
- Bandwidth Usage
- Transformations
- API Calls

Visit: [cloudinary.com/console](https://cloudinary.com/console)

## 🎯 Testing Checklist

- [ ] Configure Cloudinary credentials
- [ ] Start backend server
- [ ] Login to get JWT token
- [ ] Test image upload
- [ ] Test video upload
- [ ] Test audio upload
- [ ] Test document upload
- [ ] Test file upload
- [ ] Test thumbnail generation
- [ ] Test file deletion
- [ ] Verify files in Cloudinary Dashboard

---

**Last Updated**: January 2026
**Version**: 1.0.0
