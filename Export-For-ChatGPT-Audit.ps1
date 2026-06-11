# Export-For-ChatGPT-Audit.ps1

$Source = "C:\Juneteenthtube-Master"
$Working = "C:\Juneteenthtube-Audit"
$ZipFile = "C:\Juneteenthtube-Audit-Package.zip"

Write-Host ""
Write-Host "========================================="
Write-Host " JUNETEENTHTUBE AUDIT EXPORT"
Write-Host "========================================="
Write-Host ""

if (Test-Path $Working) {
Remove-Item $Working -Recurse -Force
}

if (Test-Path $ZipFile) {
Remove-Item $ZipFile -Force
}

New-Item -ItemType Directory -Path $Working | Out-Null

$ImportantFolders = @(
"src",
"supabase",
"scripts",
"public"
)

foreach ($Folder in $ImportantFolders) {

```
$SourceFolder = Join-Path $Source $Folder

if (Test-Path $SourceFolder) {

    Write-Host "Copying $Folder"

    Copy-Item `
        -Path $SourceFolder `
        -Destination $Working `
        -Recurse `
        -Force
}
```

}

$ImportantFiles = @(
"package.json",
"package-lock.json",
"pnpm-lock.yaml",
"yarn.lock",
"next.config.js",
"next.config.ts",
"next.config.mjs",
"middleware.ts",
"middleware.js",
"tsconfig.json",
".env.example",
".env.local.example",
"README.md"
)

foreach ($File in $ImportantFiles) {

```
$SourceFile = Join-Path $Source $File

if (Test-Path $SourceFile) {

    Write-Host "Copying $File"

    Copy-Item `
        -Path $SourceFile `
        -Destination $Working `
        -Force
}
```

}

Write-Host ""
Write-Host "Removing unnecessary content..."
Write-Host ""

Get-ChildItem $Working -Directory -Recurse |
Where-Object {
$_.Name -in @(
".next",
"node_modules",
".git",
".turbo",
"coverage",
"dist",
"build",
".vercel",
".cache"
)
} |
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Creating ZIP..."
Write-Host ""

Compress-Archive `    -Path "$Working\*"`
-DestinationPath $ZipFile `
-CompressionLevel Optimal

Write-Host ""
Write-Host "========================================="
Write-Host " EXPORT COMPLETE"
Write-Host "========================================="
Write-Host ""
Write-Host "ZIP FILE:"
Write-Host $ZipFile
Write-Host ""
Write-Host "Upload this ZIP into ChatGPT."
Write-Host ""
