// OpenAI GPT Service - Handles interactions with OpenAI's GPT API
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Send a message to GPT-4 with context
 */
async function sendMessage(systemContext, userMessage, image = null) {
    try {
        const userContent = image
            ? [
                { type: 'image_url', image_url: { url: image.data || image.url } },
                { type: 'text', text: userMessage || 'What do you see in this image?' }
              ]
            : userMessage;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 1000,
            temperature: 0.9, // More creative and varied responses
            messages: [
                {
                    role: 'system',
                    content: systemContext
                },
                {
                    role: 'user',
                    content: userContent
                }
            ]
        });
        
        return response.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw error;
    }
}

/**
 * Stream a response from GPT-4
 */
async function streamMessage(systemContext, userMessage, onChunk) {
    try {
        const stream = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 1000,
            temperature: 0.9,
            stream: true,
            messages: [
                {
                    role: 'system',
                    content: systemContext
                },
                {
                    role: 'user',
                    content: userMessage
                }
            ]
        });
        
        let fullResponse = '';
        
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                fullResponse += content;
                if (onChunk) {
                    onChunk(content);
                }
            }
        }
        
        return fullResponse;
    } catch (error) {
        console.error('OpenAI streaming error:', error);
        throw error;
    }
}

module.exports = {
    sendMessage,
    streamMessage
};
