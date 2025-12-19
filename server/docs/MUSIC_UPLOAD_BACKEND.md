# Music Upload Backend Documentation

## Overview

The music upload backend provides comprehensive file upload capabilities for the music playlist system. It supports single file uploads, multiple file uploads, and folder uploads with automatic metadata extraction and validation.

## Requirements Implemented

- **1.1**: File upload interface with drag-and-drop support
- **9.1**: File type validation (MP3, WAV, M4A)
- **9.2**: File size validation (50MB maximum)
- **9.3**: Error handling for invalid files
- **9.4**: Duplicate filename handling (automatic unique naming)

## Architecture

### Components

1. **Multer Configuration** (`server/config/multer.js`)
   - Configures file upload handling
   - Implements file validation
   - Manages upload directory
   - Sanitizes filenames

2. **Audio Metadata Utility** (`server/utils/audioMetadata.js`)
   - Extracts metadata from audio files
   - Parses ID3 tags (basic implementation)
   - Falls back to filename parsing
   - Provides file information

3. **Upload Routes** (`server/routes/music.js`)
   - Single file upload endpoint
   - Multiple file upload endpoint
   - Folder upload endpoint
   - Upload status tracking
   - Upload cancellation

## API Endpoints

### POST /api/admin/music/upload

Upload a single music file.

**Request:**

- Method: `POST`
- Content-Type: `multipart/form-data`
- Authentication: Required (JWT token)
- CSRF Protection: Required

**Form Data:**

- `file`: Audio file (MP3, WAV, or M4A)

**Response:**

```json
{
  "ok": true,
  "message": "File uploaded successfully",
  "data": {
    "filename": "song_1234567890_abc123.mp3",
    "originalName": "song.mp3",
    "size": 4288502,
    "path": "/music/song_1234567890_abc123.mp3",
    "mimetype": "audio/mpeg",
    "metadata": {
      "title": "Song Title",
      "artist": "Artist Name",
      "duration": 0,
      "source": "filename"
    }
  }
}
```

**Error Response:**

```json
{
  "ok": false,
  "message": "Invalid file type. Only .mp3, .wav, .m4a files are allowed.",
  "code": "UPLOAD_ERROR"
}
```

### POST /api/admin/music/upload/multiple

Upload multiple music files at once.

**Request:**

- Method: `POST`
- Content-Type: `multipart/form-data`
- Authentication: Required (JWT token)
- CSRF Protection: Required

**Form Data:**

- `files`: Array of audio files (max 10 files)

**Response:**

```json
{
  "ok": true,
  "message": "Uploaded 3 of 3 files successfully",
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0
  },
  "results": [
    {
      "success": true,
      "filename": "song1_1234567890_abc123.mp3",
      "originalName": "song1.mp3",
      "size": 4288502,
      "path": "/music/song1_1234567890_abc123.mp3",
      "mimetype": "audio/mpeg",
      "metadata": {
        "title": "Song 1",
        "artist": "Artist",
        "duration": 0,
        "source": "filename"
      }
    }
  ]
}
```

### POST /api/admin/music/upload/folder

Upload all music files from a folder.

**Request:**

- Method: `POST`
- Content-Type: `multipart/form-data`
- Authentication: Required (JWT token)
- CSRF Protection: Required

**Form Data:**

- `files`: Array of files from folder (max 10 files)

**Response:**

```json
{
  "ok": true,
  "message": "Folder upload complete: 5 music files uploaded",
  "summary": {
    "totalFiles": 8,
    "musicFilesUploaded": 5,
    "nonMusicFilesSkipped": 2,
    "invalidFiles": 1
  },
  "results": [...],
  "skipped": [
    {
      "filename": "readme.txt",
      "reason": "Not a music file"
    }
  ],
  "errors": []
}
```

### GET /api/admin/music/upload/status/:id

Check the status of an upload (for future async upload support).

**Request:**

- Method: `GET`
- Authentication: Required (JWT token)

**Response:**

```json
{
  "ok": true,
  "data": {
    "id": "upload-123",
    "status": "complete",
    "progress": 100,
    "filename": "song.mp3"
  }
}
```

### DELETE /api/admin/music/upload/:id

Cancel an ongoing upload (placeholder for future implementation).

**Request:**

- Method: `DELETE`
- Authentication: Required (JWT token)
- CSRF Protection: Required

**Response:**

```json
{
  "ok": true,
  "message": "Upload cancelled",
  "data": {
    "id": "upload-123",
    "status": "cancelled"
  }
}
```

## File Validation

### Allowed File Types

- **Extensions**: `.mp3`, `.wav`, `.m4a`
- **MIME Types**:
  - `audio/mpeg` (MP3)
  - `audio/mp3` (MP3 alternative)
  - `audio/wav` (WAV)
  - `audio/x-wav` (WAV alternative)
  - `audio/wave` (WAV alternative)
  - `audio/mp4` (M4A)
  - `audio/x-m4a` (M4A alternative)

### File Size Limits

- **Maximum**: 50MB per file
- **Validation**: Both client-side and server-side

