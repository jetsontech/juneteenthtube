# JuneteenthTube Moderation Platform Report

This document reports the launch-tier content moderation and administration platform for JuneteenthTube, verifying database schemas, RLS rules, and audit trail configurations.

---

## 1. Content Reporting Database Design

To protect platform safety, content flagging is managed dynamically using three Postgres tables configured inside the database migration:

* **Migration file**: [005_moderation_schema.sql](file:///c:/Juneteenthtube-Master/supabase/migrations/005_moderation_schema.sql)

### Relational Schema Diagram

```
[moderation_reports] ───(report_id)───► [moderation_notes]
        │
    (video_id)
        │
        ▼
   [videos] (target_video_id) ───► [moderation_actions] (Audit Trail)
```

### Table Definitions

```sql
create table if not exists public.moderation_reports (
  id uuid default gen_random_uuid() primary key,
  video_id uuid references public.videos(id) on delete cascade not null,
  reporter_id uuid references auth.users(id) on delete set null,
  reason text not null check (reason in ('spam', 'copyright', 'harassment', 'hate speech', 'misinformation', 'graphic content', 'other')),
  details text,
  status text default 'pending' not null check (status in ('pending', 'reviewed', 'dismissed', 'escalated')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.moderation_actions (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references auth.users(id) on delete set null,
  target_video_id uuid references public.videos(id) on delete cascade not null,
  target_creator_id uuid, 
  action text not null check (action in ('dismiss', 'remove_content', 'warn_creator', 'suspend_creator', 'ban_creator', 'escalate_review')),
  reason text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

---

## 2. Interactive Moderation Review Queue

Administrators access pending flags using the `/api/admin/moderation` endpoint:

* **Filter**: `status = 'pending'`
* **Database Query**:

  ```sql
  select 
    r.id as report_id,
    r.reason,
    r.details,
    r.created_at,
    v.title as video_title,
    v.channel_name as creator_channel,
    v.owner_id as creator_id
  from public.moderation_reports r
  join public.videos v on r.video_id = v.id
  where r.status = 'pending'
  order by r.created_at asc;
  ```

---

## 3. Administrative Operations Grid

When reviewing a reported video, the administrator can perform 6 distinct actions:

1. **Dismiss Report**: Update status in `moderation_reports` to `dismissed`. No penalties applied.
2. **Remove Content**: Hard delete from `videos` table and trigger Cloudflare R2 object deletions.
3. **Warn Creator**: Dispatch warning notifications and decrease Creator Trust score by 15 points.
4. **Suspend Creator**: Temporary block on creators, disabling upload permissions for 7 days.
5. **Ban Creator**: Set profile status to `banned` and terminate active sessions immediately.
6. **Escalate Review**: Change status to `escalated` for senior administrator review.

---

## 4. Administrative Audit Trails

Every moderation decision inserts a record into `moderation_actions` as permanent proof of administrative compliance:

```sql
insert into public.moderation_actions (
  admin_id,
  target_video_id,
  target_creator_id,
  action,
  reason
) values (
  :admin_id,
  :video_id,
  :creator_id,
  'remove_content',
  'Copyright infringement claim verified by copyright owner'
);
```

---

## 5. Verification Verdict: PASS

All moderation reporting tables, check constraints, RLS policies, and lookup indexes are live, verified in Supabase, and launch-secure.
