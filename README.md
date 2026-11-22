# Flama CBT Platform

A modern, responsive Computer-Based Testing (CBT) platform designed to support digital examinations for schools and educational institutions.

The platform is being developed as a multi-role system with dedicated interfaces for students, teachers, principals, school administrators, platform administrators, and public users.

---

## Overview

Flama CBT is a digital examination platform designed to simplify the creation, management, delivery, and monitoring of computer-based examinations.

The platform provides different interfaces for the various users involved in the examination process, creating a connected ecosystem for schools and educational institutions.

The frontend is being developed with a focus on:

- Responsive design
- Clean and reusable UI components
- Consistent design systems
- Accessible interfaces
- Intuitive user experiences
- Maintainable frontend architecture
- Cross-device compatibility

Backend development is scheduled to begin alongside the continued development of the frontend.

---

## Platform Interfaces

### Student Portal

The Student Portal provides students with interfaces for:

- Accessing their dashboard
- Managing their profile
- Viewing available examinations
- Taking timed examinations
- Navigating between questions
- Tracking examination progress
- Submitting examinations
- Viewing examination results and reports

### Teacher Dashboard

The Teacher Dashboard provides interfaces for:

- Managing examinations
- Creating and managing questions
- Monitoring students
- Reviewing examination performance
- Viewing reports and analytics

### Principal Dashboard

The Principal Dashboard provides school-level oversight of examination activities, including:

- School performance
- Student performance
- Teacher activity
- Examination monitoring
- Analytics and reports

### School Admin Dashboard

The School Admin Dashboard provides interfaces for managing:

- School information
- Staff and users
- School configuration
- Subscriptions
- Administrative activities

### Platform Admin Dashboard

The Platform Admin Dashboard provides platform-level management capabilities, including:

- School management
- User management
- Platform activity
- Subscription management
- System analytics
- Administrative operations

### Public Website

The public-facing website provides:

- Homepage
- Platform information
- Features
- Benefits
- School registration/onboarding
- Contact pages
- Other public-facing content

---

## Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript (ES6+)

### Development Tools

- Git
- GitHub
- Visual Studio Code
- Figma

The frontend is currently being implemented using Vanilla JavaScript without frontend frameworks.

## Deployment

- Frontend: https://creativesbee.site
- Backend API: https://flama.onrender.com/api

Browser integration scripts use the local API on port `5000` during local development and the deployed API in production. Set `window.FLAMA_API_BASE` before a page's integration scripts to override the API base when needed.

School portals identify the school from the hostname, for example `https://school-slug.creativesbee.site/student/index.html`. The frontend also recognizes the legacy Render host pattern. The configured canonical frontend domain is `creativesbee.site`; the frontend derives the school from either host and sends it as `X-School-Subdomain`, which the API verifies against the school database. Render must have `*.creativesbee.site` configured as a wildcard custom domain for the frontend service.

---

## Project Structure

```text
flama-cbt-platform/
│
├── student/
│   ├── assets/
│   ├── css/
│   ├── js/
│   └── pages/
│
├── teacher/
│   ├── assets/
│   ├── css/
│   ├── js/
│   └── pages/
│
├── principal/
│   ├── assets/
│   ├── css/
│   ├── js/
│   └── pages/
│
├── school-admin/
│   ├── assets/
│   ├── css/
│   ├── js/
│   └── pages/
│
├── platform-admin/
│   ├── assets/
│   ├── css/
│   ├── js/
│   └── pages/
│
├── .gitignore
├── LICENSE
|__ assets
|__ auth
|   |__assets/
│   ├── css/
│   ├── js/
│   └── pages/
|__ css
|__ js
|__ index.html
|__ about.html
|__ pricing.html
|__ contact.html
└── README.md

```

### Production build

The frontend is a multi-page static site. Run `npm install` and then `npm run build` to create a production copy in `dist/`. The build minifies HTML and JavaScript and combines compatible classic scripts used by each page into bundles while preserving the existing page paths. Source pages remain unchanged.

For the Render static site, use `npm install && npm run build` as the build command and `dist` as the publish directory.
