# 🎨 Stable Diffusion Setup Guide for AI Brain

Complete guide to setting up Stable Diffusion image generation with AI Brain.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installing Stable Diffusion Forge](#installing-stable-diffusion-forge)
3. [Downloading Models](#downloading-models)
4. [Configuring AI Brain](#configuring-ai-brain)
5. [Testing Your Setup](#testing-your-setup)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Configuration](#advanced-configuration)

---

## Prerequisites

### Hardware Requirements

**Minimum:**
- GPU: 6GB VRAM (for SD 1.5)
- RAM: 8GB
- Storage: 20GB free space

**Recommended:**
- GPU: 8GB+ VRAM (for SDXL)
- RAM: 16GB+
- Storage: 50GB+ free space

**Optimal:**
- GPU: 12GB+ VRAM (for SDXL with ControlNet/LoRA)
- RAM: 32GB+
- Storage: 100GB+ free space

### GPU Compatibility

**NVIDIA (Best Performance):**
- RTX 3060 (12GB) or better
- RTX 4060 Ti (16GB) or better
- RTX 4090 (24GB) - Best

**AMD (Good Performance):**
- RX 6700 XT (12GB) or better
- RX 7900 XTX (24GB)

**Intel Arc (Experimental):**
- Arc A770 (16GB)

### Software Requirements

- **Windows:** Windows 10/11
- **Python:** 3.10.x (NOT 3.11 or 3.12)
- **Git:** Latest version

---

## Installing Stable Diffusion Forge

### Step 1: Install Python 3.10

1. Download Python 3.10.11 from [python.org](https://www.python.org/downloads/release/python-31011/)
2. **Important:** Check "Add Python to PATH" during installation
3. Verify installation:
```bash
python --version
# Should show: Python 3.10.11
```

### Step 2: Install Git

1. Download Git from [git-scm.com](https://git-scm.com/download/win)
2. Install with default settings
3. Verify installation:
```bash
git --version
```

### Step 3: Clone Stable Diffusion Forge

```bash
# Navigate to where you want to install (e.g., C:\AI\)
cd C:\AI

# Clone the repository
git clone https://github.com/lllyasviel/stable-diffusion-webui-forge.git

# Navigate into the directory
cd stable-diffusion-webui-forge
```

### Step 4: Configure Forge

Create `webui-user.bat` with these settings:

```batch
@echo off

set PYTHON=
set GIT=
set VENV_DIR=
set COMMANDLINE_ARGS=--api --xformers --autolaunch

call webui.bat
```

**Important flags:**
- `--api` - Enables API for AI Brain integration (REQUIRED)
- `--xformers` - Faster generation (NVIDIA only)
- `--autolaunch` - Opens browser automatically

### Step 5: First Run

```bash
# Run the webui
webui-user.bat

# First run will:
# - Download dependencies (~2GB)
# - Set up virtual environment
# - Download SD 1.5 base model (~4GB)
# - Take 10-15 minutes
```

Wait for: `Running on local URL:  http://127.0.0.1:7860`

---

## Downloading Models

### Where to Get Models

**Primary Source:**
- [CivitAI](https://civitai.com/) - Largest model repository

**Recommended Models:**

### SDXL Models (High Quality)

1. **JuggernautXL** (Realistic)
   - URL: https://civitai.com/models/133005
   - File: `juggernautXL_ragnarokBy.safetensors`
   - Size: ~6.5GB
   - Best for: Photorealistic images

2. **NovaAnimeXL** (Anime)
   - URL: https://civitai.com/models/...
   - File: `novaAnimeXL_ilV160.safetensors`
   - Size: ~6.5GB
   - Best for: Anime/Manga art

3. **WaiIllustrious** (Anime Alternative)
   - URL: https://civitai.com/models/...
   - File: `waiIllustriousSDXL_v160.safetensors`
   - Size: ~6.5GB
   - Best for: Anime illustrations

### SD 1.5 Models (Fast)

1. **Realistic Vision** (Realistic)
   - URL: https://civitai.com/models/4201
   - File: `realisticVision_v51.safetensors`
   - Size: ~2GB
   - Best for: Quick realistic images

2. **AnyLoRA** (Anime)
   - File: `AnyLoRA-anime.safetensors`
   - Size: ~2GB
   - Best for: Fast anime images

### Installing Models

**Method 1: Manual Download**

1. Download `.safetensors` files from CivitAI
2. Place in: `stable-diffusion-webui-forge\models\Stable-diffusion\`
3. Restart Forge

**Method 2: Automatic (from WebUI)**

1. Open Forge at `http://localhost:7860`
2. Click "Checkpoints" tab
3. Click "Load from: CivitAI"
4. Search and download

### Verifying Models

```bash
# From your AI Brain backend directory
cd C:\Users\mcfar\MyProjects\ai-brain\backend
node check-models.js
```

Should show all your installed models.

---

## Configuring AI Brain

### Step 1: Update .env File

```env
# Add to backend/.env
SD_API_URL=http://localhost:7860
```

### Step 2: Update Model Names

1. Run the model checker:
```bash
cd backend
node check-models.js
```

2. Copy the exact model names shown

3. Open `backend/src/services/sd-service.js`

4. Update the MODELS object:
```javascript
const MODELS = {
    xl_anime: {
        name: 'novaAnimeXL_ilV160.safetensors [463eddd5b3]', // Your exact name
        tier: 'xl',
        style: 'anime'
    },
    xl_realistic: {
        name: 'juggernautXL_ragnarokBy.safetensors [dd08fa32f9]', // Your exact name
        tier: 'xl',
        style: 'realistic'
    },
    // ... update all models
};
```

### Step 3: Restart Backend

```bash
cd backend
npm start
```

---

## Testing Your Setup

### Test 1: Check SD is Running

Open browser: `http://localhost:7860`

Should see Stable Diffusion WebUI.

### Test 2: Test API

```bash
curl http://localhost:7860/sdapi/v1/sd-models
```

Should return JSON with your models.

### Test 3: Generate Test Image

In AI Brain chat:

```
Generate a simple test image of a red apple on a white background
```

Should see image appear in chat after 10-30 seconds.

### Test 4: Test Auto Model Selection

**Test Anime:**
```
Generate an anime girl with blue hair
```
Console should show: `🎨 Style: Anime`

**Test Realistic:**
```
Generate a photorealistic landscape
```
Console should show: `📷 Style: Realistic`

**Test Quality Tiers:**
```
Generate a hyper detailed 8k masterpiece portrait
```
Console should show: `⭐ Quality: SDXL (high quality)`

```
Generate a quick draft sketch
```
Console should show: `⚡ Quality: SD 1.5 (fast)`

---

## Troubleshooting

### Issue: "SD not running" Error

**Cause:** Forge isn't started or API is disabled

**Solution:**
1. Make sure Forge is running
2. Check `webui-user.bat` has `--api` flag
3. Restart Forge

### Issue: "Model switch failed"

**Cause:** Model names don't match

**Solution:**
1. Run `node check-models.js`
2. Copy exact model names (including hash)
3. Update `sd-service.js`
4. Restart backend

### Issue: Slow Generation (>60 seconds)

**Possible Causes:**
- Dimensions too large
- Not using xformers
- GPU memory full

**Solutions:**
1. Reduce dimensions (use 512x512 instead of 1024x1024)
2. Add `--xformers` to `webui-user.bat`
3. Close other GPU-heavy applications
4. Use faster models (SD 1.5 or Turbo)

### Issue: Out of Memory Error

**Solutions:**
1. Reduce dimensions
2. Use SD 1.5 instead of SDXL
3. Add `--medvram` or `--lowvram` to launch args:
```batch
set COMMANDLINE_ARGS=--api --xformers --medvram
```

### Issue: Black Images

**Cause:** Negative prompt too restrictive or model issue

**Solution:**
1. Update negative prompt in `sd-service.js`
2. Try different sampler
3. Reduce CFG scale

### Issue: Images Look Bad

**Solutions:**
1. Increase steps (20 → 30)
2. Try different sampler (Euler a → DPM++ 2M Karras)
3. Adjust CFG scale (7 → 8)
4. Use better quality models

---

## Advanced Configuration

### Optimizing for Speed

**In `sd-service.js`:**

```javascript
const DEFAULT_PARAMS = {
    steps: 15,              // Lower = faster (min 10)
    cfg_scale: 6,           // Lower = faster
    width: 512,
    height: 512,
    sampler_name: 'DPM++ SDE Karras', // Fast sampler
    negative_prompt: DEFAULT_NEGATIVE_PROMPT
};
```

**In `webui-user.bat`:**

```batch
set COMMANDLINE_ARGS=--api --xformers --autolaunch --no-half-vae
```

### Optimizing for Quality

**In `sd-service.js`:**

```javascript
const DEFAULT_PARAMS = {
    steps: 30,              // Higher = better (max 50)
    cfg_scale: 8,           // Higher = more prompt adherence
    width: 1024,
    height: 1024,
    sampler_name: 'DPM++ 2M Karras', // Quality sampler
    negative_prompt: DEFAULT_NEGATIVE_PROMPT
};
```

### Adding Custom Quality Tiers

Edit `sd-service.js`:

```javascript
const QUALITY_KEYWORDS = {
    xl: ['detailed', 'high quality', '8k'],
    custom_ultra: ['ultra quality', 'premium', 'professional'],
    sd15: ['quick', 'fast'],
};
```

### Adding More Models

1. Download model to `models/Stable-diffusion/`
2. Add to `sd-service.js`:

```javascript
const MODELS = {
    // ... existing models
    xl_portrait: {
        name: 'yourPortraitModel.safetensors',
        tier: 'xl',
        style: 'realistic'
    }
};
```

### Custom Negative Prompts

Edit `sd-service.js`:

```javascript
const DEFAULT_NEGATIVE_PROMPT = 'low quality, blurry, distorted, deformed, disfigured, bad anatomy, watermark, text, signature, ugly, duplicate, morbid, mutilated';
```

---

## Performance Benchmarks

**SDXL (1024x1024, 20 steps):**
- RTX 4090: ~3-5 seconds
- RTX 3090: ~8-12 seconds
- RTX 3060 12GB: ~20-30 seconds
- RTX 2060 6GB: ~40-60 seconds (--medvram)

**SD 1.5 (512x512, 20 steps):**
- RTX 4090: ~1-2 seconds
- RTX 3090: ~3-5 seconds
- RTX 3060 12GB: ~6-10 seconds
- RTX 2060 6GB: ~12-18 seconds

---

## Additional Resources

**Official Docs:**
- [Forge GitHub](https://github.com/lllyasviel/stable-diffusion-webui-forge)
- [Forge Wiki](https://github.com/lllyasviel/stable-diffusion-webui-forge/wiki)

**Model Resources:**
- [CivitAI](https://civitai.com/) - Model downloads
- [HuggingFace](https://huggingface.co/) - Open source models

**Communities:**
- r/StableDiffusion - Reddit community
- [Stable Diffusion Discord](https://discord.gg/stablediffusion)

---

## FAQ

**Q: Do I need Stable Diffusion for AI Brain to work?**
A: No, it's optional. AI Brain works fine without it. Image generation is just an extra feature.

**Q: Can I use the original Stable Diffusion WebUI instead of Forge?**
A: Yes, but Forge is faster and more stable. Just ensure `--api` flag is enabled.

**Q: How much does running Stable Diffusion cost?**
A: It's free! Runs locally on your GPU. Only electricity costs.

**Q: Can I use cloud GPUs?**
A: Yes, update `SD_API_URL` to your cloud endpoint. RunPod, Vast.ai, etc.

**Q: What's the best model for my use case?**
A: 
- **Anime/Manga:** NovaAnimeXL or Anything V5
- **Realistic photos:** JuggernautXL or Realistic Vision
- **Art/Paintings:** DreamShaper or Deliberate
- **Speed:** Any SD 1.5 model with Turbo

**Q: Can I use multiple models at once?**
A: No, but AI Brain auto-switches between models based on your prompt.

**Q: My generations are slow, what can I do?**
A: 
1. Use smaller dimensions (512x512)
2. Use SD 1.5 instead of SDXL
3. Add `--xformers` flag
4. Reduce steps (20 → 15)
5. Use Turbo models

---

## Next Steps

After setup:
1. ✅ Test different models
2. ✅ Experiment with prompts
3. ✅ Try different quality keywords
4. ✅ Customize dimensions
5. ✅ Add more models from CivitAI

Need help? Open an issue on GitHub!

---

**Happy generating! 🎨**
