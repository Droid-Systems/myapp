# Frontend Token Integration Guide

## 🔒 Secure PDF Access with JWT Tokens

The frontend has been updated to work with the new JWT token-based PDF access system.

---

## ✅ What Changed

### Before (Insecure):
```typescript
// Passcode in URL
const pdfUrl = `/pdf-viewer?file=/pdfs/doc.pdf&passcode=Access2026`;
```

### After (Secure):
```typescript
// JWT token in URL (expires after 1 hour)
const pdfUrl = `/pdf-viewer?file=/api/pdf/serve/doc.pdf&token=eyJhbGc...`;
```

---

## 📁 Updated Files

### 1. `src/utils/passcode.ts`
**Changes:**
- `verifyPasscode()` now returns token data instead of boolean
- `storeVerifiedAccess()` stores JWT token + expiry
- Added `getAccessToken()` to retrieve current token
- Added `getTokenExpiry()` and `getTimeUntilExpiry()` for expiry management
- Added automatic token expiry checking

**New Functions:**
```typescript
// Get JWT token
const token = getAccessToken();

// Check token expiry
const expiryDate = getTokenExpiry();
const timeLeft = getTimeUntilExpiry(); // milliseconds

// Check if token is still valid
const hasAccess = hasVerifiedAccess(); // Also checks expiry
```

---

### 2. `src/components/PasscodeModal/index.tsx`
**Changes:**
- Updated to handle token response from backend
- Stores token + expiry instead of passcode
- Callback receives token instead of passcode

**Example Usage:**
```tsx
<PasscodeModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSuccess={(token) => {
    // Received JWT token, use it to access PDF
    const pdfUrl = `/pdf-viewer?file=/api/pdf/serve/doc.pdf&token=${token}`;
    router.push(pdfUrl);
  }}
  documentTitle="Investment Prospectus"
/>
```

---

### 3. `src/app/pdf-viewer/page.tsx`
**Changes:**
- Expects `token` parameter instead of `passcode`
- Constructs secure PDF URL with token
- Updated error messages

**Example URL:**
```
/pdf-viewer?file=/api/pdf/serve/prospectus.pdf&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 How to Use

### Basic Example: Opening a PDF

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PasscodeModal from "@/components/PasscodeModal";

export default function DocumentsList() {
  const [showModal, setShowModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const router = useRouter();

  const handleOpenDocument = (document) => {
    setSelectedDocument(document);
    setShowModal(true);
  };

  const handlePasscodeSuccess = (token) => {
    // User entered correct passcode, received JWT token
    const pdfUrl = `/pdf-viewer?file=${selectedDocument.fileUrl}&token=${token}`;
    router.push(pdfUrl);
  };

  return (
    <div>
      <button onClick={() => handleOpenDocument({
        title: "Investment Prospectus",
        fileUrl: "/api/pdf/serve/prospectus.pdf"
      })}>
        View Document
      </button>

      {showModal && (
        <PasscodeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handlePasscodeSuccess}
          documentTitle={selectedDocument?.title || "Document"}
        />
      )}
    </div>
  );
}
```

---

### Advanced Example: Token Expiry Handling

