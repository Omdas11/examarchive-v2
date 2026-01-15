# 📘 ExamArchive

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
