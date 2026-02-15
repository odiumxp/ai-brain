// Claude Service - Handles interactions with Anthropic's Claude API
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Send a message to Claude with context
 */
async function sendMessage(systemContext, userMessage, image = null) {
    try {
        const messages = [];

        // Add image if provided
        if (image) {
            // If caller provided a URL (we saved the upload in /uploads), send the URL form
            if (image.url) {
                messages.push({
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'url',
                                url: image.url
                            }
                        },
                        {
                            type: 'text',
                            text: userMessage || 'Please analyze this image.'
                        }
                    ]
                });

                // Otherwise validate base64 as before
            } else {
                if (!image.data || typeof image.data !== 'string' || !image.data.startsWith('data:image/')) {
                    throw new Error('Invalid image data. Please upload a valid image file.');
                }
                const [meta, base64] = image.data.split(',');
                if (!base64) {
                    throw new Error('Image data is missing or malformed.');
                }

                // Decode base64 and validate bytes
                let buffer;
                try {
                    buffer = Buffer.from(base64, 'base64');
                } catch (err) {
                    throw new Error('Image data is not valid base64.');
                }

                if (!buffer || buffer.length < 20) {
                    throw new Error('Image data is too small or corrupted.');
                }

                // Reject excessively large uploads (safety)
                const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
                if (buffer.length > MAX_BYTES) {
                    throw new Error('Image too large. Maximum allowed size is 5 MB.');
                }

                const mediaType = meta.split(';')[0].split(':')[1] || '';
                // Verify magic/signature for common image types
                const sig = buffer.slice(0, 12);
                const isPng = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4E && sig[3] === 0x47;
                const isJpeg = sig[0] === 0xFF && sig[1] === 0xD8 && sig[2] === 0xFF;
                const isWebp = sig.toString('ascii', 0, 4) === 'RIFF' && sig.toString('ascii', 8, 12) === 'WEBP';

                if (!isPng && !isJpeg && !isWebp) {
                    throw new Error('Unsupported or corrupted image file.');
                }

                // Normalize mediaType if missing
                const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
                if (mediaType && !allowed.includes(mediaType)) {
                    throw new Error('Unsupported image type. Please upload PNG, JPG, or WEBP.');
                }

                messages.push({
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mediaType,
                                data: base64
                            }
                        },
                        {
                            type: 'text',
                            text: userMessage || 'Please analyze this image.'
                        }
                    ]
                });
            }
        } else {
            messages.push({
                role: 'user',
                content: userMessage
            });
        }

        const response = await client.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            system: systemContext,
            messages: messages
        });

        return response.content[0].text;
    } catch (error) {
        console.error('Claude API error:', error);
        // Return a user-friendly error for image issues
        if (error.message && error.message.startsWith('Invalid image') || error.message.startsWith('Image data') || error.message.startsWith('Unsupported image')) {
            throw new Error(error.message);
        }
        throw error;
    }
}

/**
 * Send a message with prompt caching for repeated context
 */
async function sendMessageWithCaching(personalityContext, memoryContext, userMessage) {
    try {
        const response = await client.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            system: [
                {
                    type: 'text',
                    text: personalityContext,
                    cache_control: { type: 'ephemeral' }
                },
                {
                    type: 'text',
                    text: memoryContext,
                    cache_control: { type: 'ephemeral' }
                }
            ],
            messages: [{
                role: 'user',
                content: userMessage
            }]
        });

        return {
            text: response.content[0].text,
            usage: response.usage
        };
    } catch (error) {
        console.error('Claude API error:', error);
        throw error;
    }
}

/**
 * Stream a response from Claude
 */
async function streamMessage(systemContext, userMessage, onChunk) {
    try {
        const stream = await client.messages.stream({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1000,
            system: systemContext,
            messages: [{
                role: 'user',
                content: userMessage
            }]
        });

        let fullResponse = '';

        for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                fullResponse += chunk.delta.text;
                if (onChunk) {
                    onChunk(chunk.delta.text);
                }
            }
        }

        return fullResponse;
    } catch (error) {
        console.error('Claude streaming error:', error);
        throw error;
    }
}

module.exports = {
    sendMessage,
    sendMessageWithCaching,
    streamMessage
};
