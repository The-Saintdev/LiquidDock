# LiquidDock build script
# Converts a readable *.yaml source into the flattened *-config.json
# you paste into a Windhawk styler mod's Advanced/Textual tab.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File build.ps1              # builds everything
#   powershell -ExecutionPolicy Bypass -File build.ps1 LiquidDock.yaml taskbar-config.json
#
# The YAML may declare any number of top-level scalar keys
# (theme:, clickThroughTaskbar:, disableNewStartMenuLayout:, ...).
# "theme" is emitted first; every other top-level key is emitted
# after the styles, preserving source order — so the same builder
# works for the Taskbar Styler and the Start Menu Styler.

param(
    [string]$Source = "",
    [string]$Out = ""
)

function Build-One {
    param([string]$src, [string]$out)

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

        if ($line -notmatch "^\s" -and $trimmed -match "^([A-Za-z0-9]+):\s*(.*)$") {
            $topLevel[$Matches[1]] = $Matches[2].Trim().Trim('"')
            continue
        }

        if ($section -eq "constants" -and $trimmed.StartsWith("- ")) {
            [void]$constants.Add($trimmed.Substring(2)); continue
        }

        if ($section -eq "controls") {
            if ($trimmed.StartsWith("- target:")) {
                $current = [pscustomobject]@{
                    target = $trimmed.Substring(9).Trim()
                    styles = New-Object System.Collections.ArrayList
                }
                [void]$controls.Add($current); continue
            }
            if ($trimmed -eq "styles:") { continue }
            if ($trimmed.StartsWith("- ") -and $null -ne $current) {
                [void]$current.styles.Add($trimmed.Substring(2)); continue
            }
        }
    }

    $flat = [ordered]@{}
    if ($topLevel.Contains("theme")) { $flat["theme"] = $topLevel["theme"] } else { $flat["theme"] = "" }
    for ($i = 0; $i -lt $constants.Count; $i++) { $flat["styleConstants[$i]"] = $constants[$i] }
    for ($i = 0; $i -lt $controls.Count; $i++) {
        $flat["controlStyles[$i].target"] = $controls[$i].target
        for ($j = 0; $j -lt $controls[$i].styles.Count; $j++) {
            $flat["controlStyles[$i].styles[$j]"] = $controls[$i].styles[$j]
        }
    }
    $flat["resourceVariables[0].variableKey"] = ""
    $flat["resourceVariables[0].value"] = ""
    $flat["themeResourceVariables[0]"] = ""
    foreach ($k in $topLevel.Keys) {
        if ($k -ne "theme") { $flat[$k] = $topLevel[$k] }
    }

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

    $total = ($controls | ForEach-Object { $_.styles.Count } | Measure-Object -Sum).Sum
    Write-Host ("Wrote {0}  (constants={1}, controls={2}, styles={3})" -f $out, $constants.Count, $controls.Count, $total)
}

if ($Source -ne "" -and $Out -ne "") {
    Build-One (Join-Path $PSScriptRoot $Source) (Join-Path $PSScriptRoot $Out)
} else {
    Build-One (Join-Path $PSScriptRoot "LiquidDock.yaml")  (Join-Path $PSScriptRoot "taskbar-config.json")
    if (Test-Path (Join-Path $PSScriptRoot "LiquidStart.yaml")) {
        Build-One (Join-Path $PSScriptRoot "LiquidStart.yaml") (Join-Path $PSScriptRoot "start-menu-config.json")
    }
}
