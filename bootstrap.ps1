$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
Set-Location $Root
Write-Host "MIM Inspection Platform - G4 bootstrap"
python scripts/validate_memory.py
New-Item -ItemType Directory -Force -Path "product-contract/evidence/attachments" | Out-Null
New-Item -ItemType Directory -Force -Path ".project-memory/audit" | Out-Null
if (-not (Test-Path ".git")) {
  git init -b main
}
Write-Host "Open this exact folder as an Obsidian vault, then run Claude Code from this root."
