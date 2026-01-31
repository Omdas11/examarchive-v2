# 📘 ExamArchive-v2

**ExamArchive** is a clean, community-driven archive of university examination question papers, built with a strong focus on **clarity, accessibility, and student usability**.

This repository hosts **ExamArchive-v2**, a fully refactored, mobile-first static website powered by GitHub Pages.

---

## 🚨 Latest Update - Phase 8.3 (2026-01-31)

**Backend-First Admin System Redesign** - Complete overhaul of admin and role system.

### What Changed
- ✅ Backend-only admin verification (database is authority)
- ✅ Simplified badge system (3 slots, display-only)
- ✅ Redesigned footer (3 sections with brand logos)
- ✅ Complete security model overhaul
- ✅ Comprehensive documentation

### Quick Links
- 📖 [Migration Guide](docs/PHASE_8_3_SUMMARY.md)
- 🔐 [Security Model](docs/SECURITY_MODEL.md)
- 🎨 [Visual Changes](docs/VISUAL_CHANGES_SUMMARY.md)
- 📚 [Admin System Guide](docs/ADMIN_SYSTEM_GUIDE.md)

---

## 🌐 Live Site

👉 https://omdas11.github.io/examarchive-v2/

---

## 🎯 Project Goals

- Provide a **centralized archive** of university question papers
- Keep the UI **simple, distraction-free, and fast**
- Work reliably on **mobile devices**
- Avoid heavy frameworks (pure HTML, CSS, JS)
- Be **future-ready** for features like syllabus, repeated questions, and analytics

---

## ✨ Current Features (Implemented)

### 🔐 Authentication & Roles (Phase 8.3)
- Backend-first admin system
- Role hierarchy: visitor → user → reviewer → admin
- Secure admin dashboard access
- Display-only badge system (3 slots)

### 📂 Paper Archive
- Structured paper metadata (`papers.json`)
- Supports multiple:
  - Programmes (FYUG, CBCS)
  - Streams (Science, Arts, Commerce)
  - Years & paper codes
- Browse → Paper page → PDF flow fully working

---

### 📄 Paper Page
- Dedicated page per paper
- Sections for:
  - Syllabus (JSON-based)
  - Repeated Questions (unit-wise, year-wise)
- Graceful fallbacks when data is unavailable

---

### 🎨 Theme & Appearance System
A **fully custom theme engine** built from scratch.

#### Theme Modes
- ☀️ **Light**
- 🌙 **Dark**
- 🖤 **AMOLED (true black)**

Themes are implemented using CSS variables and:
```html
<body data-theme="light | dark | amoled">
```

---

## 📚 Documentation

### Core Architecture
- [Architecture Master Plan](docs/ARCHITECTURE_MASTER_PLAN.md) - Long-term planning (formerly PHASE7)
- [Phase 8.3 Implementation](docs/PHASE8_IMPLEMENTATION.md) - Backend-first admin system
- [Admin System Guide](docs/ADMIN_SYSTEM_GUIDE.md) - Complete admin reference
- [Role Model](docs/ROLE_MODEL.md) - Role hierarchy and permissions
- [Security Model](docs/SECURITY_MODEL.md) - Why frontend ≠ security
- [Future Phases](docs/FUTURE_PHASES.md) - Phases 9-13 roadmap

### Migration & Changes
- [Phase 8.3 Summary](docs/PHASE_8_3_SUMMARY.md) - Migration guide
- [Visual Changes](docs/VISUAL_CHANGES_SUMMARY.md) - Before/after comparison

### Legacy Documentation
- [Phase 6 Architecture](docs/legacy/PHASE6_ARCHITECTURE.md) - Storage, Pipeline & Phase 5 Fixes
- [Phase 5 & 6 Summary](docs/legacy/PHASE5_AND_6_SUMMARY.md) - Implementation Summary
- [Phase 4 Architecture](docs/legacy/PHASE4_ARCHITECTURE.md) - Repository Architecture & Content Pipeline

### Setup & Testing
- [Supabase Authentication Setup](docs/SUPABASE_AUTH_SETUP.md)
- [Testing Checklist](docs/TESTING_CHECKLIST.md)
- [Visual Guide](docs/VISUAL_GUIDE.md)

### Schema Documentation
- [Syllabus Schema](docs/schema/syllabus-schema.md)
- [Repeated Questions Schema](docs/schema/repeated-questions-schema.md)
- [Maps Schema](docs/schema/maps-schema.md)

---

## 🚀 Development

This project is built as a static website with no build step required. Simply clone and open in a browser or serve with any static file server.

```bash
# Clone the repository
git clone https://github.com/Omdas11/examarchive-v2.git

# Serve locally (example with Python)
cd examarchive-v2
python -m http.server 8000

# Open in browser
# http://localhost:8000
```

### Setting Up Admin Access (Phase 8.3)

1. Run SQL migration:
   ```sql
   -- In Supabase SQL Editor
   -- Run: admin/sql/05_roles_system.sql
   ```

2. Assign admin role:
   ```sql
   SELECT assign_role('your-user-id'::uuid, 'admin');
   ```

3. Verify:
   ```sql
   SELECT is_current_user_admin();
   ```

See [Admin System Guide](docs/ADMIN_SYSTEM_GUIDE.md) for details.

---

## 🤝 Contributing

Contributions are welcome! Whether it's:
- Adding question papers
- Improving documentation
- Fixing bugs
- Suggesting features

Please see our [Architecture Master Plan](docs/ARCHITECTURE_MASTER_PLAN.md) for the latest architectural vision and [Future Phases](docs/FUTURE_PHASES.md) for the implementation roadmap.

---

## 🔒 Security

ExamArchive uses a **backend-first security model**:
- All admin checks go through backend functions
- Frontend NEVER makes security decisions
- Role verification happens in the database
- See [Security Model](docs/SECURITY_MODEL.md) for details

---

## 📄 License

This project is open source and available for educational purposes.