### Filename Sanitization

Filenames are automatically sanitized to:

- Remove special characters
- Preserve alphanumeric characters, spaces, hyphens, underscores, dots, and parentheses
- Preserve Korean characters (가-힣)
- Generate unique names to prevent overwrites

**Example:**

- Original: `My Song (2024).mp3`
- Sanitized: `My Song (2024)_1234567890_abc123.mp3`

## Metadata Extraction

### Automatic Extraction

The system attempts to extract metadata in the following order:

1. **ID3 Tags** (if available)
   - Title
   - Artist
   - Duration

2. **Filename Parsing** (fallback)
   - Supports formats:
     - `Artist - Title.mp3`
     - `Title.mp3`
     - `Artist_Title.mp3`

3. **Defaults** (if parsing fails)
   - Title: "Untitled"
   - Artist: "Unknown Artist"
   - Duration: 0 (to be calculated by client)

### Metadata Response

```json
{
  "filename": "song_1234567890_abc123.mp3",
  "title": "Song Title",
  "artist": "Artist Name",
  "duration": 0,
  "fileSize": 4288502,
  "source": "filename",
  "createdAt": "2025-11-26T02:50:46.865Z",
  "modifiedAt": "2025-11-25T07:17:33.473Z"
}
```

## Error Handling

### Upload Errors

1. **No File Provided**

   ```json
   {
     "ok": false,
     "message": "No file uploaded",
     "code": "NO_FILE"
   }
   ```

2. **Invalid File Type**

   ```json
   {
     "ok": false,
     "message": "Invalid file type. Only .mp3, .wav, .m4a files are allowed.",
     "code": "UPLOAD_ERROR"
   }
   ```

3. **File Too Large**

   ```json
   {
     "ok": false,
     "message": "File too large",
     "code": "UPLOAD_ERROR"
   }
   ```

4. **Validation Failed**
   ```json
   {
     "ok": false,
     "message": "File validation failed",
     "errors": [
       "File size exceeds maximum limit of 50MB",
       "Invalid file extension. Allowed: .mp3, .wav, .m4a"
     ],
     "code": "VALIDATION_ERROR"
   }
   ```

### Metadata Extraction Errors

If metadata extraction fails, the upload continues successfully but metadata will be null. The user can manually add metadata later through the admin interface.

## Security Considerations

### Authentication & Authorization

- All upload endpoints require JWT authentication
- CSRF protection is enforced on all upload endpoints
- Only admin users can upload files

### File Validation

- File type validation on both client and server
- File size limits enforced
- Filename sanitization to prevent path traversal
- Automatic unique filename generation to prevent overwrites

### Upload Directory

- Files are stored in `/public/music/`
- Directory is created automatically if it doesn't exist
- Proper permissions are required for the server process

## Testing

### Manual Testing

Use the test script to verify the backend:

```bash
node test-music-upload.js
```

This tests:

- File validation logic
- Metadata extraction
- Filename sanitization

### Integration Testing

To test actual file uploads:

1. Start the server: `npm run server`
2. Use Postman or curl with authentication
3. Or use the admin interface (once UI is implemented)

### Example curl Command

```bash
# Get CSRF token
CSRF_TOKEN=$(curl -s http://localhost:3001/api/csrf-token | jq -r '.csrfToken')

# Login and get token
curl -c cookies.txt -X POST http://localhost:3001/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{"username":"won kim","password":"admin123"}'

# Upload file
curl -b cookies.txt -X POST http://localhost:3001/api/admin/music/upload \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -F "file=@/path/to/song.mp3"
```

## Future Enhancements

1. **Streaming Uploads**
   - Support for large file uploads with progress tracking
   - Chunked upload support

2. **Advanced Metadata Extraction**
   - Use `music-metadata` library for accurate ID3 tag reading
   - Extract album art
   - Get accurate duration

3. **Cloud Storage Integration**
   - Support for S3, Google Cloud Storage, etc.
   - CDN integration

4. **Upload Queue Management**
   - Background job processing
   - Retry failed uploads
   - Upload history

5. **Audio Processing**
   - Automatic format conversion
   - Audio normalization
   - Thumbnail generation

## Troubleshooting

### Upload Fails with "No file uploaded"

- Ensure the form field name is `file` for single upload or `files` for multiple
- Check that the file is being sent as `multipart/form-data`
- Verify authentication token is valid

### File Validation Fails

- Check file extension is `.mp3`, `.wav`, or `.m4a`
- Verify file size is under 50MB
- Ensure MIME type is correct

### Metadata Not Extracted

- This is expected for files without ID3 tags
- Metadata can be added manually through the admin interface
- Consider using a proper ID3 tag library for better extraction

### Permission Errors

- Ensure the server has write permissions to `/public/music/`
- Check that the directory exists or can be created

## Related Files

- `server/config/multer.js` - Multer configuration
- `server/utils/audioMetadata.js` - Metadata extraction
- `server/routes/music.js` - Upload endpoints
- `test-music-upload.js` - Test script
