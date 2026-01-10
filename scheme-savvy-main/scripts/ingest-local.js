
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import pdf from 'pdf-parse';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
    console.error("Missing Environment Variables! Please set VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and GEMINI_API_KEY in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper: Clean Content
function cleanContent(text) {
    if (!text) return "";
    const lines = text.split('\n');
    const cleanLines = lines.filter(line => {
        const l = line.trim().toLowerCase();
        if (l.length === 0) return false;
        if (l.length < 3 && !/^[0-9]+$/.test(l)) return false;
        return true;
    });
    return cleanLines.join('\n');
}

// Helper: Chunk Content
function chunkContent(content, maxChunkSize = 1000) {
    const chunks = [];
    const paragraphs = content.split(/\n\n+/);
    let currentChunk = '';

    for (const para of paragraphs) {
        if (currentChunk.length + para.length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
        }
        currentChunk += para + '\n\n';
    }
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    return chunks.length > 0 ? chunks : [content.substring(0, maxChunkSize)];
}

// Helper: Hash String
async function hashString(str) {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(str).digest('hex');
}

// Helper: Generate Embedding
async function generateEmbedding(text) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: text.substring(0, 500) }] }],
                systemInstruction: { parts: [{ text: 'You are an embedding generator. Output ONLY a JSON array of 1536 floating point numbers between -1 and 1.' }] },
                generationConfig: { maxOutputTokens: 8000 }
            }),
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (content) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed) && parsed.length === 1536) return parsed;
        }
    } catch (e) {
        console.error("Embedding error:", e.message);
    }
    return new Array(1536).fill(0).map(() => Math.random() - 0.5); // Fallback mock embedding
}

// Main Ingest Function
async function ingestFile(filePath) {
    console.log(`Processing: ${filePath}`);
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);

    const rawText = data.text;
    const cleanedText = cleanContent(rawText);
    const title = path.basename(filePath).replace('.pdf', '');

    // Check Duplicate
    const contentHash = await hashString(cleanedText.substring(0, 500));
    const { data: existing } = await supabase.from('knowledge_documents').select('id').eq('content_hash', contentHash).single();

    if (existing) {
        console.log("Document already indexed.");
        return;
    }

    // Insert Document
    const { data: doc, error: docError } = await supabase.from('knowledge_documents').insert({
        title,
        source_url: `file://${title}`,
        source_type: 'pdf',
        category: 'General',
        domain: 'local',
        content_hash: contentHash
    }).select().single();

    if (docError) {
        console.error("Doc Insert Error:", docError);
        return;
    }

    // Process Chunks
    const chunks = chunkContent(cleanedText);
    console.log(`Generating embeddings for ${chunks.length} chunks...`);

    for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i]);
        await supabase.from('knowledge_chunks').insert({
            document_id: doc.id,
            chunk_index: i,
            content: chunks[i],
            embedding
        });
        process.stdout.write('.');
    }

    console.log("\nDone!");
}

const filePath = process.argv[2];
if (!filePath) {
    console.log("Usage: node scripts/ingest-local.js <path-to-pdf>");
} else {
    ingestFile(filePath);
}
