# 🚀 Quick Start Scripts

Batch and PowerShell scripts to start/stop all AI Brain services.

---

## 📁 Files Overview

### ⭐ Windows Terminal (Tabs) - RECOMMENDED
**Best for Windows 11:**
- `START_WITH_TABS.bat` - Opens everything in ONE window with colored tabs
- `START_WITH_TABS_NO_SD.bat` - Opens AI Brain only (no SD) in tabs
- `start-ai-brain.ps1` - PowerShell script (called by the .bat)
- `start-ai-brain-no-sd.ps1` - PowerShell script (called by the .bat)

### 📺 Separate Windows (Classic)
**Works on any Windows:**
- `start-ai-brain.bat` - Opens 3 separate windows
- `start-ai-brain-no-sd.bat` - Opens 2 separate windows
- `stop-ai-brain.bat` - Stops all services

---

## 🎯 Recommended: Windows Terminal with Tabs

### Option 1: With Image Generation (3 tabs)
**Double-click:** `START_WITH_TABS.bat`

**Opens Windows Terminal with:**
- Tab 1 (Red): 🎨 Stable Diffusion Forge
- Tab 2 (Cyan): ⚙️ Backend Server
- Tab 3 (Green): 🌐 Frontend

### Option 2: Without Image Generation (2 tabs)
**Double-click:** `START_WITH_TABS_NO_SD.bat`

**Opens Windows Terminal with:**
- Tab 1 (Cyan): ⚙️ Backend Server
- Tab 2 (Green): 🌐 Frontend

### To Stop:
**Double-click:** `stop-ai-brain.bat`

---

## 📺 Alternative: Separate Windows

If you prefer separate windows or don't have Windows Terminal:

### With Images:
**Double-click:** `start-ai-brain.bat`
- Opens 3 separate terminal windows

### Without Images:
**Double-click:** `start-ai-brain-no-sd.bat`
- Opens 2 separate terminal windows

### To Stop:
**Double-click:** `stop-ai-brain.bat`

---

## 🎨 Tab Colors Explained

**Red Tab** 🔴 - Stable Diffusion (image generation)
**Cyan Tab** 🔵 - Backend Server (API)
**Green Tab** 🟢 - Frontend (web interface)

Easy to identify at a glance!

---

## ⏱️ Startup Times

**With Stable Diffusion:**
- SD Forge: ~30-60 seconds
- Backend: ~5 seconds
- Frontend: ~3 seconds
- **Total: ~40-70 seconds**

**Without Stable Diffusion:**
- Backend: ~5 seconds
- Frontend: ~3 seconds
- **Total: ~10 seconds**

---

## 🔧 First Time Setup

### 1. Install Windows Terminal (Optional but Recommended)
If you want the tabbed experience:
- Open Microsoft Store
- Search "Windows Terminal"
- Install (it's free)

### 2. Unblock the Scripts (Windows Security)
Right-click each `.ps1` file → Properties → Check "Unblock" → OK

Or run this in PowerShell (as admin):
```powershell
cd C:\Users\mcfar\MyProjects\ai-brain
Unblock-File .\start-ai-brain.ps1
Unblock-File .\start-ai-brain-no-sd.ps1
```

### 3. Test It
Double-click `START_WITH_TABS.bat` and watch it work! ✨

---

## 🐛 Troubleshooting

### "Cannot be loaded because running scripts is disabled"
**Solution 1 (Easy):** Just double-click the `.bat` files - they handle permissions

**Solution 2 (Manual):** Run PowerShell as admin:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Windows Terminal Not Found
**Solution:** Use the `.bat` files instead (start-ai-brain.bat)
They work without Windows Terminal

### Tabs Don't Open
**Check:**
1. Is Windows Terminal installed?
2. Did you unblock the `.ps1` files?
3. Are the paths correct in the scripts?

### Wrong Paths
**Edit the `.ps1` files and update these lines:**
```powershell
cd 'C:\Users\mcfar\stable-diffusion-webui-forge'
cd 'C:\Users\mcfar\MyProjects\ai-brain\backend'
cd 'C:\Users\mcfar\MyProjects\ai-brain\frontend'
```

---

## 💡 Pro Tips

**Quick Access:**
1. Right-click `START_WITH_TABS.bat`
2. Send to → Desktop (create shortcut)
3. Now you can start AI Brain from your desktop!

**Pin to Taskbar:**
1. Right-click `START_WITH_TABS.bat`
2. Pin to taskbar
3. One-click startup from taskbar!

**Custom Tab Colors:**
Edit the `.ps1` files and change:
```powershell
--tabColor "#FF6B6B"  # Red
--tabColor "#4ECDC4"  # Cyan
--tabColor "#95E1D3"  # Green
```

---

## 📋 Command Line Usage

If you prefer terminal:

```powershell
# With tabs (PowerShell):
cd C:\Users\mcfar\MyProjects\ai-brain
powershell -ExecutionPolicy Bypass -File start-ai-brain.ps1

# Separate windows (Command Prompt):
cd C:\Users\mcfar\MyProjects\ai-brain
start-ai-brain.bat

# Stop everything:
stop-ai-brain.bat
```

---

## 🎉 Summary

**Windows 11 Users (Recommended):**
✅ Use `START_WITH_TABS.bat` - Everything in one window with colored tabs!

**Windows 10 or Classic Users:**
✅ Use `start-ai-brain.bat` - Traditional separate windows

**To Stop:**
✅ Use `stop-ai-brain.bat` - Kills all services

---

## 📸 What It Looks Like

**Windows Terminal with Tabs:**
```
┌─────────────────────────────────────────────────┐
│ 🎨 SD Forge  │ ⚙️ Backend  │ 🌐 Frontend │  + │
├─────────────────────────────────────────────────┤
│                                                 │
│  All three services in one window!              │
│  Switch between tabs easily!                    │
│  Color-coded for quick identification!          │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Separate Windows:**
```
Window 1: Stable Diffusion
Window 2: Backend
Window 3: Frontend
```

---

**Now you can start everything with ONE CLICK in organized tabs!** 🎉✨
