# 🎨 Cloudinary Media Upload Architecture

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SABAHUB FRONTEND                             │
│                      (React/Next.js Client)                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTP POST multipart/form-data
                             │ Authorization: Bearer JWT
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                     SPRING BOOT BACKEND                              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │          MediaUploadController.java                          │  │
│  │  • POST /api/media/upload/profile-image                      │  │
│  │  • POST /api/media/upload/post-image                         │  │
│  │  • POST /api/media/upload/gallery-image                      │  │
│  │  • POST /api/media/upload/company-logo                       │  │
│  │  • POST /api/media/upload/training-video                     │  │
│  │  • POST /api/media/upload/promo-video                        │  │
│  │  • POST /api/media/upload/user-video                         │  │
│  │  • POST /api/media/upload/podcast                            │  │
│  │  • POST /api/media/upload/voice-note                         │  │
│  │  • POST /api/media/upload/audio-content                      │  │
│  │  • POST /api/media/upload/resume                             │  │
│  │  • POST /api/media/upload/contract                           │  │
│  │  • POST /api/media/upload/report                             │  │
│  │  • POST /api/media/upload/certificate                        │  │
│  │  • POST /api/media/upload/archive                            │  │
│  │  • POST /api/media/upload/spreadsheet                        │  │
│  │  • POST /api/media/upload/misc-file                          │  │
│  │  • GET  /api/media/thumbnail/{publicId}                      │  │
│  │  • GET  /api/media/optimized/{publicId}                      │  │
│  │  • DELETE /api/media/delete/{resourceType}/{publicId}        │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐  │
│  │        CloudinaryMediaService.java                           │  │
│  │  • File Validation (format, size, dimensions)                │  │
│  │  • Upload Parameter Building                                 │  │
│  │  • Folder Organization                                       │  │
│  │  • Transformation Configuration                              │  │
│  │  • Error Handling                                            │  │
│  │  • URL Generation                                            │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐  │
│  │          CloudinaryConfig.java                               │  │
│  │  • Cloudinary Bean Configuration                             │  │
│  │  • Credentials Management                                    │  │
│  │  • Connection Setup                                          │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
                            │ Cloudinary SDK
                            │ HTTPS API Calls
                            │
