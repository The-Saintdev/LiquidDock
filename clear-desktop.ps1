# clear-desktop.ps1 — hide/show the desktop icons (NON-destructive).
#
# This only toggles VISIBILITY of desktop icons. Your files stay
# exactly where they are in C:\Users\<you>\Desktop — nothing is
# moved, renamed, or deleted. Fully reversible.
#
#   powershell -ExecutionPolicy Bypass -File clear-desktop.ps1 -Hide
#   powershell -ExecutionPolicy Bypass -File clear-desktop.ps1 -Show
#
# (You can also just right-click the desktop -> View -> "Show
#  desktop icons" to toggle the same thing by hand.)

param(
    [switch]$Hide,
    [switch]$Show
)

$key = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced"

if (-not $Hide -and -not $Show) {
    Write-Host "Usage: clear-desktop.ps1 -Hide   (or)   -Show"
    exit
}

$value = if ($Hide) { 1 } else { 0 }
New-ItemProperty -Path $key -Name "HideIcons" -Value $value -PropertyType DWord -Force | Out-Null

# Refresh the desktop so the change shows immediately.
Stop-Process -Name explorer -Force
Start-Process explorer

if ($Hide) {
    Write-Host "Desktop icons hidden. Files are untouched. Run with -Show to bring them back."
} else {
    Write-Host "Desktop icons restored."
}
