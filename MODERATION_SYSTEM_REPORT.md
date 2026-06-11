# Moderation System Report

This document outlines the final implementation of the JuneteenthTube Moderation Platform, detailing the community reporting workflows, moderator queue mechanics, and audit trail security.

## 1. Reporting Infrastructure

The reporting schema is backed by the `moderation_reports` table, which accepts authenticated community flags.

**Supported Report Categories:**

- Spam
- Copyright
- Harassment
- Hate Speech
- Misinformation
- Graphic Content
- Other

**Security Shielding:**
The reporting endpoint (`moderation_reports`) enforces an RLS `insert` policy. External actors can insert reports, but only verified administrators (`role = 'admin'` or `service_role`) can view or interact with the queued reports, preventing report-mining or retaliatory scraping.

## 2. Moderator Queue Workflows

The moderator queue operates via a strict state machine on the `status` and `action` enums.

**Queue States:**

- `pending`: Awaiting triage.
- `reviewed`: Investigated by a moderator.
- `escalated`: Passed to senior moderation/legal.
- `dismissed`: Flagged as false positive.

**Available Moderator Actions:**

1. **Review:** Investigates the content natively in the dashboard.
2. **Approve (Dismiss Report):** Rejects the community flag, marking the report as `dismissed`.
3. **Reject/Remove:** Enacts the `remove_content` action, setting the target video `visibility = 'removed'`.
4. **Warn:** Enacts `warn_creator`, flagging the user profile.
5. **Suspend:** Enacts `suspend_creator`, altering the `profiles.status` flag to temporarily disable uploads/playback.
6. **Ban:** Enacts `ban_creator`, stripping the user of all access rights and scrubbing content from public feeds.
7. **Escalate:** Routes to legal/trust-and-safety specialists via `escalate_review`.

## 3. Audit Log (Trust & Safety Traceability)

Every action taken by a moderator is durably written to the `moderation_actions` table. This serves as an immutable ledger for accountability.

**Audit Trait Structure:**

- **Moderator (`admin_id`):** UUID of the staff member who executed the action.
- **Timestamp (`created_at`):** Exact UTC timestamp of execution.
- **Action (`action`):** The enumerated action taken (e.g., `remove_content`).
- **Reason (`reason`):** The internal justification provided by the moderator.
- **Target (`target_video_id` & `target_creator_id`):** The specific video and creator penalized.

**Audit Security:**
The `moderation_actions` table strictly enforces RLS policies. No external actor can spoof audit logs, and even standard moderators cannot delete or alter historical actions, ensuring a pure, tamper-proof paper trail.