┌───────────────────────────▼──────────────────────────────────────────┐
│                      CLOUDINARY CLOUD                                │
│                   (https://cloudinary.com)                           │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    MEDIA STORAGE                             │  │
│  │                                                              │  │
│  │  📁 sabahub/                                                 │  │
│  │  │                                                           │  │
│  │  ├─📁 images/                                                │  │
│  │  │  ├─ profiles/      (User avatars)                        │  │
│  │  │  ├─ posts/         (Post images)                         │  │
│  │  │  ├─ gallery/       (Gallery images)                      │  │
│  │  │  └─ logos/         (Company logos)                       │  │
│  │  │                                                           │  │
│  │  ├─📁 videos/                                                │  │
│  │  │  ├─ training/      (Training videos)                     │  │
│  │  │  ├─ promotional/   (Marketing videos)                    │  │
│  │  │  └─ user-content/  (User uploads)                        │  │
│  │  │                                                           │  │
│  │  ├─📁 audios/                                                │  │
│  │  │  ├─ podcasts/      (Podcast episodes)                    │  │
│  │  │  ├─ voice-notes/   (Voice recordings)                    │  │
│  │  │  └─ content/       (Audio content)                       │  │
│  │  │                                                           │  │
│  │  ├─📁 documents/                                             │  │
│  │  │  ├─ resumes/       (Job applications)                    │  │
│  │  │  ├─ contracts/     (Legal documents)                     │  │
│  │  │  ├─ reports/       (Business reports)                    │  │
│  │  │  └─ certificates/  (Certificates)                        │  │
│  │  │                                                           │  │
│  │  └─📁 files/                                                 │  │
│  │     ├─ archives/      (Compressed files)                    │  │
│  │     ├─ spreadsheets/  (Excel/CSV files)                     │  │
│  │     └─ misc/          (Other files)                         │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              CLOUDINARY CDN & TRANSFORMATIONS                │  │
│  │  • Image Optimization (quality, format)                      │  │
│  │  • Image Resizing & Cropping                                 │  │
│  │  • Thumbnail Generation                                      │  │
│  │  • Video Transcoding                                         │  │
│  │  • Responsive Images                                         │  │
│  │  • CDN Distribution                                          │  │
│  │  • Secure URL Generation                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## 🔄 Upload Flow Sequence

```
User          Frontend         Backend          Cloudinary
 │                │                │                 │
 │  Select File   │                │                 │
 │───────────────>│                │                 │
 │                │                │                 │
 │                │ POST /upload   │                 │
 │                │───────────────>│                 │
 │                │  + JWT Token   │                 │
 │                │  + File        │                 │
 │                │                │                 │
 │                │                │ Validate Token  │
 │                │                │────────────┐    │
 │                │                │<───────────┘    │
 │                │                │                 │
 │                │                │ Validate File   │
 │                │                │────────────┐    │
 │                │                │<───────────┘    │
 │                │                │                 │
 │                │                │ Upload File     │
 │                │                │────────────────>│
 │                │                │                 │
 │                │                │              Store File
 │                │                │              Process/Transform
 │                │                │              Generate URL
 │                │                │                 │
 │                │                │ Response (URL)  │
 │                │                │<────────────────│
 │                │                │                 │
 │                │ Success        │                 │
 │                │<───────────────│                 │
 │                │ {url, publicId}│                 │
 │                │                │                 │
 │  Show Success  │                │                 │
 │<───────────────│                │                 │
 │  Display Image │                │                 │
 │                │                │                 │
```

## 📋 File Validation Process

```
┌─────────────────────────────────────────────────────────┐
│              FILE VALIDATION PIPELINE                   │
└─────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ File Received│
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐      ❌ Reject
    │  Null Check  │─────────────> "File is empty"
    └──────┬───────┘
           │ ✅ Pass
           ▼
    ┌──────────────┐      ❌ Reject
    │ Name Check   │─────────────> "File name missing"
    └──────┬───────┘
           │ ✅ Pass
           ▼
    ┌──────────────┐      ❌ Reject
    │Format Check  │─────────────> "Format not allowed"
    └──────┬───────┘
           │ ✅ Pass
           ▼
    ┌──────────────┐      ❌ Reject
    │ Size Check   │─────────────> "File too large"
    └──────┬───────┘
           │ ✅ Pass
           ▼
    ┌──────────────┐
    │Upload to     │
    │Cloudinary    │
    └──────────────┘
```

## 🎯 Resource Type Mapping

```
┌──────────────────────────────────────────────────────────────┐
│               CLOUDINARY RESOURCE TYPES                      │
└──────────────────────────────────────────────────────────────┘

Media Type       Cloudinary Type    Folder Prefix
────────────────────────────────────────────────────────────────
Images           image              sabahub/images/
Videos           video              sabahub/videos/
Audio            video*             sabahub/audios/
Documents        raw                sabahub/documents/
Files            raw                sabahub/files/

* Note: Audio files use "video" resource type in Cloudinary
```

## 🔒 Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                  SECURITY ARCHITECTURE                  │
└─────────────────────────────────────────────────────────┘

Layer 1: JWT Authentication
├─ Valid token required for all uploads
├─ Token contains user roles
└─ Expired tokens rejected

Layer 2: Role-Based Authorization
├─ @PreAuthorize annotations
├─ Different roles for different endpoints
└─ ADMIN, EMPLOYER, USER roles

Layer 3: File Validation
├─ Format whitelist
├─ Size limits
├─ Filename sanitization
└─ MIME type verification

Layer 4: Cloudinary Security
├─ API secret protection
├─ Secure HTTPS uploads
├─ CDN with SSL/TLS
└─ Optional signed URLs
```

## 📊 Upload Limits Matrix

```
┌──────────────────────────────────────────────────────────────────┐
│                     UPLOAD LIMITS TABLE                          │
└──────────────────────────────────────────────────────────────────┘

Category     Type           Max Size    Dimensions      Duration
─────────────────────────────────────────────────────────────────────
IMAGES       Profile        10 MB       4096×4096       N/A
             Post           10 MB       4096×4096       N/A
             Gallery        10 MB       4096×4096       N/A
             Logo           10 MB       4096×4096       N/A

VIDEOS       Training       100 MB      N/A             10 min
             Promo          100 MB      N/A             10 min
             User           100 MB      N/A             10 min

AUDIO        Podcast        50 MB       N/A             30 min
             Voice Note     50 MB       N/A             30 min
             Content        50 MB       N/A             30 min

DOCUMENTS    Resume         20 MB       N/A             N/A
             Contract       20 MB       N/A             N/A
             Report         20 MB       N/A             N/A
             Certificate    20 MB       N/A             N/A

FILES        Archive        50 MB       N/A             N/A
             Spreadsheet    50 MB       N/A             N/A
             Misc           50 MB       N/A             N/A
```

## 🎨 Image Transformation Examples

```
┌─────────────────────────────────────────────────────────────┐
│              CLOUDINARY TRANSFORMATIONS                     │
└─────────────────────────────────────────────────────────────┘

Original Image:
https://res.cloudinary.com/.../sabahub/images/profiles/user.jpg

↓ Transform: Thumbnail (200×200, face detection)
https://res.cloudinary.com/.../w_200,h_200,c_thumb,g_face/...

↓ Transform: Optimized (auto quality, auto format)
https://res.cloudinary.com/.../q_auto,f_auto/...

↓ Transform: Responsive (auto width, scale)
https://res.cloudinary.com/.../w_auto,c_scale/...

↓ Transform: HD (limit 1920×1080)
https://res.cloudinary.com/.../w_1920,h_1080,c_limit/...
```

## 🚀 Performance Optimizations

```
┌─────────────────────────────────────────────────────────────┐
│              PERFORMANCE FEATURES                           │
└─────────────────────────────────────────────────────────────┘

Frontend Optimization:
├─ Lazy loading images
├─ Progressive image loading
├─ WebP format support
└─ Responsive images (srcset)

Backend Optimization:
├─ Async upload processing
├─ Stream-based file handling
├─ Connection pooling
└─ Error retry logic

Cloudinary Optimization:
├─ CDN edge caching
├─ Auto format selection
├─ Auto quality adjustment
├─ Responsive breakpoints
└─ Image compression
```

## 📈 Monitoring & Analytics

```
┌─────────────────────────────────────────────────────────────┐
│                 CLOUDINARY DASHBOARD                        │
└─────────────────────────────────────────────────────────────┘

Metrics to Monitor:
├─ Storage Usage (GB)
├─ Bandwidth Usage (GB/month)
├─ Transformations (count)
├─ API Calls (count)
├─ Credits Consumed
└─ Upload Success Rate

Access: https://cloudinary.com/console

Alerts:
├─ Storage limit approaching
├─ Bandwidth threshold reached
├─ API rate limit hit
└─ Failed uploads spike
```

---

**Architecture Version**: 1.0.0  
**Last Updated**: January 2026  
**Technology Stack**: Spring Boot + Cloudinary SDK + React/Next.js
