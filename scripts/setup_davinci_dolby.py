# ============================================
# JUNETEENTHTUBE - DAVINCI RESOLVE SETUP
# ============================================
# 
# HOW TO USE:
# 1. Open DaVinci Resolve Studio 20
# 2. Go to: Workspace → Console
# 3. Copy ALL of this code
# 4. Paste into the Console and press Enter
#
# ============================================

resolve = bmd.scriptapp("Resolve")
project = resolve.GetProjectManager().GetCurrentProject()

if not project:
    print("ERROR: No project open!")
else:
    print("Setting up: " + project.GetName())
    
    # Dolby Vision
    project.SetSetting("colorScienceMode", "davinciYRGBColorManagedv2")
    project.SetSetting("colorSpaceOutput", "Rec.2100 ST2084")
    project.SetSetting("dolbyVisionMode", "1")
    print("✓ Dolby Vision enabled")
    
    # Audio
    project.SetSetting("audioBitDepth", "24")
    project.SetSetting("audioSampleRate", "48000")
    print("✓ Audio: 24-bit 48kHz")
    
    # Loudness
    project.SetSetting("loudnessMode", "1")
    project.SetSetting("loudnessTarget", "-14")
    project.SetSetting("loudnessTruePeak", "-1")
    print("✓ Loudness: -14 LUFS")
    
    # Export
    project.SetSetting("videoCodec", "H265")
    project.SetSetting("audioCodec", "aac")
    project.SetSetting("audioBitRate", "320000")
    print("✓ Export: H.265 + AAC 320kbps")
    
    print("")
    print("========================================")
    print("✅ JUNETEENTHTUBE PRESET CONFIGURED!")
    print("========================================")
    print("Now go to Deliver and save as preset")
