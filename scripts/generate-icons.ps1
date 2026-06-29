# Generates PWA raster icons (icon-192.png, icon-512.png) from the BDMFlow
# brand design (mirrors public/icon.svg). Pure Windows GDI+ — no external deps.
#   Run:  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-icons.ps1
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot '..\public'

function New-Icon([int]$size, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.TextRenderingHint  = [System.Drawing.Text.TextRenderingHint]::AntiAlias

  $s = $size / 512.0
  $full = New-Object System.Drawing.Rectangle(0, 0, $size, $size)

  # Background: deep-navy diagonal gradient (full-bleed so maskable crop stays solid)
  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $full,
    [System.Drawing.Color]::FromArgb(255, 5, 9, 20),
    [System.Drawing.Color]::FromArgb(255, 10, 18, 44),
    45)
  $g.FillRectangle($bgBrush, $full)

  # Gold gradient brush for the "B" lettermark
  $goldBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $full,
    [System.Drawing.Color]::FromArgb(255, 240, 192, 64),
    [System.Drawing.Color]::FromArgb(255, 196, 154, 26),
    45)

  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment     = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

  # "B" — bold monospace, centered, nudged slightly up to leave room for the label
  $bFont = New-Object System.Drawing.Font("Consolas", [single](240 * $s), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $bBox  = New-Object System.Drawing.RectangleF(0, [single](-34 * $s), [single]$size, [single]$size)
  $g.DrawString("B", $bFont, $goldBrush, $bBox, $sf)

  # Gold accent bar under the B (x=176,w=160,y=350,h=12 @ 512)
  $barBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(153, 231, 183, 51))
  $g.FillRectangle($barBrush, [single](176 * $s), [single](352 * $s), [single](160 * $s), [single](12 * $s))

  # Wordmark "BDMFLOW" (spaced to fake letter-tracking), centered ~y=420
  $lblFont = New-Object System.Drawing.Font("Arial", [single](30 * $s), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $lblBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(128, 231, 183, 51))
  $lblBox = New-Object System.Drawing.RectangleF(0, [single](400 * $s), [single]$size, [single](44 * $s))
  $g.DrawString("B D M F L O W", $lblFont, $lblBrush, $lblBox, $sf)

  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host ("  wrote {0} ({1}x{1})" -f $path, $size)
}

New-Icon 192 (Join-Path $outDir 'icon-192.png')
New-Icon 512 (Join-Path $outDir 'icon-512.png')
Write-Host "Done."
