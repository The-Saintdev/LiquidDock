# LiquidDock build script
# Converts LiquidDock.yaml (readable source) into taskbar-config.json,
# the flattened settings JSON you paste into Windhawk's Advanced tab.
#
# Usage:  powershell -ExecutionPolicy Bypass -File build.ps1

$src = Join-Path $PSScriptRoot "LiquidDock.yaml"
$out = Join-Path $PSScriptRoot "taskbar-config.json"

$lines = Get-Content $src -Encoding UTF8

$topLevel = [ordered]@{}
$constants = New-Object System.Collections.ArrayList
$controls = New-Object System.Collections.ArrayList
$section = ""
$current = $null

foreach ($rawLine in $lines) {
    $line = $rawLine
    $trimmed = $line.Trim()
    if ($trimmed -eq "" -or $trimmed.StartsWith("#")) { continue }

    if ($trimmed -eq "styleConstants:") { $section = "constants"; continue }
    if ($trimmed -eq "controlStyles:")  { $section = "controls";  continue }

    # top-level scalar keys (theme, clickThroughTaskbar, xamlDiagnosticsHandling)
    if ($line -notmatch "^\s" -and $trimmed -match "^([A-Za-z]+):\s*(.*)$") {
        $val = $Matches[2].Trim().Trim('"')
        $topLevel[$Matches[1]] = $val
        continue
    }

    if ($section -eq "constants" -and $trimmed.StartsWith("- ")) {
        [void]$constants.Add($trimmed.Substring(2))
        continue
    }

    if ($section -eq "controls") {
        if ($trimmed.StartsWith("- target:")) {
            $current = [pscustomobject]@{
                target = $trimmed.Substring(9).Trim()
                styles = New-Object System.Collections.ArrayList
            }
            [void]$controls.Add($current)
            continue
        }
        if ($trimmed -eq "styles:") { continue }
        if ($trimmed.StartsWith("- ") -and $null -ne $current) {
            [void]$current.styles.Add($trimmed.Substring(2))
            continue
        }
    }
}

# Flatten to Windhawk's Advanced-tab JSON shape
$flat = [ordered]@{}
$flat["theme"] = $topLevel["theme"]
for ($i = 0; $i -lt $constants.Count; $i++) {
    $flat["styleConstants[$i]"] = $constants[$i]
}
for ($i = 0; $i -lt $controls.Count; $i++) {
    $flat["controlStyles[$i].target"] = $controls[$i].target
    for ($j = 0; $j -lt $controls[$i].styles.Count; $j++) {
        $flat["controlStyles[$i].styles[$j]"] = $controls[$i].styles[$j]
    }
}
$flat["resourceVariables[0].variableKey"] = ""
$flat["resourceVariables[0].value"] = ""
$flat["themeResourceVariables[0]"] = ""
if ($topLevel.Contains("clickThroughTaskbar")) { $flat["clickThroughTaskbar"] = $topLevel["clickThroughTaskbar"] }
if ($topLevel.Contains("xamlDiagnosticsHandling")) { $flat["xamlDiagnosticsHandling"] = $topLevel["xamlDiagnosticsHandling"] }

# Manual JSON serialization to keep exact key order and string values
$sb = New-Object System.Text.StringBuilder
[void]$sb.Append("{")
$first = $true
foreach ($key in $flat.Keys) {
    if (-not $first) { [void]$sb.Append(",") }
    $first = $false
    $k = $key -replace '\\', '\\\\' -replace '"', '\"'
    $v = [string]$flat[$key] -replace '\\', '\\\\' -replace '"', '\"'
    [void]$sb.Append('"' + $k + '":"' + $v + '"')
}
[void]$sb.Append("}")

[System.IO.File]::WriteAllText($out, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))

Write-Host "Wrote $out"
Write-Host ("  styleConstants : {0}" -f $constants.Count)
Write-Host ("  controlStyles  : {0}" -f $controls.Count)
Write-Host ("  total styles   : {0}" -f (($controls | ForEach-Object { $_.styles.Count } | Measure-Object -Sum).Sum))
