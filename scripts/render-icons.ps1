# Erzeugt die PNG-Icons der App aus den SVG-Vorlagen – mit dem installierten Chrome im
# Headless-Modus (ohne Fenster), daher ohne zusätzliches npm-Paket.
# Aufruf aus dem Projektordner:  powershell -ExecutionPolicy Bypass -File scripts/render-icons.ps1
#
# Vorlagen: public/icon.svg (Motiv) und scripts/icons/maskable.svg (Motiv verkleinert für Android).
# Ergebnis: PNGs in public/, die vite-plugin-pwa ins Manifest bzw. index.html einbindet.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw 'Weder Chrome noch Edge gefunden.' }

$tmp = Join-Path ([IO.Path]::GetTempPath()) 'ligretto-icons'
New-Item -ItemType Directory -Force $tmp | Out-Null

$icons = @(
  @{ Svg = 'public/icon.svg';            Out = 'public/pwa-192x192.png';      Size = 192 },
  @{ Svg = 'public/icon.svg';            Out = 'public/pwa-512x512.png';      Size = 512 },
  @{ Svg = 'public/icon.svg';            Out = 'public/apple-touch-icon.png'; Size = 180 },
  @{ Svg = 'scripts/icons/maskable.svg'; Out = 'public/maskable-512x512.png'; Size = 512 }
)

foreach ($icon in $icons) {
  $svg = (Resolve-Path (Join-Path $root $icon.Svg)).Path
  $out = Join-Path $root $icon.Out
  $size = $icon.Size
  Remove-Item $out -ErrorAction SilentlyContinue # damit ein Fehler nicht durch die alte Datei verdeckt wird
  # Kleine HTML-Seite, die das SVG randlos in genau der Zielgröße zeigt.
  $html = Join-Path $tmp "render-$size.html"
  $src = 'file:///' + ($svg -replace '\\', '/')
  Set-Content $html -Encoding utf8 -Value "<!doctype html><html><body style=`"margin:0`"><img src=`"$src`" width=`"$size`" height=`"$size`" style=`"display:block`"></body></html>"

  $chromeArgs = @(
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    "--window-size=$size,$size", "--user-data-dir=$tmp\profile", "--screenshot=$out",
    ('file:///' + ($html -replace '\\', '/'))
  )
  Start-Process -FilePath $chrome -ArgumentList $chromeArgs -Wait -NoNewWindow -RedirectStandardError "$tmp\chrome.log"
  if (-not (Test-Path $out)) { throw "Konnte $($icon.Out) nicht erzeugen." }
  Write-Host "erstellt: $($icon.Out) ($size x $size)"
}
