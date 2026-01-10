import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], language = 'english' } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const groqApiKey = Deno.env.get('GROQ_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);


    // Fetch KB Stats
    const { count: docCount } = await supabase.from('knowledge_documents').select('*', { count: 'exact', head: true });
    const { count: chunkCount } = await supabase.from('knowledge_chunks').select('*', { count: 'exact', head: true });
    const { count: webCount } = await supabase.from('knowledge_documents').select('*', { count: 'exact', head: true }).eq('source_type', 'web');

    const kbStats = {
      docs: docCount || 0,
      chunks: chunkCount || 0,
      web: webCount || 0
    };

    console.log('KB Stats:', kbStats);

    // Initial Search
    let ragContext = '';
    let sources: Array<{ name: string; type: 'document' | 'web'; url: string }> = [];
    let sourceLabel = '';

    // Helper to perform search
    const performSearch = async () => {
      const searchTerms = extractSearchTerms(message);
      // High context mode: Fetch 5 chunks
      const { data: textResults } = await supabase
        .from('knowledge_chunks')
        .select(`
          id, content, metadata, document_id,
          knowledge_documents!inner (title, source_url, source_type, category)
        `)
        .or(searchTerms.map(term => `content.ilike.%${term}%`).join(','))
        .limit(5); // Increased for better context

      if (textResults && textResults.length > 0) return textResults;

      const category = detectCategory(message);
      if (category) {
        const { data: catResults } = await supabase
          .from('knowledge_chunks')
          .select(`
            id, content, metadata, document_id,
            knowledge_documents!inner (title, source_url, source_type, category)
          `)
          .eq('knowledge_documents.category', category)
          .limit(3); // Increased backup context using category
        if (catResults && catResults.length > 0) return catResults;
      }
      return [];
    };

    let results = await performSearch();

    // AUTO-INGESTION FALLBACK
    // If no results and this looks like a scheme query, try to ingest from web
    if (results.length === 0 && message.length > 5) {
      console.log('No local results. Triggering auto-ingestion for:', message);

      try {
        // Trigger ingest function
        await supabase.functions.invoke('ingest', {
          body: { action: 'search_and_ingest', query: message }
        });

        // Re-run search after ingestion
        console.log('Ingestion complete. Re-running search...');
        results = await performSearch();

        // Update stats
        const { count: newWebCount } = await supabase.from('knowledge_documents').select('*', { count: 'exact', head: true }).eq('source_type', 'web');
        const { count: newChunkCount } = await supabase.from('knowledge_chunks').select('*', { count: 'exact', head: true });
        kbStats.web = newWebCount || kbStats.web;
        kbStats.chunks = newChunkCount || kbStats.chunks;

      } catch (ingestError) {
        console.error('Auto-ingestion failed:', ingestError);
      }
    }

    let isRelevant = false;

    if (results.length > 0) {
      // 1. Check Relevance
      const queryCategory = detectCategory(message);
      const searchTerms = extractSearchTerms(message);

      isRelevant = results.some((r: any) => {
        const docCat = r.knowledge_documents?.category?.toLowerCase();
        const content = r.content.toLowerCase();

        // Strict relevance check: match category OR contain at least one search term
        const matchesCategory = queryCategory && docCat === queryCategory.toLowerCase();
        const matchesContent = searchTerms.some(term => content.includes(term));

        return matchesCategory || matchesContent;
      });

      if (isRelevant) {
        const rawContext = results.map((r: any) => cleanContent(r.content)).join('\n\n---\n\n');
        // Relaxed truncation: ~6000 tokens (25000 chars) for high-quality answers
        ragContext = rawContext.length > 25000 ? rawContext.substring(0, 25000) + "...[truncated]" : rawContext;

        sources = results.map((r: any) => ({
          name: (r.knowledge_documents as any)?.title || 'Government Document',
          type: ((r.knowledge_documents as any)?.source_type || 'document') as 'document' | 'web',
          url: (r.knowledge_documents as any)?.source_url || ''
        }));
        sources = [...new Map(sources.map(s => [s.url, s])).values()];
      } else {
        ragContext = ''; // Clear context if not relevant
      }
    }

    // 2. Fix UI Source Label
    if (language === 'tamil') {
      sourceLabel = results.length > 0 && isRelevant
        ? 'சரிபார்க்கப்பட்ட அரசு ஆவணங்களின் அடிப்படையில்'
        : 'சம்பந்தப்பட்ட சரிபார்க்கப்பட்ட அரசு ஆவணங்கள் எதுவும் இல்லை';
    } else if (language === 'hindi') {
      sourceLabel = results.length > 0 && isRelevant
        ? 'सत्यापित सरकारी दस्तावेजों के आधार पर'
        : 'कोई प्रासंगिक सत्यापित सरकारी दस्तावेज नहीं मिले';
    } else {
      sourceLabel = results.length > 0 && isRelevant
        ? 'Based on verified government documents'
        : 'No relevant verified government documents found';
    }

    // Generate response with robust fallback
    const systemPrompt = buildSystemPrompt(ragContext, sources.length > 0, kbStats, language);

    // API Key Rotation Logic
    const apiKeys = [
      Deno.env.get('GROQ_API_KEY'),
      Deno.env.get('GROQ_API_KEY_2'),
      Deno.env.get('GROQ_API_KEY_3')
    ].filter(Boolean) as string[];

    // Model Fallback Logic
    // If 70b hits limit, try 8b (it has separate quotas)
    const modelsToTry = [
      (Deno.env.get('GROQ_MODEL') || 'llama-3.3-70b-versatile'),
      'llama-3.1-8b-instant'
    ];

    let response: string | null = null;
    let lastError: any = null;

    if (apiKeys.length === 0) {
      throw new Error("GROQ_API_KEY is not set in Supabase Secrets");
    }

    // Double Loop: Iterate over Models -> Then Keys
    outerLoop:
    for (const model of modelsToTry) {
      for (const key of apiKeys) {
        try {
          console.log(`Attempting generation with Model: ${model}, Key: ...${key.slice(-4)}`);
          response = await generateResponse(systemPrompt, message, conversationHistory, key, model);

          // If successful and we had to fallback to 8b, append a small notice (optional, but good for debugging)
          if (model === 'llama-3.1-8b-instant') {
            console.log("Fallback to 8b model successful");
          }
          break outerLoop; // Success! Exit both loops
        } catch (error: any) {
          console.error(`Failed (Model: ${model}, Key: ...${key.slice(-4)}):`, error.message);
          lastError = error;

          const errMsg = error.message || '';
          // If Rate Limit or Overloaded, continue to next key/model
          if (errMsg.includes("429") || errMsg.includes("rate limit") || errMsg.includes("quota") || errMsg.includes("overloaded")) {
            continue;
          }
          // For other errors (like 400 Bad Request), we might still want to try 8b just in case it's a model specific issue? 
          // Let's continue to be safe.
          continue;
        }
      }
    }

    // If we exhausted all Models AND all Keys
    if (!response) {
      console.error('All API keys and Models exhausted.');

      // Update source label to reflect error
      sourceLabel = "System Error (Response could not be generated)";

      const errorMessage = lastError?.message || 'Unknown error';
      if (errorMessage.includes("429")) {
        response = "Rate Limit Exceeded: All available keys and models are currently busy. Please try again in 1 hour.";
      } else if (errorMessage.includes("GROQ_API_KEY")) {
        response = "System Configuration Error: GROQ_API_KEY is missing.";
      } else {
        response = `I encountered an internal error while generating the response. (Details: ${errorMessage})`;
      }
    }

    return new Response(
      JSON.stringify({
        content: response,
        sources,
        sourceLabel,
        newKnowledgeIndexed: false // We don't track this granularly here anymore
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({
        content: "I apologize, but I encountered an error. Please try again.",
        sources: [],
        sourceLabel: 'Error occurred'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper to extract search terms
function extractSearchTerms(query: string): string[] {
  // Remove common stop words (English + common Indian Romanized)
  const stopWords = ['the', 'a', 'an', 'in', 'on', 'at', 'for', 'to', 'of', 'and', 'with', 'about', 'is', 'are', 'was', 'were', 'scheme', 'yojana', 'program', 'portal', 'ka', 'ki', 'ke', 'aur', 'hai', 'oru', 'ipadi'];

  return query
    .toLowerCase()
    // Using simple truncate to remove special chars but KEEP Unicode (Tamil, Hindi, etc.)
    // \p{L} matches any unicode letter, \p{N} any number. 
    // If environment doesn't support /u, we fallback to a simpler negation.
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
}

// Helper to detect category
function detectCategory(query: string): string | null {
  const q = query.toLowerCase();

  if (q.includes('agriculture') || q.includes('farmer') || q.includes('kisan')) return 'Agriculture';
  if (q.includes('scholarship') || q.includes('education') || q.includes('student')) return 'Education';
  if (q.includes('housing') || q.includes('home') || q.includes('awas')) return 'Housing';
  if (q.includes('health') || q.includes('medical') || q.includes('ayushman') || q.includes('maruthuvam')) return 'Health';
  if (q.includes('job') || q.includes('employment') || q.includes('skill') || q.includes('velai')) return 'Employment';
  if (q.includes('women') || q.includes('girl') || q.includes('mahila') || q.includes('pengal')) return 'Women & Child';

  return null;
}

function buildSystemPrompt(ragContext: string, hasContext: boolean, stats: { docs: number, chunks: number, web: number }, language: string): string {
  // FALLBACK LOGIC: If no context, allow general knowledge BUT with strict warning.
  const contextInstruction = hasContext
    ? `CONTEXT:\n${ragContext}`
    : `CONTEXT: NO DOCUMENTED KNOWLEDGE FOUND.
       IMPORTANT: You are now in "GENERAL KNOWLEDGE FALLBACK MODE".
       - You MAY use your internal training data to answer.
       - You MUST qualify your answer saying "General Information (Not from verified PDF)".`;

  let langInstruction = "- Output Language: English (Formal)";
  let outputFormat = `
Scheme Name:
Purpose:
Eligibility:
Benefits:
How to Apply:
Official Government Source: (If known, else say "Refer official portal")
  `;

  let disclaimer = `"Information is based on general knowledge. Please verify with official documents."`;

  if (language === 'tamil') {
    langInstruction = "- Output Language: Tamil (தமிழ்).";
    outputFormat = `
திட்டத்தின் பெயர்:
நோக்கம்:
தகுதி:
நன்மைகள்:
விண்ணப்பிக்கும் முறை:
அதிகாரப்பூர்வ அரசு ஆதாரம்: (தெரிந்தால், இல்லையெனில் "அதிகாரப்பூர்வ இணையதளத்தைப் பார்க்கவும்" என்று கூறவும்)
    `;
    disclaimer = `"தகவல்கள் பொது அறிவு அடிப்படையிலானவை. தயவுசெய்து அதிகாரப்பூர்வ ஆவணங்களை சரிபார்க்கவும்."`;
  } else if (language === 'hindi') {
    langInstruction = "- Output Language: Hindi (हिंदी). Use clear Devanagari script.";
    outputFormat = `
योजना का नाम:
उद्देश्य:
पात्रता:
लाभ:
आवेदन कैसे करें:
आधिकारिक सरकारी स्रोत: (यदि ज्ञात हो, अन्यथा कहें "आधिकारिक पोर्टल देखें")
    `;
    disclaimer = `"जानकारी सामान्य ज्ञान पर आधारित है। कृपया आधिकारिक दस्तावेजों से सत्यापित करें।"`;
  }

  return `You are “Scheme Savvy”, a Government Scheme Assistant.

YOUR CORE RULE:
1. IF context is present, use it strictly.
2. IF context is empty, use your general knowledge to help the user, but explicitly state it is general info.

DATA SOURCE POLICY:
Prioritize: india.gov.in, pmindia.gov.in, scholarships.gov.in.

BEHAVIOR RULES:
1. Do NOT hallucinate.
2. ${langInstruction}

OUTPUT FORMAT (MANDATORY):
${outputFormat}

DISCLAIMER (MANDATORY – ALWAYS ADD):
${disclaimer}

${contextInstruction}`;
}

async function generateResponse(
  systemPrompt: string,
  userMessage: string,
  history: Message[],
  apiKey: string
): Promise<string> {

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-4),
    { role: 'user', content: userMessage }
  ];

  // Use configured model or fallback to high-quality model
  const model = Deno.env.get('GROQ_MODEL') || 'llama-3.3-70b-versatile';
  console.log('Using Groq Model:', model);

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages,
      temperature: 0.1,
      max_tokens: 512
    })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return data.choices[0].message.content;
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
