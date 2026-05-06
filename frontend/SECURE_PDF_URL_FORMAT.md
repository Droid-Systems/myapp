# Secure PDF URL Format - Implementation Guide

## 🔒 Overview

Your PDFs are now protected with a secure URL format that requires passcode authentication. Direct access to PDF files is blocked.

## ❌ What Changed

### Before (Insecure):
```
❌ Direct Access: /pdfs/prospectus.pdf
❌ Anyone could access PDFs without authentication
❌ Files were publicly accessible
```

### After (Secure):
```
✅ Secure Access: /api/pdf/serve/prospectus.pdf?passcode=SecureCode123!
✅ Passcode required for every PDF request
✅ Direct file access is blocked
```

## 🔐 How It Works

### 1. User Flow

```
User clicks PDF link
    ↓
Passcode modal appears
    ↓
User enters passcode
    ↓
Frontend verifies: POST /api/pdf/verify-passcode
    ↓
If valid, passcode stored in sessionStorage
    ↓
PDF URL constructed with passcode:
/api/pdf/serve/filename.pdf?passcode=CODE
    ↓
Backend verifies passcode again
    ↓
PDF is served if passcode is valid
```

### 2. URL Construction

**Frontend Code** (Already Implemented):

```tsx
// Get the verified passcode from sessionStorage
const verifiedPasscode = sessionStorage.getItem("pdf_passcode");

// Extract filename from original path
const filename = pdfFile.split('/').pop(); // "prospectus.pdf"

// Create secure URL with passcode
const securePdfUrl = `/api/pdf/serve/${filename}?passcode=${encodeURIComponent(verifiedPasscode)}`;

// Add PDF viewer parameters
const pdfUrl = `${securePdfUrl}#toolbar=1&navpanes=1&scrollbar=1`;
```

**Result**:
```
/api/pdf/serve/prospectus.pdf?passcode=SecureCode123!#toolbar=1&navpanes=1
```

## 🛠️ Backend Implementation

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

    // 3. Parse and validate passcodes
    let allowedPasscodes = passcodesString
      .split(',')
      .map(code => code.trim())
      .filter(code => code.length > 0);

    // 4. Verify passcode matches
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

## 🚫 Block Direct Access

### Option 1: Express (Recommended)

**Don't** serve PDFs as static files:

```javascript
// ❌ DON'T DO THIS:
app.use('/pdfs', express.static('public/pdfs'));

// ✅ DO THIS:
// Only serve PDFs through the secure endpoint
// Direct access to /pdfs/* will return 404
```

### Option 2: Nginx Configuration

```nginx
# Block direct access to PDFs
location ~ ^/pdfs/ {
    return 403;
}

# Allow API endpoint
location /api/pdf/serve/ {
    proxy_pass http://localhost:4000;
}
```

### Option 3: Vercel Configuration

**File**: `vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/pdfs/:path*",
      "destination": "/api/blocked"
    }
  ]
}
```

## 📝 Complete Example

### Database Record

```sql
INSERT INTO pdf_documents (title, file_url, display_order) VALUES
  ('Investment Prospectus', '/pdfs/prospectus.pdf', 1);
```

### Frontend Menu Generation

```tsx
// Fetched from /api/pdf/documents
const pdfDocuments = [
  {
    id: 1,
    title: "Investment Prospectus",
    file_url: "/pdfs/prospectus.pdf"
  }
];

// Transformed to menu items
const menuItem = {
  id: 41,
  title: "Investment Prospectus",
  path: "/pdf-viewer?file=/pdfs/prospectus.pdf",  // Original path
  newTab: true
};
```

### PDF Viewer Page

```tsx
// User clicks menu item, lands on:
// /pdf-viewer?file=/pdfs/prospectus.pdf

// Passcode modal appears
// User enters: "SecureCode123!"

// After verification, PDF URL becomes:
// /api/pdf/serve/prospectus.pdf?passcode=SecureCode123!

// Backend verifies passcode and serves PDF
```

## 🔍 Testing

### Test Passcode Verification

```bash
curl -X POST http://localhost:4000/api/pdf/verify-passcode \
  -H "Content-Type: application/json" \
  -d '{"passcode":"SecureCode123!"}'
```

**Expected**:
```json
{
  "success": true,
  "message": "Access granted"
}
```

### Test Direct Access (Should Fail)

```bash
curl http://localhost:4000/pdfs/prospectus.pdf
```

**Expected**: 403 Forbidden or 404 Not Found

### Test Secure Endpoint Without Passcode (Should Fail)

```bash
curl http://localhost:4000/api/pdf/serve/prospectus.pdf
```

**Expected**:
```json
{
  "success": false,
  "message": "Passcode required to access PDF"
}
```

### Test Secure Endpoint With Invalid Passcode (Should Fail)

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

### Test Secure Endpoint With Valid Passcode (Should Work)

```bash
curl "http://localhost:4000/api/pdf/serve/prospectus.pdf?passcode=SecureCode123!" \
  --output test.pdf
