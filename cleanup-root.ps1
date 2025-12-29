<#
  cleanup-root.ps1
  Safely deletes legacy root files/folders listed in the "KILL LIST" for DigiArtifact.

  Usage:
    # Dry run (no deletions):
    .\cleanup-root.ps1 -DryRun

    # Confirmed run (will prompt for confirmation):
    .\cleanup-root.ps1

    # Force run without interactive confirmation (use with caution):
    .\cleanup-root.ps1 -Force

  Behavior/Safety:
    - Checks that at least one protected marker (like `.git` or `digiartifact-hub`) exists in the current directory before proceeding.
    - Aborts if any overlap is found between the kill list and protected items.
    - Uses Remove-Item -Recurse -Force to remove items when confirmed.
#>

param(
  [switch]$DryRun,
  [switch]$Force
)

$killFolders = @('artifact', 'assets', 'original-site-backup', 'secretvault', '.venv')
$killFiles   = @('remove_watermark.py', 'gallery.html', 'index.html', 'index.old.html', 'studio.html', 'terminal.html', 'vault.html', 'CNAME')

$protected = @('workers', 'digiartifact-hub', 'documents', '.git', '.gitignore')

Write-Host "DigiArtifact Root Cleanup Script" -ForegroundColor Cyan
if ($DryRun) { Write-Host "Mode: DRY RUN (no deletions will be performed)" -ForegroundColor Yellow }

# Safety: ensure we are in the repository root (must find at least one protected marker)
$foundProtected = $protected | Where-Object { Test-Path $_ }
if (-not $foundProtected) {
  Write-Error "Protected markers not found in this directory. Aborting to avoid accidental deletions. Ensure you run this from the repository root."
  exit 1
}

# Safety: ensure kill list doesn't overlap protected items
$overlap = @($killFolders + $killFiles) | Where-Object { $protected -contains $_ }
if ($overlap) {
  Write-Error "ERROR: The following items are both in the kill list and the protected list: $($overlap -join ', ') - Aborting."
  exit 1
}

if (-not $Force) {
  $confirm = Read-Host "Proceed to delete listed items from current directory? Type 'YES' to continue"
  if ($confirm -ne 'YES') {
    Write-Host "Aborted by user." -ForegroundColor Yellow
    exit 0
  }
}

function Remove-IfExists {
  param(
    [string]$Path
  )
  try {
    if (Test-Path $Path) {
      if ($DryRun) {
        Write-Host "[DRY] Would delete: $Path"
      } else {
        Write-Host "Deleting: $Path" -ForegroundColor Red
        Remove-Item $Path -Recurse -Force -ErrorAction Stop
      }
    } else {
      Write-Host "Not found (skipping): $Path"
    }
  } catch {
    Write-Error ("Failed to delete {0}: {1}" -f $Path, $_)
  }
}

# Delete folders
foreach ($f in $killFolders) {
  Remove-IfExists -Path $f
}

# Delete files
foreach ($f in $killFiles) {
  Remove-IfExists -Path $f
}

Write-Host "`nCleanup complete." -ForegroundColor Green
if ($DryRun) { Write-Host "Note: This was a dry run; no files were deleted." -ForegroundColor Yellow }
