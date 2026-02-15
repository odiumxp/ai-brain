# Stable Diffusion Integration - Technical Notes

**IMPORTANT:** This is a reference document for developers. Not part of the user documentation.

---

## How AI Brain Integrates with Stable Diffusion

### What We Modified (AI Brain Code Only)

✅ **Files Changed in AI Brain:**
- `backend/src/services/sd-service.js` - Service that calls the Stable Diffusion API via HTTP
- `backend/check-models.js` - Utility script to list available SD models
- `backend/.env.example` - Added SD_API_URL configuration
- Documentation files (README.md, SETUP_STABLE_DIFFUSION.md)

### What We Did NOT Modify

❌ **Stable Diffusion Forge itself** - Zero changes to SD codebase
❌ **Any SD Python files** - Not touched
❌ **Any SD models** - Not modified
❌ **SD WebUI** - No changes
❌ **SD configuration files** - Only added `--api` flag to launch args

---

## Architecture Overview

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

## API Endpoints Used

We only use the **public Stable Diffusion API** endpoints:

### 1. Check if SD is running
```
GET http://localhost:7860/sdapi/v1/sd-models
Returns: List of available models
```

### 2. Switch active model
```
POST http://localhost:7860/sdapi/v1/options
Body: { "sd_model_checkpoint": "model-name.safetensors" }
Returns: Success/failure
```

### 3. Generate image (txt2img)
```
POST http://localhost:7860/sdapi/v1/txt2img
Body: {
  "prompt": "a beautiful landscape",
  "negative_prompt": "low quality, blurry",
  "steps": 20,
  "cfg_scale": 7,
  "width": 512,
  "height": 512,
  "sampler_name": "Euler a"
}
Returns: { "images": ["base64-encoded-png"] }
```

These are **standard REST API calls**. No custom modifications needed.

---

## Why This Approach is Clean

### ✅ Advantages:

1. **Zero SD modifications** - Stable Diffusion runs vanilla
2. **Decoupled** - SD and AI Brain are independent
3. **Maintainable** - SD can be updated without breaking AI Brain
4. **Flexible** - Can switch to different SD implementations
5. **Portable** - Works with cloud SD instances too

### 🔄 Communication Flow:

```
User prompt → AI Brain → HTTP API → SD Forge → Image → AI Brain → User
```

All communication happens over HTTP REST API. No direct code integration.

---

## Configuration Required

### In Stable Diffusion:

**Only one change needed:**

Add `--api` flag to launch arguments in `webui-user.bat`:

```batch
set COMMANDLINE_ARGS=--api --xformers --autolaunch
```

This enables the HTTP API server on port 7860.

**That's it!** No other SD changes needed.

### In AI Brain:

Add to `backend/.env`:
```env
SD_API_URL=http://localhost:7860
```

---

## Automatic Model Selection Logic

**How it works:**

1. **User prompt received** by AI Brain
2. **sd-service.js analyzes prompt:**
   - Scans for quality keywords (8k, masterpiece, quick, etc.)
   - Scans for style keywords (anime, realistic, etc.)
   - Scans for dimension keywords (portrait, landscape, 1024x768, etc.)
3. **Selects appropriate model** from MODELS config
4. **Makes API call to SD** to switch model
5. **Makes API call to SD** to generate image with selected dimensions
6. **Receives base64 image**
7. **Saves to disk** and returns URL

**Example:**

```
Prompt: "Generate a hyper detailed 8k anime girl portrait"

Analysis:
- Quality: "hyper detailed 8k" → SDXL tier
- Style: "anime girl" → Anime model
- Dimensions: "portrait" → 512x896

Selected: novaAnimeXL_ilV160.safetensors at 512x896
```

---

## Alternative SD Implementations

This approach works with **any** Stable Diffusion implementation that provides a compatible API:

- ✅ Stable Diffusion Forge (recommended)
- ✅ Automatic1111 WebUI (original)
- ✅ ComfyUI (with API extension)
- ✅ Cloud services (RunPod, Vast.ai)
- ✅ Custom implementations

Just point `SD_API_URL` to the correct endpoint.

---

## Cloud Deployment

### Using RunPod/Vast.ai:

1. Deploy SD Forge on cloud GPU
2. Expose API port (7860)
3. Get public URL (e.g., `https://xyz.runpod.io`)
4. Update AI Brain `.env`:
```env
SD_API_URL=https://xyz.runpod.io
```

AI Brain will work identically with cloud SD.

---

## Performance Considerations

### Local Setup:
- **Pros:** Free, private, low latency
- **Cons:** Requires GPU, electricity cost

### Cloud Setup:
- **Pros:** No local GPU needed, scalable
- **Cons:** Pay per minute (~$0.50-2/hour)

### Hybrid:
- Use local for development
- Use cloud for production/heavy usage

---

## Security Notes

### API Access:

By default, SD API has **no authentication**. If exposing to internet:

1. Use firewall rules to restrict access
2. Use reverse proxy with authentication
3. Use VPN for remote access
4. Or use cloud providers with built-in security

**For local development:** No security needed, only accessible on localhost.

---

## Troubleshooting Reference

### Issue: API calls fail

**Check:**
1. Is SD Forge running? (`http://localhost:7860` in browser)
2. Is `--api` flag enabled?
3. Is firewall blocking port 7860?
4. Is `SD_API_URL` correct in `.env`?

### Issue: Wrong model selected

**Check:**
1. Run `node check-models.js` to see available models
2. Verify model names match exactly in `sd-service.js`
3. Check console logs for model selection logic

### Issue: Images timeout

**Increase timeout in sd-service.js:**
```javascript
signal: AbortSignal.timeout(1200000) // 20 minutes
```

---

## Future Enhancements

Potential additions (not yet implemented):

- [ ] **img2img** - Modify existing images
- [ ] **Inpainting** - Edit parts of images
- [ ] **ControlNet** - Pose/depth control
- [ ] **LoRA support** - Additional style modifiers
- [ ] **Batch generation** - Multiple images at once
- [ ] **Progress tracking** - Real-time generation status
- [ ] **Image upscaling** - HD post-processing
- [ ] **Negative prompt templates** - Per-model optimized negatives

All would use the same API approach - no SD code modifications.

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

## Conclusion

**Key Takeaway:** AI Brain integrates with Stable Diffusion via HTTP API only. No direct code modifications to Stable Diffusion are needed or made.

This keeps the integration:
- ✅ Clean
- ✅ Maintainable
- ✅ Flexible
- ✅ Upgradeable
- ✅ Portable

Both systems can be updated independently without breaking the integration.

---

**Last Updated:** 2026-02-15
**Author:** AI Brain Development Team
**Status:** Production Ready
