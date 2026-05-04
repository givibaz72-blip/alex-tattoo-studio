# Quick snapshot of the current working tree to a git commit.
# Usage: .\scripts\snapshot.ps1 "step 6: inquiry validation"
param(
    [string]$Message
)

$ErrorActionPreference = "Stop"
Set-Location -Path (Split-Path -Parent $PSScriptRoot)

if (-not $Message) {
    $Message = "checkpoint $(Get-Date -Format 'yyyy-MM-dd_HH:mm')"
}

# Remove stale lock file (sometimes editors leave them)
$lockFile = ".git\index.lock"
if (Test-Path $lockFile) {
    Write-Host "Removing stale $lockFile"
    Remove-Item -Force $lockFile
}

git add -A

# Check if there is anything staged
$staged = git diff --cached --name-only
if (-not $staged) {
    Write-Host "Nothing to commit."
    exit 0
}

git commit -m $Message
Write-Host "Snapshot saved: $Message" -ForegroundColor Green
Write-Host ""
Write-Host "Recent history:"
git log --oneline -5
