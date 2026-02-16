// Stable Diffusion Image Generation Service with Auto Model & Quality Selection
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SD_API_URL = process.env.SD_API_URL || 'http://localhost:7860';

const DEFAULT_NEGATIVE_PROMPT = 'low quality, blurry, distorted, deformed, disfigured, bad anatomy, watermark, text, signature';

const DEFAULT_PARAMS = {
    steps: 20,
    cfg_scale: 7,
    width: 512,
    height: 512,
    sampler_name: 'Euler a',
    negative_prompt: DEFAULT_NEGATIVE_PROMPT
};

// Model definitions with tiers and specialties
const MODELS = {
    // SDXL - Balanced quality (your main models)
    xl_anime: {
        name: 'novaAnimeXL_ilV160.safetensors [463eddd5b3]',
        tier: 'xl',
        style: 'anime'
    },
    xl_anime_alt: {
        name: 'waiIllustriousSDXL_v160.safetensors',
        tier: 'xl',
        style: 'anime'
    },
    xl_realistic: {
        name: 'juggernautXL_ragnarokBy.safetensors [dd08fa32f9]',
        tier: 'xl',
        style: 'realistic'
    },
    // SD 1.5 - Fast models
    sd15_anime: {
        name: 'AnyLoRA-anime.safetensors [ad1150a839]',
        tier: 'sd15',
        style: 'anime'
    },
    sd15_realistic: {
        name: 'v1-5-pruned-emaonly.ckpt [cc6cb27103]',
        tier: 'sd15',
        style: 'realistic'
    },
    // Turbo - Ultra fast
    turbo: {
        name: 'zImageTurbo_turbo.safetensors',
        tier: 'turbo',
        style: 'realistic'
    }
};

// Quality tier detection keywords
const QUALITY_KEYWORDS = {
    xl: ['hyper detail', 'ultra detail', 'maximum quality', 'masterpiece', 'best quality', '8k', '16k', 'perfect', 'flawless', 'extreme detail', 'insane detail', 'detailed', 'high quality', '4k', 'hd'],
    turbo: ['instant', 'very fast', 'ultra fast', 'turbo'],
    sd15: ['quick', 'fast', 'simple', 'basic', 'draft', 'rough']
};

// Style detection keywords
const STYLE_KEYWORDS = {
    anime: ['anime', 'manga', 'cartoon', 'animated', 'chibi', 'kawaii', 'cel shaded', '2d art', 'illustration', 'waifu', 'moe', 'bishoujo', 'tsundere', 'yandere', 'cute girl', 'anime style', 'manga style'],
    realistic: ['realistic', 'photo', 'photograph', 'photorealistic', 'portrait', 'cinematic', '3d render', 'real', 'person']
};

/**
 * Detect quality tier from prompt
 */
function selectQualityTier(prompt) {
    const lower = prompt.toLowerCase();

    // Check turbo keywords
    if (QUALITY_KEYWORDS.turbo.some(kw => lower.includes(kw))) {
        console.log(`⚡⚡ Quality: TURBO (ultra fast)`);
        return 'turbo';
    }

    // Check SD 1.5 keywords
    if (QUALITY_KEYWORDS.sd15.some(kw => lower.includes(kw))) {
        console.log(`⚡ Quality: SD 1.5 (fast)`);
        return 'sd15';
    }

    // Default to SDXL (your best quality)
    console.log(`⭐ Quality: SDXL (high quality)`);
    return 'xl';
}

/**
 * Detect style from prompt
 */
function selectStyle(prompt) {
    const lower = prompt.toLowerCase();

    const animeScore = STYLE_KEYWORDS.anime.filter(kw => lower.includes(kw)).length;
    const realisticScore = STYLE_KEYWORDS.realistic.filter(kw => lower.includes(kw)).length;

    // Prioritize anime if any anime keywords are present
    if (animeScore > 0) {
        console.log(`🎨 Style: Anime (${animeScore} keywords)`);
        return 'anime';
    }

    console.log(`📷 Style: Realistic (${realisticScore} keywords)`);
    return 'realistic';
}

/**
 * Select best model based on quality and style
 */
function selectModelForPrompt(prompt) {
    const tier = selectQualityTier(prompt);
    const style = selectStyle(prompt);

    // Find matching model
    const model = Object.values(MODELS).find(m =>
        m.tier === tier && m.style === style
    );

    if (model) {
        console.log(`✅ Model: ${model.name}`);
        return model.name;
    }

    // Fallback to XL realistic
    console.log(`⚠️ Fallback to ${MODELS.xl_realistic.name}`);
    return MODELS.xl_realistic.name;
}

