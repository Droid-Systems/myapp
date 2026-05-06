# Simplified PDF Access - No Frontend Verification

## 🎯 Overview

PDF access has been simplified to verify passcodes **only on the backend** when serving PDFs. The frontend passcode modal has been removed.

## ✅ What Changed

### Before (Two-Step Verification):
```
1. User clicks PDF → Passcode modal appears
2. Frontend verifies: POST /api/pdf/verify-passcode
3. If valid, construct URL with passcode
4. Backend verifies again when serving PDF
```

### After (Single Backend Verification):
```
1. User clicks PDF with passcode in URL
2. Backend verifies passcode when serving PDF
3. PDF is served if passcode is valid
```

## 🔐 How It Works Now

### URL Format

**PDF Links** now include the passcode directly:
```
/pdf-viewer?file=/pdfs/prospectus.pdf&passcode=SecureCode123!
```

The PDF viewer constructs the backend URL:
```
/api/pdf/serve/prospectus.pdf?passcode=SecureCode123!
```

### Flow Diagram

```
User clicks PDF link
    ↓
URL contains: /pdf-viewer?file=X&passcode=Y
    ↓
PDF Viewer extracts filename and passcode
    ↓
Constructs: /api/pdf/serve/filename.pdf?passcode=Y
    ↓
Backend endpoint /api/pdf/serve/:filename
    ↓
Verifies passcode from query parameter
    ↓
If valid → Stream PDF file
If invalid → Return 401 error
```

## 🛠️ Frontend Configuration

### 1. Environment Variable

Add to your frontend `.env.local`:

```env
# Default PDF passcode (should match one of the backend passcodes)
NEXT_PUBLIC_PDF_PASSCODE=SecureCode123!
```

### 2. Updated Files

#### `src/app/pdf-viewer/page.tsx`
- ✅ Removed passcode modal
- ✅ Gets passcode from URL parameter `?passcode=X`
- ✅ Constructs secure backend URL `/api/pdf/serve/:filename?passcode=X`
- ✅ Shows error if no passcode provided

#### `src/components/Header/index.tsx`
- ✅ Includes passcode in PDF menu links
- ✅ Uses `NEXT_PUBLIC_PDF_PASSCODE` environment variable
- ✅ Format: `/pdf-viewer?file=X&passcode=Y`

## 📋 Backend Implementation

### PDF Serving Endpoint

**File**: `backend/src/routes/pdf.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Secure PDF Serving Endpoint
router.get('/serve/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { passcode } = req.query;

    // 1. Validate passcode is provided
    if (!passcode) {
      return res.status(401).json({
        success: false,
        message: 'Passcode required to access PDF'
      });
    }

    // 2. Get allowed passcodes from environment
    const passcodesString = process.env.PDF_ACCESS_PASSCODES;

    if (!passcodesString) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // 3. Parse passcodes (comma-separated)
    let allowedPasscodes = passcodesString
      .split(',')
      .map(code => code.trim())
      .filter(code => code.length > 0);

    // 4. Verify passcode matches any allowed passcode
    if (!allowedPasscodes.includes(passcode)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid passcode'
      });
    }

    // 5. Security: Only allow PDFs from the pdfs directory
    const safePath = path.join(__dirname, '../../public/pdfs', path.basename(filename));

    // 6. Check if file exists
    if (!fs.existsSync(safePath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF file not found'
      });
    }

    // 7. Set headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // 8. Stream the PDF file
    const fileStream = fs.createReadStream(safePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve PDF file'
    });
  }
});

module.exports = router;
```

### Backend Environment Variable

**File**: `backend/.env`

```env
# Multiple passcodes (comma-separated, up to 10)
PDF_ACCESS_PASSCODES=SecureCode123!,AdminPass456#,UserCode789@
```

## 🔒 Security Notes

### ✅ Pros
- Simpler implementation
- No frontend API calls for verification
- Backend is single source of truth
- Easier to maintain

### ⚠️ Important
- **Passcode visible in URL**: Users can see the passcode in browser URL
- **Use HTTPS**: Critical to prevent passcode interception
- **Share carefully**: Only share PDF links with authorized users
- **Rotate passcodes**: Change passcodes periodically
- **Block direct access**: Ensure `/pdfs/` folder is not publicly accessible

## 📝 Example Usage

### 1. Database Record

```sql
INSERT INTO pdf_documents (title, file_url, display_order) VALUES
  ('Investment Prospectus', '/pdfs/prospectus.pdf', 1);
```

