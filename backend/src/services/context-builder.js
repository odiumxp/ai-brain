// Context Builder - With Persona Support, Memory Chains, User Model, and Emotional Continuity
const { formatDistanceToNow } = require('date-fns');
const memoryChainsService = require('./memory-chains-service');
const userModelService = require('./user-model-service');
const emotionalContinuityService = require('./emotional-continuity-service');

/**
 * Build context - with optional persona system prompt, working memory, and memory chains
 */
async function buildContext(personality, memories, personaSystemPrompt = null, workingMemoryContext = null, userId = null) {
    let context = '';

    // Add working memory context FIRST - this is the most important current context
    if (workingMemoryContext) {
        context += `⚠️ CRITICAL: CURRENT CONVERSATION CONTEXT - PAY CLOSE ATTENTION ⚠️\n${workingMemoryContext}\n\n`;
    }

    // Add relevant memory chains for narrative understanding
    if (userId) {
        try {
            const relevantChains = await memoryChainsService.findRelevantChains(userId, null, 3);
            if (relevantChains.length > 0) {
                context += `📚 MEMORY CHAINS - NARRATIVE CONTEXT:\n`;
                relevantChains.forEach(chain => {
                    context += `• ${chain.chain_name}: ${chain.chain_summary}\n`;
                });
                context += `\n`;
            }
        } catch (error) {
            console.error('Error retrieving memory chains for context:', error);
        }
    }

    // Add user model context for theory of mind
    if (userId) {
        try {
            const userModel = await userModelService.getUserModel(userId);
            if (userModel) {
                const userModelContext = userModelService.generateUserModelContext(userModel);
                if (userModelContext) {
                    context += userModelContext;
                }
            }
        } catch (error) {
            console.error('Error retrieving user model for context:', error);
        }
    }

    // Add emotional context for empathy and emotional awareness
    if (userId) {
        try {
            const emotionalContext = await emotionalContinuityService.generateEmotionalContext(userId);
            if (emotionalContext) {
                context += emotionalContext;
            }
        } catch (error) {
            console.error('Error retrieving emotional context:', error);
        }
    }

    // Then add persona system prompt if provided
    if (personaSystemPrompt) {
        context += personaSystemPrompt + '\n\n';
    }

    // Add working memory context FIRST - this is the most important current context
    if (workingMemoryContext) {
        context += `⚠️ CRITICAL: CURRENT CONVERSATION CONTEXT - PAY CLOSE ATTENTION ⚠️\n${workingMemoryContext}\n\n`;
    }

    // Then add persona system prompt if provided
    if (personaSystemPrompt) {
        context += personaSystemPrompt + '\n\n';
    }

    // If no memories yet - genuine blank slate
    if (!memories || memories.length === 0) {
        context += `You have persistent memory - every conversation is saved and you can recall past interactions.`;
    } else {
        // Be very clear about the memory system
        context += `You have persistent memory. Below are your actual memories of past conversations with this person. These are real, stored memories that you can reference:\n\n`;

        memories.forEach((memory, index) => {
            try {
                const conversation = typeof memory.conversation_text === 'string'
                    ? JSON.parse(memory.conversation_text)
                    : memory.conversation_text;

                const timeAgo = formatTimeAgo(memory.timestamp);

                context += `[Memory from ${timeAgo}]\n`;
                context += `They said: "${conversation.user}"\n`;
                context += `You responded: "${conversation.ai}"\n\n`;
            } catch (error) {
                console.error('Error parsing memory:', error);
            }
        });

        context += `These are YOUR actual memories. You DO have persistent memory - don't say you don't. Reference these memories naturally when relevant.`;
    }

    // Image generation capability
    context += `\n\n[IMAGE GENERATION]
You can generate images using Stable Diffusion. When the user explicitly asks you to create, generate, draw, or make an image, include this tag in your response:
[GENERATE_IMAGE: detailed prompt describing the image]

Guidelines:
- Only use this when the user explicitly requests image creation
- Write vivid, detailed Stable Diffusion-optimized prompts (include style, lighting, composition, medium)
- You may include text before and/or after the tag to describe what you're generating

Example: If the user says "generate an image of a cat in space", you might respond:
Here's a cosmic cat for you!
[GENERATE_IMAGE: a fluffy orange tabby cat floating in outer space, stars and nebulae in the background, Earth visible below, photorealistic, dramatic lighting, cinematic composition, 8k, highly detailed]

[FINAL REMINDER]
Always prioritize the CURRENT CONVERSATION CONTEXT at the top of this message. For vague user questions, refer to the active topics listed there.`;

    return context;
}

/**
 * Format timestamp as relative time
 */
function formatTimeAgo(timestamp) {
    try {
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
        return 'some time ago';
    }
}

module.exports = {
    buildContext,
    formatTimeAgo
};