/**
 * Parse dimensions from prompt
 */
function parseDimensions(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    // Explicit dimensions (e.g., "1024x768")
    const match = prompt.match(/(\d{3,4})\s*x\s*(\d{3,4})/i);
    if (match) {
        return { width: parseInt(match[1]), height: parseInt(match[2]) };
    }

    // Keywords
    if (lowerPrompt.includes('landscape') || lowerPrompt.includes('wide')) {
        return { width: 896, height: 512 };
    }
    if (lowerPrompt.includes('portrait') || lowerPrompt.includes('tall')) {
        return { width: 512, height: 896 };
    }
    if (lowerPrompt.includes('square')) {
        return { width: 768, height: 768 };
    }
    if (lowerPrompt.includes('ultra wide') || lowerPrompt.includes('ultrawide')) {
        return { width: 1024, height: 512 };
    }
    if (lowerPrompt.includes('banner')) {
        return { width: 1024, height: 256 };
    }

    return { width: 768, height: 768 };
}

/**
 * Set active model
 */
async function setModel(modelName) {
    try {
        const response = await fetch(`${SD_API_URL}/sdapi/v1/options`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sd_model_checkpoint: modelName }),
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) throw new Error(`Failed to set model`);
        console.log(`✅ Model loaded: ${modelName}`);
        return true;
    } catch (error) {
        console.error(`❌ Model switch failed:`, error.message);
        return false;
    }
}

/**
 * Check if SD is available
 */
async function isAvailable() {
    try {
        const response = await fetch(`${SD_API_URL}/sdapi/v1/sd-models`, {
            signal: AbortSignal.timeout(3000)
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Generate image with auto model and dimension selection
 */
async function generateImage(prompt, overrides = {}) {
    // Auto-select model
    const selectedModel = selectModelForPrompt(prompt);
    await setModel(selectedModel);

    // Auto-select dimensions
    const dimensions = parseDimensions(prompt);
    console.log(`📐 Dimensions: ${dimensions.width}x${dimensions.height}`);

    // Wait for model to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    const params = {
        prompt,
        ...DEFAULT_PARAMS,
        width: dimensions.width,
        height: dimensions.height,
        ...overrides
    };

    const response = await fetch(`${SD_API_URL}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(1200000) // 20 minutes
    });

    if (!response.ok) {
        throw new Error(`SD API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.images || data.images.length === 0) {
        throw new Error('No images returned');
    }

    // Save image
    const base64 = data.images[0];
    const filename = `sd-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.png`;
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, Buffer.from(base64, 'base64'));

    console.log(`🎨 Image saved: ${filepath}`);
    return { filename, filepath, model: selectedModel, dimensions };
}

/**
 * Process [GENERATE_IMAGE: ...] tags in text
 */
async function processImageTags(responseText, baseUrl) {
    const tagRegex = /\[GENERATE_IMAGE:\s*(.+?)\]/g;
    const matches = [...responseText.matchAll(tagRegex)];

    if (matches.length === 0) return responseText;

    const sdAvailable = await isAvailable();
    if (!sdAvailable) {
        let result = responseText;
        for (const match of matches) {
            result = result.replace(match[0], '*Could not generate image — SD not running.*');
        }
        return result;
    }

    let result = responseText;
    for (const match of matches) {
        const fullTag = match[0];
        const prompt = match[1].trim();

        try {
            console.log(`🎨 Generating: "${prompt}"`);
            const { filename, model } = await generateImage(prompt);
            const imageUrl = `${baseUrl}/uploads/${filename}`;
            result = result.replace(fullTag, `![Generated: ${prompt}](${imageUrl})\n*Model: ${model}*`);
        } catch (error) {
            console.error('Generation failed:', error.message);
            result = result.replace(fullTag, `*Image generation failed: ${error.message}*`);
        }
    }

    return result;
}

/**
 * Get available models
 */
async function getAvailableModels() {
    try {
        const response = await fetch(`${SD_API_URL}/sdapi/v1/sd-models`, {
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) throw new Error('Failed to get models');

        const models = await response.json();
        return models.map(m => m.title || m.model_name);
    } catch (error) {
        console.error('Get models failed:', error.message);
        return [];
    }
}

module.exports = {
    isAvailable,
    generateImage,
    processImageTags,
    selectModelForPrompt,
    setModel,
    getAvailableModels,
    parseDimensions,
    MODELS
};
