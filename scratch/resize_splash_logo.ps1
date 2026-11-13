Add-Type -AssemblyName System.Drawing

$srcPath = "E:\MakeUpStore_App-main\MakeUpStore_App\app\Assets\Logo_transparent.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found at $srcPath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Resize-And-Save($targetW, $targetH, $destPath) {
    $destDir = [System.IO.Path]::GetDirectoryName($destPath)
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $g.DrawImage($srcImg, 0, 0, $targetW, $targetH)
    $g.Dispose()

    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated $destPath ($targetW x $targetH)"
}

$baseRes = "E:\MakeUpStore_App-main\MakeUpStore_App\app\android\app\src\main\res"

# Standard Android density splash sizes (base 195 x 65 dp)
Resize-And-Save 195 65  "$baseRes\drawable-mdpi\splashscreen_logo.png"
Resize-And-Save 293 98  "$baseRes\drawable-hdpi\splashscreen_logo.png"
Resize-And-Save 390 130 "$baseRes\drawable-xhdpi\splashscreen_logo.png"
Resize-And-Save 585 195 "$baseRes\drawable-xxhdpi\splashscreen_logo.png"
Resize-And-Save 780 260 "$baseRes\drawable-xxxhdpi\splashscreen_logo.png"
# Default fallback in drawable/
Resize-And-Save 390 130 "$baseRes\drawable\splashscreen_logo.png"

$srcImg.Dispose()
Write-Host "Splash screen logo generation completed successfully!"

