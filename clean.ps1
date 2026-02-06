Write-Host "Cleaning Next.js cache..."
Remove-Item -Path .next -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path .turbo -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path node_modules/.cache -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Cache cleaned. You can now restart the dev server."
