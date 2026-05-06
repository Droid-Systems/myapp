# Backend PDF Passcode Implementation Guide

This guide shows you how to implement the PDF passcode verification endpoint in your backend with support for **multiple passcodes** (up to 10 different codes).

## 1. Add Passcodes to Environment Variables

Add this line to your backend `.env` file with **comma-separated passcodes**:

```env
# Multiple passcodes separated by commas (up to 10)
PDF_ACCESS_PASSCODES=SecureCode123!,AdminPass456#,UserCode789@,Partner2024,Manager999

# Alternative: Single passcode (for backwards compatibility)
# PDF_ACCESS_PASSCODE=YourSecurePasscodeHere123!
```

**Important:**
- You can add up to 10 different passcodes
- Separate each passcode with a comma
- No spaces between passcodes (or they'll be part of the code)
- Each passcode should be unique and strong
- You can add/remove passcodes anytime without code changes

## 2. Create the API Endpoint

### Option A: Using Express.js (Node.js) - Multiple Passcodes

Create or update the file: `backend/src/routes/pdf.routes.js` (or `.ts` for TypeScript)

```javascript
const express = require('express');
const router = express.Router();

/**
 * POST /api/pdf/verify-passcode
 * Verify PDF access passcode against multiple allowed passcodes
 */
router.post('/verify-passcode', async (req, res) => {
  try {
    const { passcode } = req.body;

    // Validate request
    if (!passcode) {
      return res.status(400).json({
        success: false,
        message: 'Passcode is required'
      });
    }

    // Get passcodes from environment variable (comma-separated)
    const passcodesString = process.env.PDF_ACCESS_PASSCODES;

    if (!passcodesString) {
      console.error('PDF_ACCESS_PASSCODES not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Split passcodes by comma and trim whitespace
    const allowedPasscodes = passcodesString
      .split(',')
      .map(code => code.trim())
      .filter(code => code.length > 0); // Remove empty strings

    // Limit to 10 passcodes maximum
    if (allowedPasscodes.length > 10) {
      console.warn(`Warning: More than 10 passcodes configured. Only using first 10.`);
      allowedPasscodes = allowedPasscodes.slice(0, 10);
    }

    console.log(`Checking passcode against ${allowedPasscodes.length} configured passcode(s)`);

    // Verify passcode matches any of the allowed passcodes
    if (allowedPasscodes.includes(passcode)) {
      return res.status(200).json({
        success: true,
        message: 'Access granted'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid passcode'
      });
    }
  } catch (error) {
    console.error('Error verifying PDF passcode:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying passcode'
    });
  }
});

// Secure PDF Serving Endpoint
// This endpoint serves PDF files only with valid passcode
router.get('/serve/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const { passcode } = req.query;

    // Validate passcode is provided
    if (!passcode) {
      return res.status(401).json({
        success: false,
        message: 'Passcode required to access PDF'
      });
    }

    // Get passcodes from environment variable (comma-separated)
    const passcodesString = process.env.PDF_ACCESS_PASSCODES;

    if (!passcodesString) {
      console.error('PDF_ACCESS_PASSCODES not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Split passcodes by comma and trim whitespace
    let allowedPasscodes = passcodesString
      .split(',')
      .map(code => code.trim())
      .filter(code => code.length > 0);

    // Limit to 10 passcodes maximum
    if (allowedPasscodes.length > 10) {
      allowedPasscodes = allowedPasscodes.slice(0, 10);
    }

    // Verify passcode matches any of the allowed passcodes
    if (!allowedPasscodes.includes(passcode)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid passcode'
      });
    }

    // Construct the file path (adjust based on your server setup)
    const path = require('path');
    const fs = require('fs');

    // Security: Only allow PDFs from the pdfs directory
    const safePath = path.join(__dirname, '../../public/pdfs', path.basename(filename));

    // Check if file exists
    if (!fs.existsSync(safePath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF file not found'
      });
    }

    // Set headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // Stream the PDF file
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

### Register the route in your main server file (e.g., `backend/src/server.js`):

```javascript
const pdfRoutes = require('./routes/pdf.routes');

// ... other middleware

app.use('/api/pdf', pdfRoutes);
```

### TypeScript Version

If using TypeScript, create `backend/src/routes/pdf.routes.ts`:

```typescript
import { Router, Request, Response } from 'express';

const router = Router();

interface VerifyPasscodeRequest {
  passcode: string;
}

/**
 * POST /api/pdf/verify-passcode
 * Verify PDF access passcode against multiple allowed passcodes
 */
router.post('/verify-passcode', async (req: Request<{}, {}, VerifyPasscodeRequest>, res: Response) => {
  try {
    const { passcode } = req.body;

    // Validate request
    if (!passcode) {
      return res.status(400).json({
        success: false,
        message: 'Passcode is required'
      });
    }

    // Get passcodes from environment variable (comma-separated)
    const passcodesString = process.env.PDF_ACCESS_PASSCODES;

    if (!passcodesString) {
      console.error('PDF_ACCESS_PASSCODES not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Split passcodes by comma and trim whitespace
    let allowedPasscodes = passcodesString
      .split(',')
      .map(code => code.trim())
      .filter(code => code.length > 0); // Remove empty strings

    // Limit to 10 passcodes maximum
    if (allowedPasscodes.length > 10) {
      console.warn(`Warning: More than 10 passcodes configured. Only using first 10.`);
      allowedPasscodes = allowedPasscodes.slice(0, 10);
    }

    console.log(`Checking passcode against ${allowedPasscodes.length} configured passcode(s)`);

    // Verify passcode matches any of the allowed passcodes
    if (allowedPasscodes.includes(passcode)) {
      return res.status(200).json({
        success: true,
        message: 'Access granted'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid passcode'
      });
    }
  } catch (error) {
    console.error('Error verifying PDF passcode:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying passcode'
    });
  }
});

// Secure PDF Serving Endpoint (TypeScript)
// This endpoint serves PDF files only with valid passcode
router.get('/serve/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const { passcode } = req.query;

    // Validate passcode is provided
    if (!passcode || typeof passcode !== 'string') {
      return res.status(401).json({
        success: false,
        message: 'Passcode required to access PDF'
      });
    }

    // Get passcodes from environment variable (comma-separated)
    const passcodesString = process.env.PDF_ACCESS_PASSCODES;

    if (!passcodesString) {
      console.error('PDF_ACCESS_PASSCODES not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Split passcodes by comma and trim whitespace
    let allowedPasscodes = passcodesString
      .split(',')
      .map(code => code.trim())
      .filter(code => code.length > 0);

    // Limit to 10 passcodes maximum
    if (allowedPasscodes.length > 10) {
      allowedPasscodes = allowedPasscodes.slice(0, 10);
    }

    // Verify passcode matches any of the allowed passcodes
    if (!allowedPasscodes.includes(passcode)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid passcode'
      });
    }

    // Construct the file path (adjust based on your server setup)
    const path = require('path');
    const fs = require('fs');

    // Security: Only allow PDFs from the pdfs directory
    const safePath = path.join(__dirname, '../../public/pdfs', path.basename(filename));

    // Check if file exists
    if (!fs.existsSync(safePath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF file not found'
      });
    }

    // Set headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // Stream the PDF file
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

export default router;
```

## 3. Block Direct PDF Access (Security)

To prevent users from bypassing the passcode by accessing PDFs directly, you need to block direct access to the `/pdfs` folder.

### Option A: Using Express (Recommended)

Don't serve the `/pdfs` folder as static files. Instead, only serve PDFs through the secure endpoint:

```javascript
// ❌ DON'T DO THIS:
app.use('/pdfs', express.static('public/pdfs'));

// ✅ DO THIS:
// Don't expose the pdfs directory at all
// PDFs are only accessible via /api/pdf/serve/:filename with passcode
```

### Option B: Using Nginx (Production)

If you're using Nginx, add this to your configuration:

```nginx
# Block direct access to PDFs
location ~ ^/pdfs/ {
    return 403;
}

# Allow API endpoint
location /api/pdf/serve/ {
    proxy_pass http://your_backend;
}
```

### Option C: Using .htaccess (Apache)

```apache
# Block direct access to PDFs
<FilesMatch "\.(pdf)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>
```

## 4. Optional: Store Passcodes in Database

If you want to store passcodes in a database instead of `.env`:

### Database Schema

```sql
CREATE TABLE pdf_passcodes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  passcode VARCHAR(255) UNIQUE NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert up to 10 passcodes with descriptions
INSERT INTO pdf_passcodes (passcode, description) VALUES
  ('SecureCode123!', 'Primary admin passcode'),
  ('AdminPass456#', 'Admin team passcode'),
  ('UserCode789@', 'General user passcode'),
  ('Partner2024', 'Partner access passcode'),
  ('Manager999', 'Manager passcode');
```

### Modified Route (with Database)

```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Your database connection

router.post('/verify-passcode', async (req, res) => {
  try {
    const { passcode } = req.body;

    if (!passcode) {
      return res.status(400).json({
        success: false,
        message: 'Passcode is required'
      });
    }

    // Fetch active passcodes from database (limit to 10)
    const [rows] = await db.query(
      "SELECT passcode FROM pdf_passcodes WHERE is_active = TRUE LIMIT 10"
    );

    if (rows.length === 0) {
      console.error('No active PDF passcodes found in database');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Extract passcodes into an array
    const allowedPasscodes = rows.map(row => row.passcode);

    console.log(`Checking passcode against ${allowedPasscodes.length} configured passcode(s)`);

    // Check if submitted passcode matches any allowed passcode
    if (allowedPasscodes.includes(passcode)) {
      return res.status(200).json({
        success: true,
        message: 'Access granted'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid passcode'
      });
    }
  } catch (error) {
    console.error('Error verifying PDF passcode:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while verifying passcode'
    });
  }
});

module.exports = router;
```

### Admin Endpoint to Manage Passcodes (Bonus)

Add CRUD endpoints to manage passcodes:

```javascript
// GET all passcodes (admin only)
router.get('/passcodes', authenticateAdmin, async (req, res) => {
  try {
    const [passcodes] = await db.query(
      "SELECT id, description, is_active, created_at FROM pdf_passcodes ORDER BY created_at DESC"
    );

    res.json({ success: true, data: passcodes });
  } catch (error) {
    console.error('Error fetching passcodes:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST create new passcode (admin only)
router.post('/passcodes', authenticateAdmin, async (req, res) => {
  try {
    const { passcode, description } = req.body;

    // Check if we already have 10 active passcodes
    const [count] = await db.query(
      "SELECT COUNT(*) as total FROM pdf_passcodes WHERE is_active = TRUE"
    );

    if (count[0].total >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum of 10 passcodes allowed. Please deactivate an existing passcode first.'
      });
    }

    await db.query(
      "INSERT INTO pdf_passcodes (passcode, description) VALUES (?, ?)",
      [passcode, description]
    );

    res.json({ success: true, message: 'Passcode created successfully' });
  } catch (error) {
    console.error('Error creating passcode:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE deactivate passcode (admin only)
router.delete('/passcodes/:id', authenticateAdmin, async (req, res) => {
  try {
    await db.query(
      "UPDATE pdf_passcodes SET is_active = FALSE WHERE id = ?",
      [req.params.id]
    );

    res.json({ success: true, message: 'Passcode deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating passcode:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
```

## 4. Security Enhancements (Optional)

### Add Rate Limiting

Prevent brute-force attacks by limiting attempts:

```javascript
const rateLimit = require('express-rate-limit');

const pdfPasscodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many passcode attempts. Please try again later.'
  }
});

router.post('/verify-passcode', pdfPasscodeLimiter, async (req, res) => {
  // ... your verification logic
});
```

### Hash the Passcodes (Advanced)

For extra security, you can hash the passcodes:

```javascript
const bcrypt = require('bcrypt');

// When storing passcodes initially:
const hashedPasscodes = await Promise.all([
  bcrypt.hash('SecureCode123!', 10),
  bcrypt.hash('AdminPass456#', 10),
  bcrypt.hash('UserCode789@', 10),
]);
// Store hashedPasscodes in database

// When verifying:
router.post('/verify-passcode', async (req, res) => {
  const { passcode } = req.body;

  // Fetch hashed passcodes from database
  const [rows] = await db.query("SELECT passcode FROM pdf_passcodes WHERE is_active = TRUE LIMIT 10");

  // Check if any hashed passcode matches
  const promises = rows.map(row => bcrypt.compare(passcode, row.passcode));
  const results = await Promise.all(promises);

  if (results.some(result => result === true)) {
    return res.status(200).json({ success: true, message: 'Access granted' });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid passcode' });
  }
});
```

## 5. Testing the Endpoint

### Using cURL:

```bash
# Test with first passcode
curl -X POST http://localhost:4000/api/pdf/verify-passcode \
  -H "Content-Type: application/json" \
  -d '{"passcode":"SecureCode123!"}'

# Test with second passcode
curl -X POST http://localhost:4000/api/pdf/verify-passcode \
  -H "Content-Type: application/json" \
  -d '{"passcode":"AdminPass456#"}'

# Test with invalid passcode
curl -X POST http://localhost:4000/api/pdf/verify-passcode \
  -H "Content-Type: application/json" \
  -d '{"passcode":"WrongCode999"}'
```

### Using Postman:

- Method: POST
- URL: `http://localhost:4000/api/pdf/verify-passcode`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "passcode": "SecureCode123!"
}
```

### Expected Responses:

**Success with any valid passcode (200):**
```json
{
  "success": true,
  "message": "Access granted"
}
```

**Invalid Passcode (401):**
```json
{
  "success": false,
  "message": "Invalid passcode"
}
```

**Missing Passcode (400):**
```json
{
  "success": false,
  "message": "Passcode is required"
}
```

## 6. Frontend Integration

The frontend is already configured in `/src/app/pdf-viewer/page.tsx`. It will:
1. Show a passcode modal when accessing any PDF
2. Send the passcode to `/api/pdf/verify-passcode`
3. Grant access if any of the configured passcodes match
4. Store authentication in sessionStorage (resets on browser close)

**The frontend doesn't need any changes** - it works automatically with multiple passcodes on the backend!

## 7. Deployment Checklist

- [ ] Add `PDF_ACCESS_PASSCODES` to your production environment variables (Vercel, Heroku, etc.)
- [ ] Format: `Code1,Code2,Code3` (comma-separated, no spaces)
- [ ] Maximum of 10 passcodes
- [ ] Test each passcode in production
- [ ] Share passcodes securely with authorized users only
- [ ] Consider implementing rate limiting to prevent brute-force attacks
- [ ] Monitor backend logs for unauthorized access attempts
- [ ] Document which passcode is for which user/team

## 8. Example .env Configuration

```env
# Production environment
PDF_ACCESS_PASSCODES=AdminMaster2024!,TeamLead456#,Partner789@,ManagerXYZ,UserABC123

# Development environment
PDF_ACCESS_PASSCODES=DevPass123,TestCode456

# Single passcode (backwards compatible)
PDF_ACCESS_PASSCODE=SingleCode123!
```

## 9. Managing Multiple Passcodes

### Best Practices:

1. **Assign Unique Passcodes**: Give each team/user group a unique passcode
2. **Use Descriptions**: Document what each passcode is for
3. **Rotate Regularly**: Change passcodes every 3-6 months
4. **Track Usage**: Log which passcode was used (optional)
5. **Revoke Access**: Remove passcodes when users leave

### Example Passcode Organization:

```env
PDF_ACCESS_PASSCODES=AdminTeam2024!,SalesTeam2024#,PartnerAccess@,ManagerGroup,InvestorView123,LegalTeam456,FinanceAccess,HRDepartment,ExecutiveBoard,AuditorPass
```

Document separately:
- `AdminTeam2024!` - IT/Admin team
- `SalesTeam2024#` - Sales department
- `PartnerAccess@` - External partners
- `ManagerGroup` - Management team
- `InvestorView123` - Investors only
- `LegalTeam456` - Legal department
- `FinanceAccess` - Finance team
- `HRDepartment` - HR team
- `ExecutiveBoard` - C-level executives
- `AuditorPass` - External auditors

## 10. Dynamic PDF Management from Database

Instead of hardcoding PDF files in the frontend, you can store and manage them in the database.

### Database Schema for PDF Documents

```sql
CREATE TABLE pdf_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample PDF documents
INSERT INTO pdf_documents (title, description, file_path, file_url, display_order) VALUES
  ('Investment Prospectus', 'Official investment prospectus document', '/pdfs/prospectus.pdf', '/pdfs/prospectus.pdf', 1),
  ('Terms & Conditions', 'Legal terms and conditions', '/pdfs/terms.pdf', '/pdfs/terms.pdf', 2),
  ('Annual Report 2024', 'Annual financial report', '/pdfs/annual-report-2024.pdf', '/pdfs/annual-report-2024.pdf', 3),
  ('Property Catalog', 'Complete property listings', '/pdfs/property-catalog.pdf', '/pdfs/property-catalog.pdf', 4);
```

### Backend API Endpoint to Fetch PDFs

Add this to `backend/src/routes/pdf.routes.js`:

```javascript
// GET all active PDF documents
router.get('/documents', async (req, res) => {
  try {
    const [documents] = await db.query(
      `SELECT id, title, description, file_url, display_order
       FROM pdf_documents
       WHERE is_active = TRUE
       ORDER BY display_order ASC, title ASC`
    );

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Error fetching PDF documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch PDF documents'
    });
  }
});

// GET single PDF document by ID
router.get('/documents/:id', async (req, res) => {
  try {
    const [documents] = await db.query(
      `SELECT id, title, description, file_url
       FROM pdf_documents
       WHERE id = ? AND is_active = TRUE
       LIMIT 1`,
      [req.params.id]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'PDF document not found'
      });
    }

    res.json({
      success: true,
      data: documents[0]
    });
  } catch (error) {
    console.error('Error fetching PDF document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch PDF document'
    });
  }
});
```

### TypeScript Version

```typescript
import { Router, Request, Response } from 'express';

interface PDFDocument {
  id: number;
  title: string;
  description: string | null;
  file_url: string;
  display_order: number;
}

// GET all active PDF documents
router.get('/documents', async (req: Request, res: Response) => {
  try {
    const [documents] = await db.query<PDFDocument[]>(
      `SELECT id, title, description, file_url, display_order
       FROM pdf_documents
       WHERE is_active = TRUE
       ORDER BY display_order ASC, title ASC`
    );

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Error fetching PDF documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch PDF documents'
    });
  }
});

// GET single PDF document by ID
router.get('/documents/:id', async (req: Request, res: Response) => {
  try {
    const [documents] = await db.query<PDFDocument[]>(
      `SELECT id, title, description, file_url
       FROM pdf_documents
       WHERE id = ? AND is_active = TRUE
       LIMIT 1`,
      [req.params.id]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'PDF document not found'
      });
    }

    res.json({
      success: true,
      data: documents[0]
    });
  } catch (error) {
    console.error('Error fetching PDF document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch PDF document'
    });
  }
});
```

### Admin Endpoints for Managing PDFs

```javascript
// POST create new PDF document (admin only)
router.post('/documents', authenticateAdmin, async (req, res) => {
  try {
    const { title, description, file_path, file_url, display_order } = req.body;

    const [result] = await db.query(
      `INSERT INTO pdf_documents (title, description, file_path, file_url, display_order)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description, file_path, file_url, display_order || 0]
    );

    res.status(201).json({
      success: true,
      message: 'PDF document created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating PDF document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create PDF document'
    });
  }
});

// PUT update PDF document (admin only)
router.put('/documents/:id', authenticateAdmin, async (req, res) => {
  try {
    const { title, description, file_path, file_url, display_order } = req.body;

    await db.query(
      `UPDATE pdf_documents
       SET title = ?, description = ?, file_path = ?, file_url = ?, display_order = ?
       WHERE id = ?`,
      [title, description, file_path, file_url, display_order, req.params.id]
    );

    res.json({
      success: true,
      message: 'PDF document updated successfully'
    });
  } catch (error) {
    console.error('Error updating PDF document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update PDF document'
    });
  }
});

// DELETE deactivate PDF document (admin only)
router.delete('/documents/:id', authenticateAdmin, async (req, res) => {
  try {
    await db.query(
      `UPDATE pdf_documents SET is_active = FALSE WHERE id = ?`,
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'PDF document deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating PDF document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate PDF document'
    });
  }
});
```

## Notes

### Security Model

- **Passcode Verification**: Passcodes are verified on the backend for security
- **Secure PDF URLs**: PDFs are served through `/api/pdf/serve/:filename?passcode=CODE`
- **Direct Access Blocked**: Direct access to `/pdfs/` folder should be blocked
- **URL Format**: Frontend includes passcode in query parameter for each PDF request

### Authentication Flow

1. User enters passcode in modal
2. Frontend verifies passcode via `/api/pdf/verify-passcode`
3. If valid, passcode is stored in sessionStorage
4. PDF URL is constructed: `/api/pdf/serve/filename.pdf?passcode=VerifiedCode`
5. Backend verifies passcode again when serving the PDF file
6. PDF is streamed to browser if passcode is valid

### URL Examples

❌ **Old (Insecure - Blocked)**:
```
/pdfs/prospectus.pdf
```

✅ **New (Secure - Required)**:
```
/api/pdf/serve/prospectus.pdf?passcode=SecureCode123!
```

### Key Features

- You can have 1-10 different passcodes active at once
- Authentication is stored in sessionStorage (per-tab, clears on browser close)
- Users need to enter **one valid passcode** per browser session
- Each PDF request includes the passcode for backend verification
- You can add/remove passcodes in `.env` without code changes
- Consider rotating passcodes periodically for better security
- The system automatically limits to 10 passcodes even if more are configured
- PDF documents are now managed dynamically from the database
- Use the admin endpoints to add/edit/remove PDF documents without code changes

### Important Security Notes

- **Never expose PDFs directly**: Block `/pdfs/` folder from public access
- **Verify every request**: Backend checks passcode on every PDF request
- **Use HTTPS in production**: Passcodes are sent in URL query parameters
- **Session-based**: Passcode is valid only for the current browser session
- **File path validation**: Backend uses `path.basename()` to prevent directory traversal attacks
