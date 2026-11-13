Add-Type -AssemblyName System.Drawing

$srcPath = "E:\MakeUpStore_App-main\MakeUpStore_App\app\Assets\Logo_transparent.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source file not found: $srcPath"
    exit 1
}

$logo = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Source Logo: $($logo.Width)x$($logo.Height)"

# -------------------------------------------------------------------------
# Helper function: Draw centered image onto canvas with HighQuality
# -------------------------------------------------------------------------
function Create-Canvas-With-Centered-Logo {
    param(
        [int]$canvasW,
        [int]$canvasH,
        [System.Drawing.Color]$bgColor,
        [double]$logoScaleFactor,
        [bool]$isRound = $false
    )

    $destBmp = New-Object System.Drawing.Bitmap($canvasW, $canvasH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($bgColor -ne [System.Drawing.Color]::Transparent) {
        if ($isRound) {
            $g.Clear([System.Drawing.Color]::Transparent)
            $brush = New-Object System.Drawing.SolidBrush($bgColor)
            $g.FillEllipse($brush, 0, 0, $canvasW, $canvasH)
            $brush.Dispose()
        } else {
            $g.Clear($bgColor)
        }
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    # Calculate logo dimensions maintaining aspect ratio
    # Safe zone: fit within canvasW * scaleFactor, canvasH * scaleFactor
    $maxW = $canvasW * $logoScaleFactor
    $maxH = $canvasH * $logoScaleFactor

    $scale = [Math]::Min($maxW / $logo.Width, $maxH / $logo.Height)
    $drawW = [int]($logo.Width * $scale)
    $drawH = [int]($logo.Height * $scale)
    $drawX = [int](($canvasW - $drawW) / 2)
    $drawY = [int](($canvasH - $drawH) / 2)

    $g.DrawImage($logo, $drawX, $drawY, $drawW, $drawH)
    $g.Dispose()

    return $destBmp
}

$bgLuxury = [System.Drawing.ColorTranslator]::FromHtml("#FFF8FA")

# 1. Generate 1024x1024 Master App Icon (Assets/Logo.png)
$icon1024 = Create-Canvas-With-Centered-Logo 1024 1024 $bgLuxury 0.72 $false
$icon1024.Save("E:\MakeUpStore_App-main\MakeUpStore_App\app\Assets\Logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon1024.Dispose()
Write-Host "Created app/Assets/Logo.png (1024x1024)"

# 2. Generate 1024x1024 Adaptive Icon Foreground (Assets/adaptive-icon.png)
$adaptiveIcon = Create-Canvas-With-Centered-Logo 1024 1024 ([System.Drawing.Color]::Transparent) 0.65 $false
$adaptiveIcon.Save("E:\MakeUpStore_App-main\MakeUpStore_App\app\Assets\adaptive-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$adaptiveIcon.Dispose()
Write-Host "Created app/Assets/adaptive-icon.png (1024x1024, Transparent Foreground)"

# 3. Generate Android Native Splash Screen Logo (drawable/splashscreen_logo.png)
# Optimal 512x171 or 600x200
$splashLogo = Create-Canvas-With-Centered-Logo 600 200 ([System.Drawing.Color]::Transparent) 0.95 $false
$splashLogo.Save("E:\MakeUpStore_App-main\MakeUpStore_App\app\android\app\src\main\res\drawable\splashscreen_logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$splashLogo.Dispose()
Write-Host "Created drawable/splashscreen_logo.png (600x200, Crisp Native Splash)"

# 4. Generate Android Native drawable-mdpi/assets_logo.png
$assetsLogo = Create-Canvas-With-Centered-Logo 512 512 $bgLuxury 0.72 $false
$assetsLogo.Save("E:\MakeUpStore_App-main\MakeUpStore_App\app\android\app\src\main\res\drawable-mdpi\assets_logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$assetsLogo.Dispose()
Write-Host "Created drawable-mdpi/assets_logo.png (512x512)"

# 5. Generate Android Native Mipmap Launchers (ic_launcher.png and ic_launcher_round.png)
$mipmapSizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($entry in $mipmapSizes.GetEnumerator()) {
    $folder = $entry.Key
    $size = $entry.Value
    $dirPath = "E:\MakeUpStore_App-main\MakeUpStore_App\app\android\app\src\main\res\$folder"

    if (-not (Test-Path $dirPath)) {
        New-Item -ItemType Directory -Path $dirPath -Force | Out-Null
    }

    # Standard Square/Squircle Launcher Icon
    $ic = Create-Canvas-With-Centered-Logo $size $size $bgLuxury 0.72 $false
    $ic.Save("$dirPath\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $ic.Dispose()

    # Round Launcher Icon
    $icRound = Create-Canvas-With-Centered-Logo $size $size $bgLuxury 0.65 $true
    $icRound.Save("$dirPath\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $icRound.Dispose()

    Write-Host "Created $folder/ic_launcher.png and ic_launcher_round.png ($size x $size)"
}

$logo.Dispose()
Write-Host "ALL APP ICONS AND SPLASH SCREEN ASSETS GENERATED SUCCESSFULLY!"

