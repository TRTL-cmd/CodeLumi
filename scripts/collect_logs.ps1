param(
  [string]$RepoRoot = "$(Resolve-Path ..)"
)

$ts = Get-Date -Format yyyyMMdd_HHmmss
$dest = Join-Path . "lumi_logs_$ts.zip"
$paths = @(
  "userData\self-learn\*",
  "userData\security\*",
  "logs\*",
  "build\*"
)
$existing = $paths | Where-Object { Test-Path $_ }
if(-not (Test-Path .\release_logs)) { New-Item -ItemType Directory -Path .\release_logs | Out-Null }
$dest = Join-Path .\release_logs "lumi_logs_$ts.zip"

if($existing.Count -eq 0){ Write-Host "No known log files found to archive."; exit 1 }

Write-Host "Creating archive: $dest"
Compress-Archive -Path $existing -DestinationPath $dest -Force
Write-Host "Archive created: $dest"