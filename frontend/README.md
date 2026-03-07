# Campus ERP — Frontend

A production-ready Vite + React frontend for the Campus ERP system.

## Tech Stack

- **Vite** — build tool & dev server
- **React 18** — UI framework
- **React Router v6** — client-side routing
- **TanStack React Query** — data fetching & caching
- **Axios** — HTTP client with auto token refresh
- **React Hot Toast** — notifications
- **CSS Modules** — scoped component styles

## Project Structure

```
src/
├── api/
│   ├── client.js          # Axios instance + token refresh interceptor
│   └── services.js        # All API service functions
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx  # Shell with sidebar + topbar
│   │   ├── Sidebar.jsx
│   │   └── Topbar.jsx
│   └── ui/
│       ├── Button.jsx
│       ├── Input.jsx       # text, select, textarea
│       ├── Modal.jsx
│       ├── DataTable.jsx
│       ├── CrudPage.jsx    # Generic CRUD page (list + create/edit/delete)
│       └── Misc.jsx        # Card, Badge, Alert, Spinner, Empty, StatCard
├── context/
│   └── AuthContext.jsx    # Auth state + RBAC can() helper
├── hooks/
│   └── useCrud.js         # useList + useCrud (React Query wrappers)
├── pages/
│   ├── auth/              # Login, ForgotPassword, ResetPassword
│   ├── dashboard/
│   ├── departments/
│   ├── students/
│   ├── faculty/
│   ├── courses/
│   ├── subjects/
│   ├── classes/
│   ├── academic-years/
│   ├── attendance/
│   ├── notices/
│   └── profile/           # Register + Profile
└── styles/
    └── globals.css
```

## Setup

### 1. Install dependencies
```bash
cd campus-erp-frontend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env if your backend runs on a different port
```

`.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Run development server
```bash
npm run dev
# Opens at http://localhost:3000
```

### 4. Build for production
```bash
npm run build
# Output in /dist — serve with any static host or your Express backend
```

## Serving from your Express backend (optional)

Add this to your `server.js` to serve the built frontend:

```js
const path = require('path')
app.use(express.static(path.join(__dirname, '../campus-erp-frontend/dist')))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../campus-erp-frontend/dist/index.html'))
})
```

## Role Access Matrix

| Resource       | Read | Create      | Update           | Delete  |
|----------------|------|-------------|------------------|---------|
| Departments    | All  | Admin       | Admin, HOD       | Admin   |
| Faculty        | All  | Admin, HOD  | Admin, HOD, Fac  | Admin   |
| Students       | All  | Admin, HOD  | Admin, HOD, Fac  | Admin   |
| Courses        | All  | Admin, HOD  | Admin, HOD       | Admin   |
| Subjects       | All  | Admin, HOD  | Admin, HOD       | Admin   |
| Classes        | All  | Admin, HOD  | Admin, HOD       | Admin   |
| Attendance     | All  | Admin, HOD, Fac | Admin, HOD, Fac | Admin, HOD |
| Academic Years | All  | Admin       | Admin            | Admin   |
| Notices        | All  | Admin, HOD, Fac | Admin, HOD, Fac | Admin, HOD |
