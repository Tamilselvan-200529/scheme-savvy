import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'GET') {
      // List all documents with chunk counts
      const { data: documents, error } = await supabase
        .from('knowledge_documents')
        .select(`
          id,
          title,
          source_url,
          source_type,
          category,
          domain,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Get chunk counts for each document
      const documentsWithCounts = await Promise.all(
        (documents || []).map(async (doc: any) => {
          const { count } = await supabase
            .from('knowledge_chunks')
            .select('id', { count: 'exact', head: true })
            .eq('document_id', doc.id);

          return {
            ...doc,
            chunkCount: count || 0
          };
        })
      );

      return new Response(
        JSON.stringify({ documents: documentsWithCounts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      const { documentId } = await req.json();

      if (!documentId) {
        return new Response(
          JSON.stringify({ error: 'Document ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Documents error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
