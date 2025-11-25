# DigiArtifact Workers Portal

A full-featured time tracking and project management system for DigiArtifact team members.

## 🎯 Features

- **Clock In/Out** - Track work sessions with one click
- **Break Timer** - Log breaks and maintain work-life balance
- **Project Tracking** - Associate time entries with specific projects
- **Weekly Charts** - Visual representation of hours worked
- **Reports** - Monthly analytics with export to CSV
- **Admin Panel** - User management and oversight (for admins)
- **Mobile Responsive** - Works on all device sizes

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Chart.js** - Data visualization
- **date-fns** - Date manipulation

### Backend
- **Cloudflare Workers** - Serverless API
- **Cloudflare D1** - SQLite database
- **JWT Authentication** - Secure token-based auth

## 📊 Database Schema (D1)

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'worker', -- 'admin' or 'worker'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#cca43b',
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Time entries table
CREATE TABLE time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  project_id INTEGER,
  clock_in DATETIME NOT NULL,
  clock_out DATETIME,
  break_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Break logs table
CREATE TABLE breaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time_entry_id INTEGER NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  FOREIGN KEY (time_entry_id) REFERENCES time_entries(id)
);
```

## 🔐 Authentication Flow

1. User visits `workers.digiartifact.com`
2. Cloudflare Access intercepts and requires authentication
3. User authenticates via email OTP or identity provider
4. Access token stored in session
5. API calls include JWT for authorization

## 🚀 API Endpoints (Workers)

```
POST   /api/auth/login      - Authenticate user
POST   /api/auth/logout     - End session

GET    /api/clock/status    - Get current clock status
POST   /api/clock/in        - Clock in to work
POST   /api/clock/out       - Clock out from work

POST   /api/break/start     - Start a break
POST   /api/break/end       - End break

GET    /api/entries         - List time entries (with filters)
GET    /api/entries/:id     - Get single entry
PUT    /api/entries/:id     - Update entry (admin only)

GET    /api/projects        - List all projects
POST   /api/projects        - Create project (admin only)

GET    /api/stats/daily     - Daily hours summary
GET    /api/stats/weekly    - Weekly breakdown
GET    /api/stats/monthly   - Monthly report

GET    /api/admin/users     - List all users (admin only)
POST   /api/admin/users     - Create user (admin only)
```

## 🛠️ Setup Instructions

### 1. Create Cloudflare Pages Project
```bash
# In Cloudflare Dashboard:
# Workers & Pages → Create → Pages → Connect to Git
# Root directory: workers
```

### 2. Create D1 Database
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create digiartifact-workers

# Run migrations
wrangler d1 execute digiartifact-workers --file=./schema.sql
```

### 3. Create Worker for API
```bash
# Create worker
wrangler init workers-api

# Deploy
wrangler deploy
```

### 4. Set Up Cloudflare Access
1. Go to Zero Trust Dashboard
2. Create Access Application for `workers.digiartifact.com`
3. Configure authentication method (email OTP recommended)
4. Add authorized users

## 📁 File Structure (Future)

```
workers/
├── index.html          # Login/Dashboard page
├── CNAME               # Custom domain
├── README.md           # This file
├── css/
│   └── styles.css      # Custom styles
├── js/
│   ├── app.js          # Main application logic
│   ├── clock.js        # Clock in/out functionality
│   ├── charts.js       # Analytics charts
│   └── api.js          # API client
├── pages/
│   ├── dashboard.html  # Main dashboard
│   ├── history.html    # Time entry history
│   ├── projects.html   # Project management
│   └── admin.html      # Admin panel
└── api/                # Cloudflare Worker code
    ├── wrangler.toml   # Worker config
    ├── src/
    │   ├── index.js    # Main worker entry
    │   ├── auth.js     # Authentication logic
    │   ├── clock.js    # Clock operations
    │   └── db.js       # D1 database queries
    └── schema.sql      # Database schema
```

## 🎨 Design System

Using DigiArtifact's established design tokens:
- **Primary**: `#cca43b` (Relic Gold)
- **Accent**: `#00f0ff` (Hologram Cyan)
- **Background**: `#0a0a0a` (Obsidian)
- **Surface**: `#1e1e24` (Slate)
- **Text**: `#e3d5ca` (Sand)
- **Muted**: `#94a3b8` (Text Slate)

## 📅 Development Roadmap

### Phase 1: MVP
- [ ] Basic login page
- [ ] Clock in/out functionality
- [ ] Simple time log display

### Phase 2: Core Features
- [ ] Break tracking
- [ ] Project assignment
- [ ] Daily/weekly summaries

### Phase 3: Analytics
- [ ] Charts and graphs
- [ ] Export to CSV
- [ ] Custom date ranges

### Phase 4: Admin
- [ ] User management
- [ ] Project CRUD
- [ ] Reports generation

---

*Part of the DigiArtifact ecosystem*
