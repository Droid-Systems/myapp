# PDF Dynamic Management - Complete Implementation Guide

This guide explains how PDFs are now managed dynamically from the database instead of being hardcoded in the frontend.

## 🎯 Overview

The system now fetches PDF documents from your backend database and displays them dynamically in the header menu. This means:
- ✅ No code changes needed to add/remove/update PDFs
- ✅ Manage PDFs through database or admin panel
- ✅ Automatic updates when database changes
- ✅ Centralized PDF management

## 📊 Architecture Flow

```
Database (pdf_documents table)
    ↓
Backend API (/api/pdf/documents)
    ↓
Frontend Header Component (fetches on mount)
    ↓
Dynamic Menu Items (Documents submenu)
```

## 1. Database Setup

### SQL Schema

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

### Field Descriptions

- **id**: Unique identifier
- **title**: Display name in menu (e.g., "Investment Prospectus")
- **description**: Optional description for admin reference
- **file_path**: Server file path (for backend reference)
- **file_url**: Public URL path (what frontend uses)
- **display_order**: Order in menu (lower numbers first)
- **is_active**: Toggle visibility without deleting

## 2. Backend API Implementation

### File: `backend/src/routes/pdf.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/database');

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

module.exports = router;
```

### Register Routes in `backend/src/server.js`:

```javascript
const pdfRoutes = require('./routes/pdf.routes');

app.use('/api/pdf', pdfRoutes);
```

## 3. Frontend Implementation

### Modified Files

#### `src/components/Header/menuData.tsx`

```tsx
import { Menu } from "@/types/menu";

const menuData: Menu[] = [
  {
    id: 1,
    title: "Home",
    path: "/",
    newTab: false,
  },
  {
    id: 2,
    title: "Company",
    newTab: false,
    submenu: [
      {
        id: 21,
        title: "About",
        path: "/about",
        newTab: false,
      },
      {
        id: 22,
        title: "Support",
        path: "/contact",
        newTab: false,
      },
      {
        id: 23,
        title: "FAQ",
        path: "/faq",
        newTab: false,
      },
    ],
  },
  {
    id: 3,
    title: "Properties",
    newTab: false,
    submenu: [
      {
        id: 31,
        title: "HMO",
        path: "/hmo",
        newTab: false,
      },
      {
        id: 32,
        title: "Listings",
        path: "/listings",
        newTab: false,
      },
    ],
  },
  {
    id: 4,
    title: "Documents",
    newTab: false,
    submenu: [], // Will be populated dynamically from API
  },
];

export default menuData;
```

#### `src/components/Header/index.tsx` (Key Changes)

```tsx
import axios from "axios";
import { Menu } from "@/types/menu";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const Header = () => {
  // Dynamic menu data with PDFs from API
  const [dynamicMenuData, setDynamicMenuData] = useState<Menu[]>(menuData);

  // Fetch PDF documents from API
  useEffect(() => {
    const fetchPDFDocuments = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/pdf/documents`);

        if (response.data.success && response.data.data) {
          const pdfDocuments = response.data.data;

          // Create submenu items from PDF documents
          const pdfSubmenu = pdfDocuments.map((pdf: any, index: number) => ({
            id: 40 + index + 1,
            title: pdf.title,
            path: `/pdf-viewer?file=${encodeURIComponent(pdf.file_url)}`,
            newTab: true,
          }));

          // Update menu data with dynamic PDFs
          const updatedMenuData = menuData.map(item => {
            if (item.title === "Documents") {
              return {
                ...item,
                submenu: pdfSubmenu
              };
            }
            return item;
          });

          setDynamicMenuData(updatedMenuData);
        }
      } catch (error) {
        console.error("Failed to fetch PDF documents:", error);
        // Keep static menu data on error
        setDynamicMenuData(menuData);
      }
    };

    fetchPDFDocuments();
  }, []);

  // Use dynamicMenuData instead of menuData in render
  {dynamicMenuData.map((menuItem, index) => (
    // ... menu rendering code
  ))}
};
```

## 4. How It Works

### On Page Load:

1. **Header Component Mounts**
   - Initializes with empty Documents submenu

2. **API Call**
   - Fetches `GET /api/pdf/documents`
   - Backend queries database for active PDFs

3. **Menu Update**
   - Transforms PDF data into menu items
   - Updates state with dynamic menu
   - Re-renders header with new items

4. **User Clicks Document**
   - Passcode modal appears (if not authenticated)
   - After verification, opens PDF viewer

### Example API Response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Investment Prospectus",
      "description": "Official investment prospectus document",
      "file_url": "/pdfs/prospectus.pdf",
      "display_order": 1
    },
    {
      "id": 2,
      "title": "Terms & Conditions",
      "description": "Legal terms and conditions",
      "file_url": "/pdfs/terms.pdf",
      "display_order": 2
    }
  ]
}
```

### Transformed to Menu Items:

```javascript
[
  {
    id: 41,
    title: "Investment Prospectus",
    path: "/pdf-viewer?file=%2Fpdfs%2Fprospectus.pdf",
    newTab: true
  },
  {
    id: 42,
    title: "Terms & Conditions",
    path: "/pdf-viewer?file=%2Fpdfs%2Fterms.pdf",
    newTab: true
  }
]
```

## 5. Managing PDFs

### Adding a New PDF

**Option 1: Direct Database Insert**

```sql
INSERT INTO pdf_documents (title, description, file_url, display_order)
VALUES ('New Document', 'Description here', '/pdfs/new-doc.pdf', 5);
```

**Option 2: Admin API (if implemented)**

```bash
curl -X POST http://localhost:4000/api/pdf/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "New Document",
    "description": "Description here",
    "file_path": "/pdfs/new-doc.pdf",
    "file_url": "/pdfs/new-doc.pdf",
    "display_order": 5
  }'
