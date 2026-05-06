# Document Passcode Configuration

This directory contains the configuration for document access passcodes with SHA-256 encryption.

## 🔒 Security Overview

Passcodes are now **hashed using SHA-256** for enhanced security. The configuration file stores only the hashed values, not the plain text passcodes.

## 🚀 Initial Setup (REQUIRED)

**⚠️ You must complete this setup before the passcode system will work!**

1. **Navigate to the Hash Generator Tool:**
   - Open your browser and go to: `/admin/generate-hash`

2. **Generate Hashes for Your Passcodes:**
   - Enter each of your 10 passcodes one by one:
     - ACCESS2025
     - ALVARADO123
     - PROPERTY456
     - INVEST789
     - RENTAL2025
     - ARBITRAGE99
     - GOLDEN777
     - UNITS2025
     - DOCS4321
     - SECURE888
   - Click "Generate Hash" for each one
   - Copy the generated hash

3. **Update the Config File:**
   - Open: `src/config/document-passcodes.ts`
   - Replace each `PLACEHOLDER_HASH_X` with the corresponding real hash
   - Keep the comments to remember which passcode each hash represents

4. **Save and Test:**
   - Save the file
   - Clear your browser's session storage
   - Test by clicking a PDF in the Documents menu

## How to Add or Change Passcodes

### Method 1: Using the Admin Tool (Recommended)

1. Navigate to `/admin/generate-hash` in your browser
2. Enter your new passcode (e.g., "NEWCODE2025")
3. Click "Generate Hash"
4. Copy the generated hash (64-character hex string)
5. Open `src/config/document-passcodes.ts`
6. Add the hash to the `DOCUMENT_PASSCODES` array:
   ```typescript
   export const DOCUMENT_PASSCODES = [
     "abc123def456...", // NEWCODE2025
     // ... other hashes
   ];
   ```
7. Save the file - changes take effect immediately

### Method 2: Using Browser Console

1. Open your website in a browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Run this command:
   ```javascript
   const { generatePasscodeHash } = await import('/src/utils/passcode');
   await generatePasscodeHash("YOUR_PASSCODE");
   ```
5. Copy the returned hash and add it to the config file

## Support Contact Information

Update the support contact information shown to users:

```typescript
export const SUPPORT_INFO = {
  email: "info@alvaradoassociatepartners.com",
  phone: "(424) 519-5003",
  message: "Please contact our support team to obtain an access code for our documents.",
};
```

## Security Features

- ✅ **SHA-256 Hashing**: Passcodes are hashed, not stored in plain text
- ✅ **Case-Insensitive**: Passcodes converted to uppercase before hashing
- ✅ **Session Storage**: Access verified and stored in browser session
- ✅ **Auto-Expiration**: Verification expires after 1 minute
- ✅ **Modal Protection**: Prevents direct PDF access without verification

## Testing

After updating passcodes:

1. **Clear Session Storage:**
   - Open Developer Tools (F12)
   - Go to Application > Session Storage
   - Clear all entries

2. **Test Access:**
   - Click any PDF in the Documents menu
   - Enter the passcode (plain text, not the hash!)
   - Verify the document opens successfully

3. **Verify Hash:**
   - If a passcode doesn't work, regenerate its hash at `/admin/generate-hash`
   - Ensure you're entering the exact passcode you hashed

## Admin Tool Security

**Important:** The hash generator tool at `/admin/generate-hash` is for administrative use only.

In production, consider:
- Removing the `/admin/generate-hash` page after setup
- Protecting it with authentication
- Using it only on localhost/development

## Troubleshooting

**Passcode not working?**
- Verify the hash in the config matches the hash from the generator
- Check browser console for errors
- Ensure passcode is spelled correctly (case doesn't matter)
- Try regenerating the hash

**Need to reset everything?**
- Replace all hashes in `DOCUMENT_PASSCODES` array
- Clear browser session storage
- Generate fresh hashes for your passcodes
