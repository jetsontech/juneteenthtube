---
description: Dual export workflow for SDR (web) and HDR (Dolby Vision TVs)
---

# DaVinci Resolve - Dual SDR/HDR Export Workflow

## Recommended Setup (Best of Both Worlds)

### Timeline Settings (in Project Settings → Color Management)

- **Color Science**: DaVinci YRGB Color Managed
- **Timeline Color Space**: Rec.709 Gamma 2.4
- **Output Color Space**: Bypass (we set per-export)

This lets you edit in SDR and export to BOTH SDR and HDR.

---

## Console Script - Reset to Dual-Output Workflow

```python
resolve = bmd.scriptapp("Resolve")
project = resolve.GetProjectManager().GetCurrentProject()
if project:
    project.SetSetting("colorScienceMode", "davinciYRGBColorManagedv2")
    project.SetSetting("colorSpaceTimeline", "Rec.709 Gamma 2.4")
    project.SetSetting("audioBitDepth", "24")
    project.SetSetting("audioSampleRate", "48000")
    project.SetSetting("loudnessTarget", "-14")
    print("✅ Dual-output workflow ready!")
```

---

## Export Presets to Create

### Preset 1: "JuneteenthTube SDR" (Web/Mobile)

| Setting | Value |
|---------|-------|
| Format | MP4 |
| Codec | H.264 or H.265 |
| Resolution | 1920x1080 or 4K |
| Color Space | Rec.709 |
| Audio | AAC 320kbps |

### Preset 2: "JuneteenthTube HDR" (TVs/Monitors)

| Setting | Value |
|---------|-------|
| Format | MP4 or QuickTime |
| Codec | H.265 |
| Resolution | 4K |
| HDR | Dolby Vision |
| Color Space | Rec.2100 ST.2084 |
| Audio | AAC 320kbps |

---

## When to Use Each

| Audience | Use Preset |
|----------|------------|
| Web, phones, most viewers | **SDR** |
| HDR TVs, Apple TV, high-end monitors | **HDR** |
| Both (make 2 files) | Export **both** |
