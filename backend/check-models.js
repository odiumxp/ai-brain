// Quick script to check available SD models
const SD_API_URL = 'http://localhost:7860';

async function checkModels() {
    try {
        console.log('🔍 Checking available models...\n');
        
        const response = await fetch(`${SD_API_URL}/sdapi/v1/sd-models`);
        
        if (!response.ok) {
            console.error('❌ Failed to connect to Stable Diffusion');
            console.error('   Make sure SD Forge is running on port 7860');
            return;
        }
        
        const models = await response.json();
        
        console.log(`✅ Found ${models.length} models:\n`);
        
        models.forEach((model, index) => {
            console.log(`${index + 1}. ${model.title || model.model_name}`);
            if (model.filename) {
                console.log(`   File: ${model.filename}`);
            }
            console.log('');
        });
        
        console.log('\n💡 Copy the exact model names above and update them in:');
        console.log('   backend/src/services/sd-service.js');
        console.log('   in the MODELS object');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('   Make sure Stable Diffusion Forge is running');
    }
}

checkModels();