```

**Expected**: PDF file downloaded successfully

## 🔐 Security Features

### 1. Double Verification
- Passcode verified during modal submission
- Passcode verified again when serving PDF

### 2. Path Traversal Protection
```javascript
// Using path.basename() prevents attacks like:
// /api/pdf/serve/../../../etc/passwd?passcode=CODE
// Becomes: /public/pdfs/passwd (safe)
```

### 3. Session-Based
- Passcode stored in sessionStorage (browser tab only)
- Clears when tab closes
- Not persisted to disk

### 4. HTTPS Required
- Passcodes sent in URL query parameters
- Must use HTTPS in production to prevent interception

### 5. File Type Validation
- Only PDFs from designated folder
- Cannot access files outside `/public/pdfs/`

## 📋 Deployment Checklist

- [ ] Backend endpoint `/api/pdf/serve/:filename` implemented
- [ ] Environment variable `PDF_ACCESS_PASSCODES` configured
- [ ] Direct access to `/pdfs/` folder blocked
- [ ] Frontend updated to use secure URLs
- [ ] Test with valid passcode (should work)
- [ ] Test with invalid passcode (should fail)
- [ ] Test direct PDF access (should fail)
- [ ] Verify HTTPS in production
- [ ] Test on mobile devices
- [ ] Test PDF download functionality

## 🚀 Production Configuration

### Environment Variables

```env
# Production .env
PDF_ACCESS_PASSCODES=AdminCode2024!,PartnerAccess#,InvestorView@
```

### Vercel Configuration

```json
{
  "env": {
    "PDF_ACCESS_PASSCODES": "AdminCode2024!,PartnerAccess#,InvestorView@"
  }
}
```

### Server Configuration

```javascript
// Ensure PDFs folder is NOT publicly accessible
// Only serve through /api/pdf/serve endpoint

// ❌ Don't expose:
app.use(express.static('public'));

// ✅ Expose only necessary static files:
app.use('/images', express.static('public/images'));
app.use('/css', express.static('public/css'));
// PDFs are served through API only
```

## 🐛 Troubleshooting

### Issue: PDF not loading

**Check**:
1. Is passcode stored in sessionStorage?
   ```javascript
   console.log(sessionStorage.getItem('pdf_passcode'));
   ```

2. Is URL correctly formatted?
   ```javascript
   console.log(pdfUrl);
   // Should be: /api/pdf/serve/filename.pdf?passcode=CODE
   ```

3. Backend logs for errors
   ```bash
   # Check backend console
   ```

### Issue: Direct PDF access still works

**Fix**: Block `/pdfs/` folder in your server configuration

```javascript
// Don't serve pdfs folder as static
// Remove or comment out:
app.use('/pdfs', express.static('public/pdfs'));
```

### Issue: Passcode not working

**Check**:
1. Environment variable is set correctly
   ```bash
   echo $PDF_ACCESS_PASSCODES
   ```

2. No extra spaces in passcode list
   ```env
   # ❌ Wrong (has spaces):
   PDF_ACCESS_PASSCODES=Code1, Code2, Code3

   # ✅ Correct:
   PDF_ACCESS_PASSCODES=Code1,Code2,Code3
   ```

## 📚 Additional Resources

- [BACKEND_PDF_PASSCODE_IMPLEMENTATION.md](BACKEND_PDF_PASSCODE_IMPLEMENTATION.md) - Complete backend guide
- [PDF_DYNAMIC_MANAGEMENT_GUIDE.md](PDF_DYNAMIC_MANAGEMENT_GUIDE.md) - Database management guide
- [src/app/pdf-viewer/page.tsx](src/app/pdf-viewer/page.tsx) - Frontend implementation

## 📊 Architecture Summary

```
┌─────────────────────────────────────────┐
│  User clicks PDF in header menu         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Passcode Modal appears                 │
│  User enters passcode                   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  POST /api/pdf/verify-passcode          │
│  Backend verifies against allowed list  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Store passcode in sessionStorage       │
│  Construct secure URL with passcode     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  GET /api/pdf/serve/file.pdf?passcode=X │
│  Backend verifies passcode again        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  PDF file streamed to browser           │
│  User views PDF                         │
└─────────────────────────────────────────┘
```

---

**Note**: This implementation ensures that PDFs are only accessible with a valid passcode, providing secure document management for your application.
