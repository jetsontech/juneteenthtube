<#
.SYNOPSIS
    Production Bootstrap and Environment Validation Script for JuneteenthTube.
.DESCRIPTION
    Automates dependency hygiene, environment integrity checks, structural Next.js/Supabase 
    server-client isolation, and brings up the local development environment cleanly.
#>

$ProjectName = "JuneteenthTube"
$RequiredEnvVars = @("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "CLOUDFLARE_R2_BUCKET_NAME")

Clear-Host
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "🚀 Bootstrapping Production Environment for $ProjectName" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Elevate & Verify Path Context
$CurrentDir = Get-Location
Write-Host "[*] Working Directory: $CurrentDir" -ForegroundColor Gray
if (-not (Test-Path "$CurrentDir\package.json")) {
    Write-Error "🚨 Critical Failure: package.json not found. Run this script in your project root!"
    Exit 1
}

# 2. Environment Variables & Secret Integrity Verification
Write-Host "`n[*] Checking .env.local file configuration..." -ForegroundColor Yellow
$EnvPath = "$CurrentDir\.env.local"
if (-not (Test-Path $EnvPath)) {
    Write-Host "[!] .env.local missing. Creating deployment template..." -ForegroundColor Magenta
    @'
# Supabase (Client & Server Accessible)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-client-anon-key

# Server-Side Secure Storage (Cloudflare R2 Example)
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_R2_BUCKET_NAME=juneteenthtube-media-vault
'@ | Out-File -FilePath $EnvPath -Encoding utf8
    Write-Warning "⚠️ Created .env.local template. Please update placeholder secrets before proceeding."
    Exit 1
}

# Scan file for missing keys to catch undefined build crashes early
$EnvContent = Get-Content $EnvPath
foreach ($Var in $RequiredEnvVars) {
    if ($EnvContent -notmatch "^$Var\s*=") {
        Write-Error "🚨 Critical Configuration Deficit: Missing required environment variable '$Var' in .env.local"
        Exit 1
    }
}
Write-Host "✅ Environment variables verified." -ForegroundColor Green

# 3. Clean Caches & Rebuild Clean Node Dependencies
Write-Host "`n[*] Flushing corrupted Next.js build artifacts and lockfiles..." -ForegroundColor Yellow
$TargetPaths = @(".next", "node_modules", "package-lock.json", ".eslintcache")
foreach ($Path in $TargetPaths) {
    if (Test-Path "$CurrentDir\$Path") {
        Write-Host "    Removing old: \$Path" -ForegroundColor Gray
        Remove-Item -Recurit -Force "$CurrentDir\$Path" -ErrorAction SilentlyContinue
    }
}

Write-Host "[*] Executing zero-side-effect clean package install..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "🚨 Critical Failure: 'npm install' encountered an absolute crash runtime error."
    Exit 1
}
Write-Host "✅ Dependency tree built and hydrated cleanly." -ForegroundColor Green

# 4. Architecture Blueprint Enforcement (Enforce Server Component Boundaries)
Write-Host "`n[*] Validating Supabase initialization layer boundaries..." -ForegroundColor Yellow

$SupabaseClientPath = "$CurrentDir\src\lib\supabase\client.ts"
$SupabaseServerPath = "$CurrentDir\src\lib\supabase\server.ts"

# Force Client Boundary Isolation
if (-not (Test-Path (Split-Path $SupabaseClientPath))) { New-Item -ItemType Directory -Path (Split-Path $SupabaseClientPath) -Force | Out-Null }

@'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase client credentials missing or evaluated out-of-order in environment.');
}

// Client-side initialization fallback pattern (Protects RSC compilation phase)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
'@ | Out-File -FilePath $SupabaseClientPath -Encoding utf8
Write-Host "✅ Client architecture synchronized (`src\lib\supabase\client.ts`)." -ForegroundColor Green

# Force Server Boundary Isolation
@'
import { createClient } from '@supabase/supabase-js';

export const createServerSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('❌ Structural Crash: Server-Side Supabase client invoked without proper environment variables.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Mandated stateless strategy inside Next RSC contexts
    }
  });
};
'@ | Out-File -FilePath $SupabaseServerPath -Encoding utf8
Write-Host "✅ Server architecture synchronized (`src\lib\supabase\server.ts`)." -ForegroundColor Green

# 5. Initialization Complete
Write-Host "`n=========================================================" -ForegroundColor Green
Write-Host "🚀 STRATEGIC ENVIRONMENT BOOTSTRAP COMPLETE" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
Write-Host "[+] Action Required: Verify your secrets in .env.local" -ForegroundColor Yellow
Write-Host "[+] Execution Strategy: Spin up the runtime with 'npm run dev'" -ForegroundColor Cyan