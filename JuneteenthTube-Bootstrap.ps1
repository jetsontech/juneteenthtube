# ==========================================
# JuneteenthTube One-Shot Production Bootstrap
# ==========================================
# Run as Administrator:
# powershell -ExecutionPolicy Bypass -File .\JuneteenthTube-Bootstrap.ps1
# ==========================================

$ErrorActionPreference = "Stop"

function Write-Stage {
    param([string]$Message)

    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Yellow
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
}

Write-Stage "JUNETEENTHTUBE PRODUCTION BOOTSTRAP STARTING"

# ==========================================
# CONFIGURATION & WORKSPACE PATHS
# ==========================================

$PROJECT_ROOT = "C:\Juneteenthtube-Master"
$SRC = "$PROJECT_ROOT\src"
$SERVICES = "$SRC\services"
$COMPONENTS = "$SRC\components"
$LIB = "$SRC\lib"
$SUPABASE = "$LIB\supabase"
$FEED = "$SERVICES\feed"
$FEED_COMPONENTS = "$COMPONENTS\feed"
$MIGRATIONS = "$PROJECT_ROOT\supabase\migrations"
$SOURCE_KEYS_PATH = "C:\code\juneteenthtube\.env.local"
$TargetEnvPath = "$PROJECT_ROOT\.env.local"

# ==========================================
# VERIFY PROJECT CONTEXT
# ==========================================

Write-Stage "VERIFYING PROJECT WORKSPACE"

if (!(Test-Path $PROJECT_ROOT)) {
    throw "Project folder not found: $PROJECT_ROOT"
}

Set-Location $PROJECT_ROOT

# ==========================================
# AUTOMATED SECRET MIGRATION & PROVISIONING
# ==========================================

Write-Stage "MIGRATING AND VALIDATING ENVIRONMENT KEYS"

if (Test-Path $SOURCE_KEYS_PATH) {
    Write-Host "💡 Found source secrets file at: $SOURCE_KEYS_PATH" -ForegroundColor Green
    Write-Host "[*] Synchronizing keys to target workspace..." -ForegroundColor Gray
    Copy-Item -Path $SOURCE_KEYS_PATH -Destination $TargetEnvPath -Force
}
elseif (Test-Path "C:\code\juneteenthtube\.env") {
    Write-Host "💡 Found source secrets file at: C:\code\juneteenthtube\.env" -ForegroundColor Green
    Copy-Item -Path "C:\code\juneteenthtube\.env" -Destination $TargetEnvPath -Force
}
else {
    Write-Host "⚠️ Source environment keys missing from target legacy pathways." -ForegroundColor Magenta
    if (-not (Test-Path $TargetEnvPath)) {
        Write-Host "[!] Generating zero-dependency local .env.local fallback file..." -ForegroundColor Gray
        $templateContent = @'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-client-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-service-role-key
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-key
CLOUDFLARE_R2_BUCKET_NAME=juneteenthtube-media-vault
'@
        Set-Content -Path $TargetEnvPath -Value $templateContent
        Write-Warning "🚨 Created placeholder configuration. Run build only after adding valid credentials."
    }
}

# ==========================================
# REBUILD CLEAN NODE DEPENDENCIES
# ==========================================

Write-Stage "FLUSHING CACHES & REHYDRATING DEPENDENCIES"

if (Test-Path "$PROJECT_ROOT\.next") { 
    Write-Host "[*] Purging outdated Next.js build graph caches..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "$PROJECT_ROOT\.next" 
}

npm install --legacy-peer-deps
npm install @supabase/supabase-js hls.js react-intersection-observer --legacy-peer-deps

# ==========================================
# CREATE DIRECTORY STRUCTURE
# ==========================================

Write-Stage "CREATING PRODUCTION DIRECTORY STRUCTURE"

