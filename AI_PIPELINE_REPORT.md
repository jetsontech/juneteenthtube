# JuneteenthTube AI Metadata Pipeline Report

This document reports the launch-tier automated AI metadata pipeline for JuneteenthTube, designed to parse uploaded video streams, generate captions using Whisper models, extract topics, and generate searchable metadata tags.

---

## 1. AI Metadata Ingestion Workflow

To minimize manual ingestion labor and maximize search indexability, uploads flow through an automated serverless AI pipeline:

```
[Creator Uploads Video]
           ↓
  [Cloudflare R2 Bucket]
           ↓
[Trigger Serverless Worker]
           ↓
[Extract Audio (FFmpeg)] → [Whisper Speech-to-Text] → [Subtitles (.vtt)]
           ↓
[Gemini LLM Processing] → [Auto Tags / Topic Extraction / Summarization]
           ↓
  [Supabase Database] (Update video description, tags, transcript, index)
```

---

## 2. Ingestion Processing Layers

### A. Speech-to-Text & Subtitles (Whisper API / Local GPU)

* **Model**: OpenAI Whisper (Medium/Large v3) or equivalent serverless endpoint.
* **Inputs**: Extracted `.wav` mono audio track.
* **Outputs**: `.vtt` and `.srt` caption files, stored in Cloudflare R2 under `/captions/`.
* **Accuracy Target**: `>97.5%` word accuracy for cultural names and terminologies.

### B. Dynamic Topic Mining & AI Summaries (Gemini API)

* **Engine**: Google Gemini 1.5 Pro.
* **Task**: Analyze raw text transcripts to:
  * Generate a detailed 3-sentence summary for SEO description fields.
  * Mining specific historic and cultural keywords (e.g., "Civil Rights", "Atlanta Heritage").
  * Auto-generate exactly 8 metadata tags mapped to Postgres indexing categories.

---

## 3. Operational Telemetry & Monitoring

Ingestion performance is tracked directly in our `/api/telemetry` pipeline:

* **AI Processing Latency**: Average time required to transcribe and summarize (target: `<1.5x` video duration).
* **Transcode Success Rate**: Percentage of files successfully split and captioned without timeouts.
* **Gemini Parsing Error Rate**: Monitored to detect token limits or structural format mismatches.
