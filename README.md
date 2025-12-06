# DigiArtifact

DigiArtifact is the name of my company.

## Version

**Current Version:** 1.1.0 (December 2025)

## Tech Stack

### Workers Portal
- **Frontend:** Next.js 16.0.7, React 19.2.1, TypeScript, Tailwind CSS
- **Backend:** Cloudflare Workers (Hono framework), D1 Database
- **Build:** Turbopack (Next.js 16 default)
- **Deployment:** Cloudflare Pages

### Other Projects
- **Main Landing:** Static HTML + Tailwind CDN
- **DigiArtifact Hub:** Next.js + TypeScript
- **Secret Vault:** Static HTML + custom CSS

## Project Structure

This repository contains multiple web projects:

- **Root Landing (`/`)** - Company landing page
- **DigiArtifact Hub (`/digiartifact-hub/`)** - Next.js artifact marketplace
- **Workers Portal (`/workers/`)** - Time tracking & productivity app
- **Secret Vault (`/secretvault/`)** - Private content area

## Recent Changes (December 2025)

### Framework Upgrades
- Next.js 14.2.33 → **16.0.7** (Turbopack now default bundler)
- React 18.3.1 → **19.2.1**
- React-DOM 18.3.1 → **19.2.1**

### Codebase Cleanup
- Removed obsolete files (test files, build caches, intermediates)
- Refactored monolithic API (1376 lines → 13 modular route files)
- Refactored Settings component (1028 lines → 7 tab modules)
- ~1GB of disk space freed

## Backups

### Version 1.0.0 Backup

A complete offline backup of the project was created on **December 4, 2025**.

**Backup File:** `digiArtifact.v1.0.0.backup`  
**Location:** Parent directory (`../digiArtifact.v1.0.0.backup`)  
**Format:** 7-Zip compressed archive (renamed to .backup)  
**Size:** ~6.8 GB

#### How to Restore from Backup

1. **Rename the file** to add `.7z` extension:
   ```powershell
   Rename-Item -Path "digiArtifact.v1.0.0.backup" -NewName "digiArtifact.v1.0.0.7z"
   ```

2. **Extract using 7-Zip:**
   ```powershell
   # Install 7-Zip if not installed
   winget install 7zip.7zip
   
   # Extract the archive
   & "C:\Program Files\7-Zip\7z.exe" x "digiArtifact.v1.0.0.7z" -o"."
   ```

3. **Or use 7-Zip GUI:** Right-click the `.7z` file → 7-Zip → Extract Here

#### Creating New Backups

To create a new version backup:

```powershell
# Navigate to parent directory
cd "d:\DEV\Coding Projects\Company and business projects"

# Copy project folder
Copy-Item -Path "DigiArtifact" -Destination "digiArtifact.backup" -Recurse -Force

# Compress with 7-Zip (adjust version number)
& "C:\Program Files\7-Zip\7z.exe" a -t7z "digiArtifact.v1.0.x.7z" "digiArtifact.backup" -mx=5

# Clean up and rename
Remove-Item -Path "digiArtifact.backup" -Recurse -Force
Rename-Item -Path "digiArtifact.v1.0.x.7z" -NewName "digiArtifact.v1.0.x.backup"
```

## Version Control

- **v1.0.0** - Base version (December 4, 2025) - Complete project with Workers Portal, analytics, admin features
- **v1.0.x** - Patch releases for bug fixes and minor improvements

Major version bumps (v1.1.0, v2.0.0) will occur when significant new features are added.

## .gitignore

The backup files are excluded from git tracking. See `.gitignore` for details.