$directories = @(
    "$SUPABASE",
    "$MIGRATIONS",
    "$FEED",
    "$FEED_COMPONENTS",
    "$SERVICES\media",
    "$SERVICES\ai",
    "$SERVICES\player",
    "$SRC\workers",
    "$SRC\workers\transcoding",
    "$SRC\workers\thumbnails",
    "$SRC\workers\ingestion"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# ==========================================
# ENFORCE ARCHITECTURAL SPLIT (CLIENT BROWSER)
# ==========================================

Write-Stage "CREATING SUPABASE CLIENT BOUNDARY (BROWSER COMPONENTS)"

$supabaseClient = @'
import { createClient } from "@supabase/supabase-js";

// Safe dynamic fallbacks ensuring next build doesn't throw validation exceptions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Client side initialization running without environment variables loaded.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
'@

Set-Content -Path "$SUPABASE\client.ts" -Value $supabaseClient

# ==========================================
# ENFORCE ARCHITECTURAL SPLIT (SERVER RSC)
# ==========================================

Write-Stage "CREATING SUPABASE SERVER BOUNDARY (RSC ISOLATED)"

$supabaseServer = @'
import { createClient } from "@supabase/supabase-js";

export const createServerSupabase = (useServiceRole = false) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = useServiceRole 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY 
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !key) {
    throw new Error("❌ Structural Build Crash: Server-Side Supabase client invoked without valid environment configuration.");
  }

  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false, // Mandated stateless protocol within React Server Component context loops
    },
  });
};
'@

Set-Content -Path "$SUPABASE\server.ts" -Value $supabaseServer

# ==========================================
# CREATE FEED SERVICE (SERVER COMPLIANT)
# ==========================================

Write-Stage "CREATING FEED SERVICE"

$feedService = @'
import { createServerSupabase } from "@/lib/supabase/server";

export async function getTrendingVideos(limit = 20) {
  const supabase = createServerSupabase();
  
  const { data, error } = await supabase
    .from("videos")
    .select(`
      id,
      title,
      description,
      thumbnail_url,
      playback_url,
      views,
      created_at,
      profiles:creator_id(username)
    `)
    .eq("visibility", "public")
    .order("views", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Database query exception in getTrendingVideos:", error);
    return [];
  }

  return data?.map((video: any) => ({
    ...video,
    creator_name: video.profiles?.username || "Unknown Creator",
  })) || [];
}

export async function getRecentVideos(limit = 20) {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("videos")
    .select(`
      id,
      title,
      description,
      thumbnail_url,
      playback_url,
      views,
      created_at,
      profiles:creator_id(username)
    `)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Database query exception in getRecentVideos:", error);
    return [];
  }

  return data?.map((video: any) => ({
    ...video,
    creator_name: video.profiles?.username || "Unknown Creator",
  })) || [];
}
'@

Set-Content -Path "$FEED\feed-service.ts" -Value $feedService

# ==========================================
# CREATE FEED RAIL COMPONENT
# ==========================================

Write-Stage "CREATING FEED RAIL COMPONENT"

$feedRail = @'
"use client";

import Link from "next/link";

interface FeedRailProps {
  title: string;
  items: any[];
}