```tsx
"use client";

import { useState, useEffect } from "react";
import { getAccessToken, hasVerifiedAccess, getTimeUntilExpiry, clearVerifiedAccess } from "@/utils/passcode";
import PasscodeModal from "@/components/PasscodeModal";

export default function SecureDocuments() {
  const [token, setToken] = useState<string | null>(null);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Check for existing token on mount
  useEffect(() => {
    if (hasVerifiedAccess()) {
      setToken(getAccessToken());
    }
  }, []);

  // Update time left countdown
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      const timeRemaining = getTimeUntilExpiry();
      setTimeLeft(timeRemaining);

      // Token expired
      if (timeRemaining <= 0) {
        setToken(null);
        clearVerifiedAccess();
        setShowPasscodeModal(true);
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [token]);

  const handlePasscodeSuccess = (newToken: string) => {
    setToken(newToken);
    setShowPasscodeModal(false);
  };

  const formatTimeLeft = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      {token ? (
        <div>
          <p>Access granted. Time remaining: {formatTimeLeft(timeLeft)}</p>
          <iframe
            src={`http://localhost:4000/api/pdf/serve/document.pdf?token=${token}`}
            width="100%"
            height="600px"
          />
        </div>
      ) : (
        <button onClick={() => setShowPasscodeModal(true)}>
          Enter Passcode to View Documents
        </button>
      )}

      <PasscodeModal
        isOpen={showPasscodeModal}
        onClose={() => setShowPasscodeModal(false)}
        onSuccess={handlePasscodeSuccess}
        documentTitle="Secure Documents"
      />
    </div>
  );
}
```

---

## 🔄 Migration from Old System

### Find and Replace

**Search for:**
```typescript
const passcode = getVerifiedPasscode();
const pdfUrl = `/pdf-viewer?file=/pdfs/doc.pdf&passcode=${passcode}`;
```

**Replace with:**
```typescript
const token = getAccessToken();
const pdfUrl = `/pdf-viewer?file=/api/pdf/serve/doc.pdf&token=${token}`;
```

---

## ⚠️ Important Notes

### 1. Token Expiration

Tokens expire after **1 hour** by default. Your frontend should:
- Check `hasVerifiedAccess()` before using token
- Handle expired tokens by showing passcode modal again
- Optionally show a countdown to warn users

### 2. Environment Variable

Update your `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4001
# or for production:
NEXT_PUBLIC_API_URL=https://reaback.onrender.com
```

### 3. CORS Configuration

The backend must allow your frontend domain. Backend CORS is already configured for:
- `http://localhost:3000`
- `*.vercel.app`
- `*.ngrok.io`

### 4. httpOnly Cookies

The backend sets an httpOnly cookie (`pdf_access_token`) which:
- ✅ Automatically sent with requests
- ✅ Cannot be accessed by JavaScript (XSS protection)
- ✅ Provides extra security layer

---

## 🧪 Testing

### Test Token Expiry

Set a short expiry for testing:

**Backend `.env`:**
```env
PDF_TOKEN_EXPIRY="2m"  # 2 minutes
```

Then test:
1. Enter passcode → get token
2. Wait 2 minutes
3. Try accessing PDF → should fail
4. Enter passcode again → get new token
5. Access PDF → should work

---

## 📝 API Reference

### `verifyPasscode(passcode: string)`
Verifies passcode and returns JWT token.

**Returns:**
```typescript
{
  success: true,
  data: {
    token: "eyJhbGc...",
    expiresAt: "2024-02-12T01:30:00.000Z",
    expiresIn: "1h"
  }
} | null
```

### `storeVerifiedAccess(token: string, expiresAt: string)`
Stores JWT token in sessionStorage.

### `hasVerifiedAccess(): boolean`
Checks if user has valid (non-expired) token.

### `getAccessToken(): string | null`
Gets current JWT token (if still valid).

### `getTokenExpiry(): Date | null`
Gets token expiration date.

### `getTimeUntilExpiry(): number`
Gets milliseconds until token expires.

### `clearVerifiedAccess()`
Clears token from storage (logout).

---

## 🔒 Security Best Practices

1. **Never log tokens** - Don't console.log or display tokens
2. **Use HTTPS in production** - httpOnly cookies require secure connection
3. **Handle expiry gracefully** - Show friendly message when token expires
4. **Clear on logout** - Call `clearVerifiedAccess()` when user logs out
5. **Validate before use** - Always check `hasVerifiedAccess()` first

---

## 🐛 Troubleshooting

### "Access denied: No access token provided"
- Token not in URL
- Check: Is token being passed correctly?

### "Invalid access token"
- Token expired or invalid
- Solution: Clear storage and ask for new passcode

### PDF won't load
- Check browser console for errors
- Verify API_URL is correct
- Ensure CORS is configured

### Token expires too quickly
- Check backend `PDF_TOKEN_EXPIRY` setting
- Default is 1 hour

---

## ✅ Checklist

- [ ] Updated `NEXT_PUBLIC_API_URL` in `.env.local`
- [ ] Tested passcode verification
- [ ] Tested PDF viewing with token
- [ ] Tested token expiry (wait for expiration)
- [ ] Updated all document links to use new system
- [ ] Removed old passcode-in-URL code
- [ ] Tested on mobile devices
- [ ] Deployed to production

---

## 🎯 Summary

**Your PDFs are now secured with:**
- ✅ JWT tokens (not plain passcodes)
- ✅ Time-based expiration (1 hour default)
- ✅ httpOnly cookies (XSS protection)
- ✅ Automatic expiry checking
- ✅ No sensitive data in URLs
