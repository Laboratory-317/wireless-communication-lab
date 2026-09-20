param(
    [Parameter(Mandatory = $true)]
    [string] $Version
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$files = @((Join-Path $root "index.html"))
$files += Get-ChildItem -LiteralPath (Join-Path $root "themes-preview") -Recurse -Filter "*.html" |
    Where-Object { $_.FullName -notmatch "\\themes-preview\\[^\\]+-demo\\" } |
    ForEach-Object { $_.FullName }

foreach ($path in $files) {
    $text = Get-Content -Raw -LiteralPath $path
    $text = [regex]::Replace($text, 'css/style\.css(\?v=[^">]*)?', "css/style.css?v=$Version")
    $text = [regex]::Replace($text, 'style\.css(\?v=[^">]*)?', "style.css?v=$Version")
    $text = [regex]::Replace($text, 'js/lab-content\.js(\?v=[^">]*)?', "js/lab-content.js?v=$Version")
    $text = [regex]::Replace($text, 'js/main\.js(\?v=[^">]*)?', "js/main.js?v=$Version")
    $text = [regex]::Replace($text, '\.\./\.\./js/lab-content\.js(\?v=[^">]*)?', "../../js/lab-content.js?v=$Version")
    $text = [regex]::Replace($text, '\.\./\.\./js/render-theme\.js(\?v=[^">]*)?', "../../js/render-theme.js?v=$Version")
    $text = [regex]::Replace($text, 'js/color-mode\.js(\?v=[^">]*)?', "js/color-mode.js?v=$Version")
    Set-Content -LiteralPath $path -Value $text -NoNewline
}

Get-ChildItem -LiteralPath (Join-Path $root "themes-preview") -Recurse -Filter "style.css" |
    Where-Object { $_.FullName -notmatch "\\themes-preview\\[^\\]+-demo\\" } |
    ForEach-Object {
        $text = Get-Content -Raw -LiteralPath $_.FullName
        $text = [regex]::Replace($text, 'theme-base\.css(\?v=[^"\)]*)?', "theme-base.css?v=$Version")
        Set-Content -LiteralPath $_.FullName -Value $text -NoNewline
    }

Write-Host "Updated HTML and shared theme CSS cache version to $Version"

foreach ($relative in @("css\theme-base.css", "css\style.css")) {
    $path = Join-Path $root $relative
    $text = Get-Content -Raw -LiteralPath $path
    $text = [regex]::Replace($text, 'color-mode\.css(\?v=[^"\)]*)?', "color-mode.css?v=$Version")
    Set-Content -LiteralPath $path -Value $text -NoNewline
}