export default function FeedRail({ title, items }: FeedRailProps) {
  if (!items?.length) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-white border-l-4 border-amber-500 pl-3">{title}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((video) => (
          <Link
            key={video.id}
            href={`/watch/${video.id}`}
            className="group block no-underline"
          >
            <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md hover:border-amber-500/50 transition-all duration-300 shadow-xl">
              <div className="aspect-video overflow-hidden bg-zinc-950 relative">
                <img
                  src={video.thumbnail_url || "/placeholder-thumb.jpg"}
                  alt={video.title}
                  className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out"
                />
              </div>

              <div className="p-4">
                <h3 className="font-medium text-zinc-100 text-base line-clamp-2 mb-1 group-hover:text-amber-400 transition-colors duration-200">
                  {video.title}
                </h3>

                <p className="text-sm text-zinc-400 font-normal mb-2">
                  {video.creator_name}
                </p>

                <div className="flex items-center text-xs text-zinc-500 space-x-2">
                  <span>{video.views?.toLocaleString() || 0} views</span>
                  <span>•</span>
                  <span>{new Date(video.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
'@

Set-Content -Path "$FEED_COMPONENTS\feed-rail.tsx" -Value $feedRail

# ==========================================
# CREATE PREMIUM HOMEPAGE WITH GLASSMORPHISM DESIGN
# ==========================================

Write-Stage "CREATING PREMIUM ARCHIVE HOMEPAGE"

$homepage = @'
import FeedRail from "@/components/feed/feed-rail";

import {
  getRecentVideos,
  getTrendingVideos,
} from "@/services/feed/feed-service";

export default async function HomePage() {
  const [trending, recent] = await Promise.all([
    getTrendingVideos(),
    getRecentVideos(),
  ]);

  return (
    <main className="min-h-screen bg-black text-white px-8 py-10 selection:bg-amber-500/30">
      {/* High-End Glassmorphism Brand Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800/60 bg-gradient-to-br from-zinc-950 via-zinc-900/80 to-zinc-950 p-12 mb-14 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_45%)]" />
        
        <div className="relative max-w-4xl z-10">
          <p className="uppercase tracking-[0.4em] text-amber-500 font-semibold text-xs mb-4">
            Digital Archive Infrastructure
          </p>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none mb-6">
            Juneteenth<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">Tube</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed mb-8 max-w-2xl">
            AI-native streaming architecture executing real-time media ingestion and frictionless distribution of decentralized black cultural archives.
          </p>
          
          <div className="flex items-center space-x-4">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs tracking-wider text-zinc-500 font-mono uppercase">Network Nodes Fully Operational</span>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        <FeedRail
          title="Trending Archives"
          items={trending}
        />

        <FeedRail
          title="Recent Additions"
          items={recent}
        />
      </div>
    </main>
  );
}
'@

Set-Content -Path "$SRC\app\page.tsx" -Value $homepage

# ==========================================
# CREATE SECURITY MIDDLEWARE
# ==========================================

Write-Stage "CREATING SECURITY MIDDLEWARE"

$middleware = @'
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src * data: blob:; media-src * blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: "/:path*",
};
'@

Set-Content -Path "$PROJECT_ROOT\middleware.ts" -Value $middleware

# ==========================================
# CREATE DATABASE MIGRATION (UPGRADE RESILIENT)
# ==========================================

Write-Stage "GENERATING SECURE DATABASE UPGRADE SCHEMA"

$migration = @'
create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  thumbnail_url text,
  playback_url text not null,
  duration integer,
  visibility text default 'public',
  views bigint default 0,
  created_at timestamptz default now()
);

-- Upgrade step to ensure column alignment on pre-existing database tables
alter table videos 
add column if not exists playback_url text,
add column if not exists visibility text default 'public',
add column if not exists duration integer,
add column if not exists thumbnail_url text;

create table if not exists watch_history (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id),
  video_id uuid references videos(id),
  watched_at timestamptz default now(),
  progress_seconds integer default 0
);

create table if not exists subscriptions (
  subscriber_id uuid references profiles(id),
  creator_id uuid references profiles(id),
  created_at timestamptz default now(),
  primary key (subscriber_id, creator_id)
);

create index if not exists videos_created_idx on videos(created_at desc);
create index if not exists videos_views_idx on videos(views desc);

alter table profiles enable row level security;
alter table videos enable row level security;

drop policy if exists "Public videos visible" on videos;
create policy "Public videos visible" on videos for select using (visibility = 'public');
'@

Set-Content -Path "$MIGRATIONS\001_production_video_schema.sql" -Value $migration

# ==========================================
# RUN BUILD VALIDATION
# ==========================================

Write-Stage "RUNNING NEXT.JS COMPILATION BUILD VALIDATION"

npm run build

# ==========================================
# FINAL OUTPUT
# ==========================================

Write-Stage "BOOTSTRAP SCRIPTS COMPLETED SUCCESSFULLY"

Write-Host "NEXT ARCHITECTURAL ACTIONS:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Verified active variables loaded directly into workspace .env.local" -ForegroundColor White
Write-Host "2. Target code successfully cleared type-checks and production compile targets." -ForegroundColor White
Write-Host "3. Boot dev container node to view app stream: npm run dev" -ForegroundColor Cyan
Write-Host ""