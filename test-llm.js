import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

// 加载 .env 文件
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const apiKey = process.env.VITE_DEEPSEEK_API_KEY;
const baseURL = process.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

console.log('Testing DeepSeek API...');
console.log('API Key configured:', !!apiKey);
console.log('Base URL:', baseURL);

if (!apiKey) {
  console.error('Error: VITE_DEEPSEEK_API_KEY is not set in .env file');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey,
  baseURL,
});

async function testConnection() {
  try {
    const start = Date.now();
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say 'Hello 2048' if you can hear me." }
      ],
      model: "deepseek-chat",
    });
    const end = Date.now();
    
    console.log('\n--- API Response ---');
    console.log(completion.choices[0].message.content);
    console.log('--------------------');
    console.log(`Latency: ${end - start}ms`);
    console.log('Status: SUCCESS ✅');
  } catch (error) {
    console.error('\n--- API Error ---');
    console.error(error);
    console.error('-----------------');
    console.log('Status: FAILED ❌');
  }
}

testConnection();