```

### Updating a PDF

```sql
UPDATE pdf_documents
SET title = 'Updated Title',
    file_url = '/pdfs/updated-file.pdf',
    display_order = 1
WHERE id = 3;
```

### Removing a PDF (Soft Delete)

```sql
UPDATE pdf_documents
SET is_active = FALSE
WHERE id = 2;
```

### Hard Delete (Not Recommended)

```sql
DELETE FROM pdf_documents WHERE id = 2;
```

## 6. Admin Panel Integration (Optional)

Create admin endpoints for managing PDFs:

```javascript
// Admin routes (require authentication)
router.post('/documents', authenticateAdmin, async (req, res) => {
  const { title, description, file_path, file_url, display_order } = req.body;

  await db.query(
    `INSERT INTO pdf_documents (title, description, file_path, file_url, display_order)
     VALUES (?, ?, ?, ?, ?)`,
    [title, description, file_path, file_url, display_order || 0]
  );

  res.json({ success: true, message: 'PDF created' });
});

router.put('/documents/:id', authenticateAdmin, async (req, res) => {
  const { title, description, file_path, file_url, display_order } = req.body;

  await db.query(
    `UPDATE pdf_documents
     SET title = ?, description = ?, file_path = ?, file_url = ?, display_order = ?
     WHERE id = ?`,
    [title, description, file_path, file_url, display_order, req.params.id]
  );

  res.json({ success: true, message: 'PDF updated' });
});

router.delete('/documents/:id', authenticateAdmin, async (req, res) => {
  await db.query(
    `UPDATE pdf_documents SET is_active = FALSE WHERE id = ?`,
    [req.params.id]
  );

  res.json({ success: true, message: 'PDF deactivated' });
});
```

## 7. Testing

### Test Backend API

```bash
# Fetch all PDFs
curl http://localhost:4000/api/pdf/documents

# Expected response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Investment Prospectus",
      "file_url": "/pdfs/prospectus.pdf",
      "display_order": 1
    }
  ]
}
```

### Test Frontend

1. **Check Browser Console**: Should see API call to `/api/pdf/documents`
2. **Inspect Header Menu**: Documents submenu should populate dynamically
3. **Add New PDF to Database**: Should appear in menu after page refresh
4. **Deactivate PDF**: Should disappear from menu after refresh

## 8. Deployment Checklist

- [ ] Create `pdf_documents` table in production database
- [ ] Insert initial PDF documents
- [ ] Upload PDF files to production server/CDN
- [ ] Deploy backend with `/api/pdf/documents` endpoint
- [ ] Deploy frontend with updated Header component
- [ ] Test PDF menu loads correctly
- [ ] Verify passcode protection still works
- [ ] Test adding/removing PDFs through database

## 9. Benefits

✅ **No Code Changes**: Add/remove PDFs without touching code
✅ **Centralized**: All PDF info in one database table
✅ **Flexible**: Easy to add descriptions, categories, permissions
✅ **Scalable**: Can add hundreds of PDFs without code bloat
✅ **Maintainable**: Non-technical staff can manage via admin panel
✅ **Consistent**: Same passcode protection applies to all PDFs

## 10. Future Enhancements

### Possible Additions:

1. **Categories**: Group PDFs by category (Legal, Financial, etc.)
2. **Permissions**: Different passcodes for different PDFs
3. **Analytics**: Track PDF views and downloads
4. **Search**: Search PDFs by title/description
5. **Upload**: Admin panel to upload PDFs directly
6. **Versioning**: Keep multiple versions of same document
7. **Expiration**: Auto-hide PDFs after certain date

### Example with Categories:

```sql
-- Add category field
ALTER TABLE pdf_documents ADD COLUMN category VARCHAR(100) DEFAULT 'General';

-- Update API to group by category
SELECT id, title, file_url, category, display_order
FROM pdf_documents
WHERE is_active = TRUE
ORDER BY category, display_order, title;
```

Then in frontend, create nested submenus by category.

## Notes

- PDFs are fetched once on component mount, not on every render
- Error handling keeps static menu if API fails
- File paths should be relative to public folder or absolute URLs
- `display_order` determines menu item order (lower = first)
- `is_active` allows hiding PDFs without deletion
- Use `file_url` for frontend, `file_path` for backend storage reference