### 2. Frontend Menu Item

```tsx
{
  id: 41,
  title: "Investment Prospectus",
  path: "/pdf-viewer?file=/pdfs/prospectus.pdf&passcode=SecureCode123!",
  newTab: true
}
```

### 3. Backend URL

```
GET /api/pdf/serve/prospectus.pdf?passcode=SecureCode123!
```

### 4. User Experience

1. User clicks "Investment Prospectus" in Documents menu
2. New tab opens: `/pdf-viewer?file=/pdfs/prospectus.pdf&passcode=SecureCode123!`
3. PDF Viewer requests: `/api/pdf/serve/prospectus.pdf?passcode=SecureCode123!`
4. Backend verifies passcode
5. PDF is displayed

## 🧪 Testing

### Test Valid Passcode

```bash
curl "http://localhost:4000/api/pdf/serve/prospectus.pdf?passcode=SecureCode123!" \
  --output test.pdf
```

**Expected**: PDF file downloaded successfully

### Test Invalid Passcode

```bash
curl "http://localhost:4000/api/pdf/serve/prospectus.pdf?passcode=WrongCode"
```

**Expected**:
```json
{
  "success": false,
  "message": "Invalid passcode"
}
```

### Test No Passcode

```bash
curl "http://localhost:4000/api/pdf/serve/prospectus.pdf"
```

**Expected**:
```json
{
  "success": false,
  "message": "Passcode required to access PDF"
}
```

### Test Direct Access (Should Fail)

```bash
curl "http://localhost:4000/pdfs/prospectus.pdf"
```

**Expected**: 403 Forbidden or 404 Not Found

## 🚀 Deployment Checklist

### Frontend

- [ ] Add `NEXT_PUBLIC_PDF_PASSCODE` to `.env.local` (development)
- [ ] Add `NEXT_PUBLIC_PDF_PASSCODE` to Vercel environment variables (production)
- [ ] Ensure passcode matches one of the backend passcodes
- [ ] Test PDF links include passcode parameter

### Backend

- [ ] Add `PDF_ACCESS_PASSCODES` to `.env` file
- [ ] Implement `/api/pdf/serve/:filename` endpoint
- [ ] Block direct access to `/pdfs/` folder
- [ ] Test passcode verification
- [ ] Enable HTTPS in production

### Vercel Configuration

**Frontend** (Vercel Dashboard → Settings → Environment Variables):
```
NEXT_PUBLIC_PDF_PASSCODE=SecureCode123!
```

**Backend** (Vercel Dashboard → Settings → Environment Variables):
```
PDF_ACCESS_PASSCODES=SecureCode123!,AdminPass456#,UserCode789@
```

## 🔄 Migration from Modal Version

If you had the modal version before:

1. ✅ Passcode modal code removed from PDF viewer
2. ✅ `/api/pdf/verify-passcode` endpoint no longer needed (but can keep for other purposes)
3. ✅ PDF links now include passcode in URL
4. ✅ Add `NEXT_PUBLIC_PDF_PASSCODE` environment variable

## 📚 Related Documentation

- [BACKEND_PDF_PASSCODE_IMPLEMENTATION.md](BACKEND_PDF_PASSCODE_IMPLEMENTATION.md) - Complete backend guide
- [PDF_DYNAMIC_MANAGEMENT_GUIDE.md](PDF_DYNAMIC_MANAGEMENT_GUIDE.md) - Database PDF management
- [SECURE_PDF_URL_FORMAT.md](SECURE_PDF_URL_FORMAT.md) - URL format details

## 🐛 Troubleshooting

### Issue: PDF shows "Access denied: No passcode provided"

**Fix**: Ensure PDF links include `&passcode=X` parameter

**Check**:
```javascript
// Header component should generate:
path: `/pdf-viewer?file=X&passcode=Y`
```

### Issue: Invalid passcode error

**Fix**: Verify `NEXT_PUBLIC_PDF_PASSCODE` matches a backend passcode

**Check**:
```bash
# Frontend
echo $NEXT_PUBLIC_PDF_PASSCODE

# Backend
echo $PDF_ACCESS_PASSCODES
```

### Issue: PDF not loading

**Check**:
1. Browser console for errors
2. Network tab for `/api/pdf/serve/` request
3. Backend logs for passcode verification
4. File exists in `/public/pdfs/` folder

---

**Note**: This simplified implementation removes the frontend verification step and relies solely on backend passcode validation when serving PDF files.
