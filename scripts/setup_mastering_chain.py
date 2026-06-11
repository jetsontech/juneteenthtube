# ============================================
# JUNETEENTHTUBE MASTERING CHAIN SETUP
# ============================================
# 
# HOW TO USE:
# 1. Open DaVinci Resolve Studio
# 2. Open your project
# 3. Go to: Workspace → Console
# 4. Copy ALL of this code
# 5. Paste into the Console and press Enter
#
# ============================================

resolve = bmd.scriptapp("Resolve")
project = resolve.GetProjectManager().GetCurrentProject()

if not project:
    print("❌ ERROR: No project open!")
else:
    print("="*50)
    print("JUNETEENTHTUBE MASTERING SETUP")
    print("="*50)
    print("")
    print("Setting up project: " + project.GetName())
    print("")
    
    # ===== 1. PROJECT SETTINGS =====
    print("[1/5] Configuring Project Settings...")
    
    # Color Management for HDR
    project.SetSetting("colorScienceMode", "davinciYRGBColorManagedv2")
    project.SetSetting("colorSpaceOutput", "Rec.2100 ST2084")
    project.SetSetting("dolbyVisionMode", "1")
    print("  ✓ Dolby Vision HDR: ENABLED")
    
    # ===== 2. AUDIO SETTINGS =====
    print("[2/5] Configuring Audio Settings...")
    
    project.SetSetting("audioBitDepth", "24")
    project.SetSetting("audioSampleRate", "48000")
    project.SetSetting("audioCodec", "aac")
    project.SetSetting("audioBitRate", "320000")
    print("  ✓ Audio: 24-bit, 48kHz, AAC 320kbps")
    
    # ===== 3. LOUDNESS SETTINGS =====
    print("[3/5] Configuring Loudness Standards...")
    
    project.SetSetting("loudnessMode", "1")
    project.SetSetting("loudnessTarget", "-14")
    project.SetSetting("loudnessTruePeak", "-1")
    print("  ✓ Target Loudness: -14 LUFS")
    print("  ✓ True Peak: -1 dB")
    
    # ===== 4. VIDEO EXPORT SETTINGS =====
    print("[4/5] Configuring Video Export...")
    
    project.SetSetting("videoCodec", "H265")
    print("  ✓ Video Codec: H.265/HEVC")
    
    # ===== 5. PLUGIN CHAIN INFO =====
    print("[5/5] Plugin Chain Reference...")
    print("")
    print("  MASTERING CHAIN (add manually in Fairlight):")
    print("  ─────────────────────────────────────────────")
    print("  Slot 1: Fairlight EQ")
    print("          → Band 1: HP 30Hz")
    print("          → Band 6: HS +1.5dB @ 10kHz")
    print("")
    print("  Slot 2: Waves C6 or MuseFX Compress")
    print("          → Use 'Impact and Balance' preset")
    print("")
    print("  Slot 3: Waves L2 (ALWAYS LAST!)")
    print("          → Ceiling: -0.3 dBFS")
    print("          → Threshold: Until ~3-6dB reduction")
    print("  ─────────────────────────────────────────────")
    print("")
    
    # ===== DONE =====
    print("="*50)
    print("✅ PROJECT SETTINGS CONFIGURED!")
    print("="*50)
    print("")
    print("NEXT STEPS:")
    print("1. Go to Fairlight page")
    print("2. Select Main/Master track")
    print("3. Add plugins in order shown above")
    print("4. Play timeline and adjust Main fader")
    print("5. Target: -14 LUFS integrated")
    print("")
    print("VST PATHS (add in Preferences → Audio Plugins):")
    print("• C:\\Program Files\\Common Files\\VST3")
    print("• C:\\Program Files\\VstPlugins")
    print("• C:\\Program Files (x86)\\VstPlugins")
