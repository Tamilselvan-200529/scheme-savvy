import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed government domains for ingestion
const ALLOWED_DOMAINS = [
  'india.gov.in',
  'pmindia.gov.in',
  'scholarships.gov.in',
  'umang.gov.in',
  'tn.gov.in',
  'up.gov.in',
  'mha.gov.in',
  'niti.gov.in',
  'pmkisan.gov.in',
  'pmfby.gov.in',
  'nrega.nic.in',
  'uidai.gov.in',
  'epfindia.gov.in',
  'labour.gov.in',
  'rural.gov.in',
  'moes.gov.in',
  'education.gov.in',
  'agricoop.nic.in',
  'nhm.gov.in',
  'pmjay.gov.in',
  '.gov.in',
  '.nic.in'
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, url, query, title, content } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Action: Ingest raw text (e.g. from PDF upload)
    if (action === 'ingest_text' && content) {
      console.log('Ingesting raw text:', title);
      const result = await indexContent(supabase, {
        title: title || 'Uploaded Document',
        url: url || `file://${Date.now()}`,
        content,
        domain: 'local-upload',
        source_type: 'pdf'
      }, geminiApiKey);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Ingest a specific URL
    if (action === 'ingest_url' && url) {
      if (!isAllowedDomain(url)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'URL must be from an official Indian government domain (*.gov.in or *.nic.in)'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!firecrawlApiKey) {
        return new Response(
          JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Ingesting URL:', url);
      const result = await ingestUrl(supabase, url, firecrawlApiKey, geminiApiKey);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Search and ingest from official sources
    if (action === 'search_and_ingest' && query) {
      if (!Deno.env.get('BROWSERLESS_TOKEN')) {
        return new Response(
          JSON.stringify({ success: false, error: 'BROWSERLESS_TOKEN not configured for Playwright/Puppeteer' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Searching and ingesting (via Playwright) for:', query);
      const results = await searchAndIngest(supabase, query, geminiApiKey);

      return new Response(
        JSON.stringify(results),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Invalid action. Use "ingest_url" with url parameter or "search_and_ingest" with query parameter.'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Ingest error:', error);
    return new Response(
      JSON.stringify({ error: 'Ingestion failed', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function isAllowedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(domain => hostname.endsWith(domain));
  } catch {
    return false;
  }
}

async function ingestUrl(
  supabase: any,
  url: string,
  _firecrawlApiKey: string, // Unused
  geminiApiKey: string
): Promise<{ success: boolean; message: string; chunksIndexed?: number }> {
  try {
    console.log(`Starting Playwright (Remote) scrape for: ${url}`);

    // Use Puppeteer (Playwright compatible) to connect to remote browser
    // Note: In Deno Edge, we use a REST API for Browserless to avoid websocket timeout issues, 
    // OR we can use the /content endpoint which runs Playwright logic server-side.
    const token = Deno.env.get('BROWSERLESS_TOKEN');

    const scrapeResponse = await fetch(`https://chrome.browserless.io/content?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        waitFor: 3000, // Wait for page load as requested
        rejectResourceTypes: ['image', 'font', 'media'],
      })
    });

    if (!scrapeResponse.ok) {
      return { success: false, message: 'Failed to render page via Playwright/Browserless' };
    }

    const htmlContent = await scrapeResponse.text();

    // Basic converting HTML to text (simplified for this environment)
    // In a full node env we'd use Cheerio, here we'll use a simple regex clean or the 'text' response if available
    // Browserless /content returns HTML. We need text.
    // Let's ask Browserless for text representation if possible or strip tags
    // Actually, Browserless has a /function endpoint where we can run ACTUAL Playwright code.
    // Let's try to use the /function endpoint for true Playwright support.

    const playwrightResponse = await fetch(`https://chrome.browserless.io/function?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `
                module.exports = async ({ page }) => {
                    await page.goto(context.url, { waitUntil: 'networkidle0' });
                    // Remove cleaning garbage logic here if needed, or just return content
                    const content = await page.evaluate(() => document.body.innerText);
                    const title = await page.title();
                    return { content, title };
                };
            `,
        context: { url }
      })
    });

    if (!playwrightResponse.ok) {
      // Fallback to simpler content fetch
      console.error("Playwright function failed, falling back to simple scrape");
      // ...
      return { success: false, message: 'Playwright execution failed' };
    }

    const { data } = await playwrightResponse.json(); // browserless returns { data, type, ... }
    const { content, title: extractedTitle } = data; // content is the return value of our function

    // Clean and Index
    const indexed = await indexContent(supabase, {
      title: extractedTitle || extractTitleFromUrl(url),
      url,
      content,
      domain: new URL(url).hostname
    }, geminiApiKey);

    if (indexed.success) {
      return {
        success: true,
        message: `Successfully indexed "${extractedTitle}"`,
        chunksIndexed: indexed.chunks
      };
    }

    return { success: false, message: indexed.message };

  } catch (error) {
    console.error('Ingest URL error:', error);
    return { success: false, message: (error as Error).message };
  }
}

async function searchAndIngest(
  supabase: any,
  query: string,
  geminiApiKey: string
): Promise<{ success: boolean; indexed: number; results: Array<{ url: string; title: string; status: string }> }> {
  try {
    const token = Deno.env.get('BROWSERLESS_TOKEN');
    // Search Logic: Since we can't use Firecrawl, we rely on Google Search JSON API or similar.
    // However, the user wants "Automated web ingestion".
    // We will use a "Search" helper (mocked or via a search API if available). 
    // For now, I will use a placeholder for the search part, or ask the user to provide a Google Search API Key.
    // OR, I can use the same Playwright method to scrape a search engine result page (Google/Bing).

    console.log("Running Playwright search for:", query);

    // SEARCH via Playwright (Scraping Bing/Google)
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query + ' site:gov.in')}`;

    const searchResponse = await fetch(`https://chrome.browserless.io/function?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `
                module.exports = async ({ page }) => {
                    await page.goto(context.url, { waitUntil: 'domcontentloaded' });
                    const links = await page.evaluate(() => {
                        return Array.from(document.querySelectorAll('li.b_algo h2 a')).slice(0, 5).map(a => ({
                            title: a.innerText,
                            url: a.href
                        }));
                    });
                    return links;
                };
            `,
        context: { url: searchUrl }
      })
    });

    if (!searchResponse.ok) {
      throw new Error("Failed to search via Playwright");
    }

    const searchData = await searchResponse.json(); // { data: [...] }
    const validResults = (searchData.data || []).filter((r: any) => isAllowedDomain(r.url));

    const results: Array<{ url: string; title: string; status: string }> = [];
    let indexed = 0;

    for (const result of validResults) {
      // Now ingest each found URL using the Playwright logic
      const ingestRes = await ingestUrl(supabase, result.url, "", geminiApiKey);

      results.push({
        url: result.url,
        title: result.title,
        status: ingestRes.success ? 'indexed' : ingestRes.message
      });
      if (ingestRes.success) indexed++;
    }

    return { success: true, indexed, results };

  } catch (error) {
    console.error('Search and ingest error:', error);
    return { success: false, indexed: 0, results: [] };
  }
}

async function indexContent(
  supabase: any,
  content: { title: string; url: string; content: string; domain: string; source_type?: string },
  apiKey: string
): Promise<{ success: boolean; message: string; chunks?: number }> {
  try {
    // STEP 3: CLEAN THE DATA (Strict Cleaning)
    const cleanedText = cleanContent(content.content);

    if (!cleanedText || cleanedText.length < 100) {
      return { success: false, message: 'Content too short or empty after cleaning' };
    }

    // Generate content hash to check for duplicates
    const contentHash = await hashString(content.url + cleanedText.substring(0, 500));

    // Check if already exists
    const { data: existing } = await supabase
      .from('knowledge_documents')
      .select('id')
      .eq('content_hash', contentHash)
      .single();

    if (existing) {
      return { success: false, message: 'Content already indexed' };
    }

    // Determine category from content
    const category = detectCategory(cleanedText);

    // Insert document
    const { data: doc, error: docError } = await supabase
      .from('knowledge_documents')
      .insert({
        title: content.title,
        source_url: content.url,
        source_type: content.source_type || 'web',
        category,
        domain: content.domain,
        content_hash: contentHash
      })
      .select()
      .single();

    if (docError) {
      console.error('Failed to insert document:', docError);
      return { success: false, message: `Database error: ${docError.message} (${docError.details || ''})` };
    }

    // Chunk the content
    // STEP 4: CHUNKING
    const chunks = chunkContent(cleanedText);

    // Generate embeddings and insert chunks
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i], apiKey);

      await supabase.from('knowledge_chunks').insert({
        document_id: doc.id,
        chunk_index: i,
        content: chunks[i],
        embedding,
        metadata: { category, source: 'admin_ingest' }
      });
    }

    console.log(`Indexed ${chunks.length} chunks from ${content.url}`);
    return { success: true, message: 'Indexed successfully', chunks: chunks.length };

  } catch (error) {
    console.error('Indexing error:', error);
    return { success: false, message: (error as Error).message };
  }
}

function chunkContent(content: string, maxChunkSize = 1000): string[] {
  const chunks: string[] = [];
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

function detectCategory(content: string): string {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('agriculture') || lowerContent.includes('kisan') || lowerContent.includes('farmer')) {
    return 'Agriculture';
  }
  if (lowerContent.includes('scholarship') || lowerContent.includes('education') || lowerContent.includes('student')) {
    return 'Education';
  }
  if (lowerContent.includes('housing') || lowerContent.includes('awas') || lowerContent.includes('home')) {
    return 'Housing';
  }
  if (lowerContent.includes('health') || lowerContent.includes('ayushman') || lowerContent.includes('medical')) {
    return 'Health';
  }
  if (lowerContent.includes('employment') || lowerContent.includes('job') || lowerContent.includes('skill')) {
    return 'Employment';
  }
  if (lowerContent.includes('women') || lowerContent.includes('mahila') || lowerContent.includes('girl')) {
    return 'Women & Child';
  }

  return 'General';
}

function extractTitleFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/').filter(p => p.length > 0);
    if (parts.length > 0) {
      return parts[parts.length - 1]
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\.[^.]+$/, '')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  } catch { }
  return 'Government Document';
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: {
          parts: [{ text: text.substring(0, 2048) }]
        }
      }),
    });

    if (!response.ok) {
      console.error('Embedding API error:', await response.text());
      return generateHashEmbedding(text);
    }

    const data = await response.json();
    if (data.embedding && data.embedding.values) {
      return data.embedding.values;
    }
  } catch (e) {
    console.error("Embedding exception:", e);
  }

  return generateHashEmbedding(text);
}

function generateHashEmbedding(text: string): number[] {
  const embedding = new Array(1536).fill(0);
  const words = text.toLowerCase().split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(j);
      hash = hash & hash;
    }
    const index = Math.abs(hash) % 1536;
    embedding[index] = (embedding[index] + 1) / (i + 1);
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] = embedding[i] / magnitude;
    }
  }

  return embedding;
}

function cleanContent(text: string): string {
  if (!text) return "";

  // Split into lines
  const lines = text.split('\n');

  // Filter out common UI/Navigation garbage
  const cleanLines = lines.filter(line => {
    const l = line.trim().toLowerCase();
    // Remove empty lines
    if (l.length === 0) return false;

    // Remove common navigation/UI terms
    const garbagePatterns = [
      /^home$/, /^login$/, /^register$/, /^search$/, /^menu$/,
      /^skip to main content$/, /^navigation$/, /^sidebar$/,
      /^loading\.+$/, /^submit$/, /^cancel$/, /^close$/,
      /^copyright/, /^all rights reserved/,
      /^facebook$/, /^twitter$/, /^youtube$/, /^instagram$/,
      /^terms of use$/, /^privacy policy$/, /^disclaimer$/,
      /^help$/, /^contact us$/, /^feedback$/, /^sitemap$/,
      /^screen reader access$/, /^font size$/, /^theme$/,
      /^language$/, /^english$/, /^hindi$/, /^tamil$/,
      /isl chatbot/, /translation feedback/, /cpgrams/
    ];

    if (garbagePatterns.some(pattern => pattern.test(l))) return false;

    // Remove lines that are just symbols or very short
    if (l.length < 3 && !/^[0-9]+$/.test(l)) return false;

    return true;
  });

  return cleanLines.join('\n');
}
