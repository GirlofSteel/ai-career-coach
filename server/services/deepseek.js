import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
});

// Verify API key on load
console.log('🔑 DeepSeek API Key:', process.env.DEEPSEEK_API_KEY
  ? `sk-${process.env.DEEPSEEK_API_KEY.slice(-8)}... configured`
  : '❌ NOT FOUND');

/**
 * Call DeepSeek chat completion
 * @param {Array} messages - Chat messages array
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - Response content
 */
export async function chat(messages, options = {}) {
  try {
    const model = options.model || 'deepseek-chat';
    const maxTokens = options.maxTokens || 4096;

    console.log(`🤖 Calling ${model} | max_tokens=${maxTokens} | msg_count=${messages.length}`);

    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: maxTokens,
      stream: false,
    });

    const content = response.choices[0].message.content;
    console.log(`✅ Response received | length=${content.length} chars | finish_reason=${response.choices[0].finish_reason}`);

    return content;
  } catch (error) {
    console.error('❌ DeepSeek API Error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', JSON.stringify(error.response.data));
    }
    throw new Error(`AI 调用失败: ${error.message}`);
  }
}

/**
 * Call DeepSeek with structured JSON output prompt
 * Automatically retries once with higher tokens if response is truncated
 */
export async function chatJSON(systemPrompt, userPrompt, options = {}) {
  const fullPrompt = `${systemPrompt}\n\n【重要】请严格按照JSON格式输出，不要添加任何额外的解释文字。`;
  const maxTokens = options.maxTokens || 16384;

  const response = await chat([
    { role: 'system', content: fullPrompt },
    { role: 'user', content: userPrompt },
  ], { temperature: 0.3, maxTokens });

  // Try to extract JSON from response
  let jsonStr = null;

  // First try: markdown code block
  const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  }

  // Second try: find the outermost JSON object
  if (!jsonStr) {
    const firstBrace = response.indexOf('{');
    if (firstBrace !== -1) {
      // Find matching closing brace
      let depth = 0;
      let end = -1;
      for (let i = firstBrace; i < response.length; i++) {
        if (response[i] === '{') depth++;
        if (response[i] === '}') depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
      if (end > 0) {
        jsonStr = response.substring(firstBrace, end);
      }
    }
  }

  if (!jsonStr) {
    // Log partial response for debugging
    console.error('❌ Could not extract JSON. Response preview:');
    console.error('  First 300 chars:', response.substring(0, 300));
    console.error('  Last 300 chars:', response.substring(Math.max(0, response.length - 300)));
    throw new Error('AI 返回格式异常，无法提取JSON。请重试。');
  }

  try {
    return JSON.parse(jsonStr);
  } catch (parseError) {
    // Log the problematic JSON string
    console.error('❌ JSON parse failed:', parseError.message);
    console.error('  JSON preview (first 500):', jsonStr.substring(0, 500));
    console.error('  JSON preview (last 500):', jsonStr.substring(Math.max(0, jsonStr.length - 500)));

    // Try to fix common issues: trailing commas, unquoted keys, etc.
    try {
      const cleaned = jsonStr
        .replace(/,\s*}/g, '}')       // Remove trailing commas in objects
        .replace(/,\s*\]/g, ']')       // Remove trailing commas in arrays
        .replace(/“/g, '"')            // Fix Chinese quotes
        .replace(/”/g, '"');
      return JSON.parse(cleaned);
    } catch (retryError) {
      throw new Error(`JSON解析失败: ${parseError.message}。请重试。`);
    }
  }
}

export default { chat, chatJSON };
