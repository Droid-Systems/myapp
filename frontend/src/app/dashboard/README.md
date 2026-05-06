# Dashboard Structure

This directory contains the user dashboard section of the application.

## Folder Structure

```
/dashboard
├── /overview          # Dashboard overview/home page
├── /investments       # User investments page
├── /profile          # User profile settings
└── /documents        # User documents page
```

## Routes

- `/dashboard` - Main dashboard (redirects to overview)
- `/dashboard/overview` - Dashboard overview with stats and charts
- `/dashboard/investments` - View and manage investments
- `/dashboard/profile` - User profile and settings
- `/dashboard/documents` - Access important documents

## Components Location

Dashboard-specific components are located in:
`/src/components/Dashboard/`

### Component Categories:
- **Sidebar** - Dashboard navigation sidebar
- **Cards** - Stat cards, info cards, etc.
- **Charts** - Data visualization components
- **Tables** - Data tables for investments, transactions, etc.
