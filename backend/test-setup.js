// Test Script - Verify AI Brain Setup
require('dotenv').config();

async function testSetup() {
    console.log('🧪 Testing AI Brain Setup...\n');

    // Test 1: Environment Variables
    console.log('1️⃣ Checking environment variables...');
    const requiredEnvVars = [
        'DATABASE_URL',
        'ANTHROPIC_API_KEY',
        'OPENAI_API_KEY'
    ];

    let envOk = true;
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            console.log(`   ❌ Missing: ${envVar}`);
            envOk = false;
        } else {
            console.log(`   ✅ Found: ${envVar}`);
        }
    }

    if (!envOk) {
        console.log('\n⚠️  Please configure your .env file first!');
        console.log('   Copy .env.example to .env and add your API keys\n');
        return;
    }

    // Test 2: Database Connection
    console.log('\n2️⃣ Testing database connection...');
    try {
        const { pool } = require('./src/db/connection');
        const result = await pool.query('SELECT NOW()');
        console.log(`   ✅ Database connected! Server time: ${result.rows[0].now}`);
    } catch (error) {
        console.log('   ❌ Database connection failed:', error.message);
        return;
    }

    // Test 3: Check Tables
    console.log('\n3️⃣ Checking database tables...');
    try {
        const { query } = require('./src/db/connection');
        const tables = await query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log(`   ✅ Found ${tables.rows.length} tables:`);
        tables.rows.forEach(row => {
            console.log(`      - ${row.table_name}`);
        });
    } catch (error) {
        console.log('   ❌ Could not list tables:', error.message);
    }

    // Test 4: Check pgvector Extension
    console.log('\n4️⃣ Checking pgvector extension...');
    try {
        const { query } = require('./src/db/connection');
        const result = await query(`
            SELECT * FROM pg_extension WHERE extname = 'vector'
        `);

        if (result.rows.length > 0) {
            console.log('   ✅ pgvector extension installed');
        } else {
            console.log('   ❌ pgvector extension not found');
            console.log('      Run: CREATE EXTENSION vector;');
        }
    } catch (error) {
        console.log('   ❌ Error checking pgvector:', error.message);
    }

    // Test 5: Test OpenAI API
    console.log('\n5️⃣ Testing OpenAI API (embeddings)...');
    try {
        const { OpenAI } = require('openai');
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: 'test'
        });

        console.log(`   ✅ OpenAI API working! Embedding dimension: ${response.data[0].embedding.length}`);
    } catch (error) {
        console.log('   ❌ OpenAI API error:', error.message);
    }

    // Test 6: Test Anthropic API
    console.log('\n6️⃣ Testing Anthropic API (Claude)...');
    try {
        const Anthropic = require('@anthropic-ai/sdk');
        const client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });

        const message = await client.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 50,
            messages: [{
                role: 'user',
                content: 'Say "API test successful" and nothing else.'
            }]
        });

        console.log(`   ✅ Claude API working! Response: "${message.content[0].text}"`);
    } catch (error) {
        console.log('   ❌ Claude API error:', error.message);
    }

    // Test 7: Check Default User
    console.log('\n7️⃣ Checking default user...');
    try {
        const { query } = require('./src/db/connection');
        const result = await query(`
            SELECT user_id, username FROM users WHERE username = 'default_user'
        `);

        if (result.rows.length > 0) {
            console.log(`   ✅ Default user exists: ${result.rows[0].user_id}`);
        } else {
            console.log('   ⚠️  Default user not found (will be created on first run)');
        }
    } catch (error) {
        console.log('   ❌ Error checking users:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Setup test complete!');
    console.log('\nYou can now start the server with: npm run dev');
    console.log('='.repeat(60) + '\n');

    process.exit(0);
}

testSetup().catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});
