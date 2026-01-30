# 📘 ExamArchive-v2

**ExamArchive** is a clean, community-driven archive of university examination question papers, built with a strong focus on **clarity, accessibility, and student usability**.

This repository hosts **ExamArchive-v2**, a fully refactored, mobile-first static website powered by GitHub Pages.

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

### Architecture & Planning
- [Phase 7 Architecture](docs/PHASE7_ARCHITECTURE.md) - Web Architecture & AI Automation Planning (Latest)
- [Phase 6 Architecture](docs/PHASE6_ARCHITECTURE.md) - Storage, Pipeline & Phase 5 Fixes
- [Phase 5 & 6 Summary](docs/PHASE5_AND_6_SUMMARY.md) - Implementation Summary
- [Phase 4 Architecture Plan](docs/PHASE4_ARCHITECTURE.md) - Repository Architecture & Content Pipeline
- [Roadmap](docs/roadmap.md)

### Setup Guides
- [Supabase Authentication Setup](docs/SUPABASE_AUTH_SETUP.md)

### Testing & Quality
- [Testing Checklist](docs/TESTING_CHECKLIST.md)
- [Visual Guide](docs/VISUAL_GUIDE.md)
- [Fix Summary](docs/FIX_SUMMARY.md)

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

---

## 🤝 Contributing

Contributions are welcome! Whether it's:
- Adding question papers
- Improving documentation
- Fixing bugs
- Suggesting features

Please see our [Phase 7 Architecture](docs/PHASE7_ARCHITECTURE.md) for the latest architectural vision and implementation roadmap.

---

## 📄 License

This project is open source and available for educational purposes.
