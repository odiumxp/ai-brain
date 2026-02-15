# 🎨 Stable Diffusion Integration - Technical Architecture

**Technical documentation for developers** who want to understand or modify the Stable Diffusion integration.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Integration Approach](#integration-approach)
3. [API Communication](#api-communication)
4. [Automatic Model Selection](#automatic-model-selection)
5. [Cloud Deployment](#cloud-deployment)
6. [Troubleshooting](#troubleshooting)
7. [Future Enhancements](#future-enhancements)

---

## Architecture Overview

### How AI Brain Integrates with Stable Diffusion

**Important:** AI Brain does **NOT** modify Stable Diffusion code. It communicates via HTTP REST API only.

```
┌─────────────────────────────────────────┐
│         AI Brain Backend (Node.js)      │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   sd-service.js                   │ │
│  │   - Automatic model selection     │ │
│  │   - Quality tier detection        │ │
│  │   - Dimension parsing             │ │
│  │   - HTTP API calls                │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    ↓
        HTTP POST/GET requests to
        http://localhost:7860/sdapi/v1/*
                    ↓
┌─────────────────────────────────────────┐
│  Stable Diffusion Forge (Python)        │
│  Running with --api flag enabled        │
│                                         │
│  - Receives HTTP requests               │
│  - Loads models                         │
│  - Generates images                     │
│  - Returns base64 encoded images        │
└─────────────────────────────────────────┘
                    ↓
        Base64 image data returned
                    ↓
┌─────────────────────────────────────────┐
│         AI Brain Backend                │
│  - Saves image to /uploads              │
│  - Returns URL to frontend              │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Frontend (React)                │
│  - Displays image in chat               │
│  - Shows markdown: ![alt](image-url)    │
└─────────────────────────────────────────┘
```

---

## Integration Approach

### What We Modified (AI Brain Only)

✅ **Files in AI Brain:**
- `backend/src/services/sd-service.js` - HTTP API client for Stable Diffusion
- `backend/check-models.js` - Utility to list available SD models
- `backend/.env.example` - Added SD_API_URL configuration

### What We Did NOT Modify

❌ **Stable Diffusion Forge** - Zero changes to SD codebase
❌ **SD Python files** - Not touched
❌ **SD models** - Not modified
❌ **SD WebUI** - No changes

### Why This Approach?

**Advantages:**
1. ✅ **Zero SD modifications** - Stable Diffusion runs vanilla
2. ✅ **Decoupled** - SD and AI Brain are independent
3. ✅ **Maintainable** - SD can be updated without breaking AI Brain
4. ✅ **Flexible** - Can switch to different SD implementations
5. ✅ **Portable** - Works with cloud SD instances too

---

## API Communication

### Endpoints Used

We only use the **public Stable Diffusion API** endpoints:

#### 1. Check if SD is running
```http
GET http://localhost:7860/sdapi/v1/sd-models
```
Returns: List of available models

#### 2. Switch active model
```http
POST http://localhost:7860/sdapi/v1/options
Content-Type: application/json

{
  "sd_model_checkpoint": "juggernautXL_ragnarokBy.safetensors [dd08fa32f9]"
}
```

#### 3. Generate image (txt2img)
```http
POST http://localhost:7860/sdapi/v1/txt2img
Content-Type: application/json

{
  "prompt": "a beautiful landscape",
  "negative_prompt": "low quality, blurry",
  "steps": 20,
  "cfg_scale": 7,
  "width": 512,
  "height": 512,
  "sampler_name": "Euler a"
}
```
Returns: `{ "images": ["base64-encoded-png"] }`

### Configuration Required

**In Stable Diffusion:**

Add `--api` flag to launch arguments in `webui-user.bat`:

```batch
set COMMANDLINE_ARGS=--api --xformers --autolaunch
```

**In AI Brain:**

Add to `backend/.env`:
```env
SD_API_URL=http://localhost:7860
```

That's it! No other changes needed.

---

## Automatic Model Selection

### How It Works

```javascript
// User prompt: "Generate a hyper detailed 8k anime girl portrait"

// 1. Quality Tier Detection
selectQualityTier(prompt)
// Scans for: "hyper detailed", "8k"
// Result: 'xl' (SDXL tier)

// 2. Style Detection
selectStyle(prompt)
// Scans for: "anime girl"
// Result: 'anime'

// 3. Dimension Detection
parseDimensions(prompt)
// Scans for: "portrait"
// Result: { width: 512, height: 896 }

// 4. Model Selection
selectModelForPrompt(prompt)
// Finds: tier='xl' + style='anime'
// Result: 'novaAnimeXL_ilV160.safetensors'

// 5. API Calls
await setModel(selectedModel)
await generateImage(prompt, dimensions)
```

### Quality Tiers

Defined in `sd-service.js`:

```javascript
const QUALITY_KEYWORDS = {
    xl: ['hyper detail', 'ultra detail', 'masterpiece', '8k', '16k'],
    turbo: ['instant', 'turbo', 'ultra fast'],
    sd15: ['quick', 'fast', 'simple', 'draft']
};
```

### Style Detection

```javascript
const STYLE_KEYWORDS = {
    anime: ['anime', 'manga', 'cartoon', 'chibi', 'kawaii'],
    realistic: ['realistic', 'photo', 'photorealistic', 'cinematic']
};
```

### Dimension Parsing

```javascript
// Supports:
// - Exact: "1024x768"
// - Keywords: "portrait" → 512x896
//            "landscape" → 896x512
//            "square" → 768x768
//            "ultrawide" → 1024x512
//            "banner" → 1024x256
```

---

## Cloud Deployment

### Using RunPod/Vast.ai

**Setup:**

1. Deploy SD Forge on cloud GPU
2. Expose API port (7860)
3. Get public URL (e.g., `https://xyz-12345.runpod.io`)
4. Update AI Brain `.env`:

```env
SD_API_URL=https://xyz-12345.runpod.io
```

AI Brain will work identically with cloud SD.

### Cost Comparison

**Local Setup:**
- Pros: Free, private, low latency
- Cons: Requires GPU, electricity cost

**Cloud Setup:**
- Pros: No local GPU needed, scalable
- Cons: Pay per minute (~$0.50-2/hour)

### Security Considerations

**API Access:**

By default, SD API has **no authentication**. If exposing to internet:

1. Use firewall rules to restrict access
2. Use reverse proxy with authentication (nginx + basic auth)
3. Use VPN for remote access
4. Or use cloud providers with built-in security (RunPod, Vast.ai)

**For local development:** No security needed, only accessible on localhost.

---

## Troubleshooting

### Issue: API calls fail

**Symptoms:**
- "Could not generate image — SD not running"
- Connection timeout errors

**Solutions:**
1. Check SD Forge is running (`http://localhost:7860` in browser)
2. Verify `--api` flag is enabled in launch args
3. Check firewall isn't blocking port 7860
4. Verify `SD_API_URL` in `.env` is correct

### Issue: Wrong model selected

**Symptoms:**
- Anime model used for realistic images
- Model switch failed errors

**Solutions:**
1. Run `node check-models.js` to see available models
2. Verify model names match exactly in `sd-service.js`
3. Check console logs for model selection logic
4. Update model names including hash if needed

### Issue: Images timeout

**Symptoms:**
- Generation takes >20 minutes
- Timeout errors in console

**Solutions:**
1. Increase timeout in `sd-service.js`:
   ```javascript
   signal: AbortSignal.timeout(1200000) // 20 minutes
   ```
2. Reduce image dimensions
3. Use faster models (SD 1.5 or Turbo)
4. Check GPU isn't overloaded

### Issue: Out of memory

**Symptoms:**
- Black images
- CUDA out of memory errors in SD console

**Solutions:**
1. Reduce dimensions (1024x1024 → 512x512)
2. Use SD 1.5 instead of SDXL
3. Add `--medvram` or `--lowvram` to SD launch args
4. Close other GPU-heavy applications

---

## Customization

### Adding Custom Quality Tiers

Edit `sd-service.js`:

```javascript
const QUALITY_KEYWORDS = {
    xl: ['detailed', 'high quality', '8k'],
    ultra: ['ultra quality', 'premium', 'professional'], // New tier
    sd15: ['quick', 'fast']
};

const MODELS = {
    // ... existing models
    ultra_realistic: {
        name: 'your-premium-model.safetensors',
        tier: 'ultra',
        style: 'realistic'
    }
};
```

### Adding More Models

1. Download model to SD's `models/Stable-diffusion/` folder
2. Restart SD Forge
3. Run `node check-models.js` to get exact name
4. Add to `sd-service.js`:

```javascript
const MODELS = {
    // ... existing models
    xl_portrait: {
        name: 'yourPortraitModel.safetensors [hash]',
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

### Adjusting Default Parameters

Edit `sd-service.js`:

```javascript
const DEFAULT_PARAMS = {
    steps: 20,              // Increase for quality (max 50)
    cfg_scale: 7,           // Prompt adherence (6-12)
    width: 512,
    height: 512,
    sampler_name: 'Euler a', // Try: 'DPM++ 2M Karras'
    negative_prompt: DEFAULT_NEGATIVE_PROMPT
};
```

---

## Alternative SD Implementations

This approach works with **any** Stable Diffusion implementation that provides a compatible API:

- ✅ **Stable Diffusion Forge** (recommended)
- ✅ **Automatic1111 WebUI** (original)
- ✅ **ComfyUI** (with API extension)
- ✅ **InvokeAI** (with API)
- ✅ **Cloud services** (RunPod, Vast.ai, Replicate)
- ✅ **Custom implementations**

Just point `SD_API_URL` to the correct endpoint.

---

## Future Enhancements

Potential additions (not yet implemented):

### img2img
Modify existing images:
```javascript
POST /sdapi/v1/img2img
{
  "init_images": ["base64-image"],
  "prompt": "make it winter",
  "denoising_strength": 0.7
}
```

### Inpainting
Edit parts of images:
```javascript
POST /sdapi/v1/img2img
{
  "init_images": ["base64-image"],
  "mask": "base64-mask",
  "prompt": "add a cat"
}
```

### ControlNet
Pose/depth control:
```javascript
{
  "controlnet_units": [{
    "model": "control_openpose",
    "image": "base64-pose"
  }]
}
```

### LoRA Support
Additional style modifiers:
```javascript
{
  "prompt": "portrait <lora:style-name:0.8>"
}
```

### Batch Generation
Multiple images at once:
```javascript
{
  "batch_size": 4,
  "n_iter": 2  // 8 images total
}
```

### Progress Tracking
Real-time generation status:
```javascript
GET /sdapi/v1/progress
// Returns: { progress: 0.45, eta: 12.5 }
```

All would use the same API approach - no SD code modifications needed.

---

## Performance Optimization

### For Speed

**Default params:**
```javascript
steps: 15,              // Lower = faster (min 10)
cfg_scale: 6,           // Lower = faster
sampler_name: 'DPM++ SDE Karras', // Fast sampler
width: 512,
height: 512
```

**Launch args:**
```batch
--api --xformers --no-half-vae
```

### For Quality

**Default params:**
```javascript
steps: 30,              // Higher = better (max 50)
cfg_scale: 8,           // Higher = more adherence
sampler_name: 'DPM++ 2M Karras', // Quality sampler
width: 1024,
height: 1024
```

---

## License Compatibility

**Stable Diffusion License:** CreativeML Open RAIL-M
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ⚠️  Must credit creators

**AI Brain License:** MIT
- ✅ Fully compatible with SD license
- ✅ No conflicts

---

## Contributing

Want to improve the SD integration?

**Easy contributions:**
- Add more model presets
- Improve keyword detection
- Add new quality tiers
- Update documentation

**Advanced contributions:**
- Add img2img support
- Implement ControlNet
- Add progress tracking
- Batch generation

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Additional Resources

**Official Docs:**
- [Stable Diffusion Forge](https://github.com/lllyasviel/stable-diffusion-webui-forge)
- [SD Forge API Wiki](https://github.com/lllyasviel/stable-diffusion-webui-forge/wiki/API)
- [Automatic1111 API](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/API)

**Models:**
- [CivitAI](https://civitai.com/) - Model downloads
- [HuggingFace](https://huggingface.co/) - Open source models

**Communities:**
- [r/StableDiffusion](https://reddit.com/r/StableDiffusion)
- [Stable Diffusion Discord](https://discord.gg/stablediffusion)

---

## Conclusion

**Key Takeaway:** AI Brain integrates with Stable Diffusion via HTTP API only. No direct code modifications to Stable Diffusion are needed or made.

This keeps the integration:
- ✅ Clean and maintainable
- ✅ Flexible and upgradeable
- ✅ Portable across environments
- ✅ Independent of SD versions

Both systems can be updated independently without breaking the integration.

---

**Questions?** Open an issue on [GitHub](https://github.com/odiumxp/ai-brain/issues)

**Last Updated:** 2026-02-15
