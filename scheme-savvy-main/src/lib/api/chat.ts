import { supabase } from '@/integrations/supabase/client';

export interface Source {
  name: string;
  type: 'document' | 'web';
  url: string;
}

export interface ChatResponse {
  content: string;
  sources: Source[];
  sourceLabel: string;
  newKnowledgeIndexed?: boolean;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendMessage(
  message: string,
  conversationHistory: Message[] = [],
  language: string = 'english'
): Promise<ChatResponse> {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: { message, conversationHistory, language }
  });

  if (error) {
    console.error('Chat API error:', error);
    throw new Error(error.message || 'Failed to get response');
  }

  return data as ChatResponse;
}

export interface IndexedDocument {
  id: string;
  title: string;
  source_url: string;
  source_type: 'pdf' | 'web';
  category: string;
  domain: string;
  created_at: string;
  updated_at: string;
  chunkCount: number;
}

export async function getDocuments(): Promise<IndexedDocument[]> {
  const { data, error } = await supabase.functions.invoke('documents', {
    method: 'GET'
  });

  if (error) {
    console.error('Documents API error:', error);
    throw new Error(error.message || 'Failed to fetch documents');
  }

  return data.documents || [];
}

export async function deleteDocument(documentId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('documents', {
    body: { documentId },
    method: 'DELETE'
  });

  if (error) {
    console.error('Delete document error:', error);
    throw new Error(error.message || 'Failed to delete document');
  }
}

import * as pdfjsLib from 'pdfjs-dist';

// Set worker to local public file to avoid CDN issues
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export async function uploadDocument(file: File): Promise<void> {
  try {
    // 1. Parse PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    if (!fullText.trim()) {
      throw new Error('No text content found in PDF');
    }

    // 2. Send to backend
    const { data, error } = await supabase.functions.invoke('ingest', {
      body: {
        action: 'ingest_text',
        title: file.name.replace('.pdf', ''),
        content: fullText,
        url: `file://${file.name}`,
        source_type: 'pdf'
      }
    });

    if (error) {
      console.error('Ingest error:', error);
      throw new Error(error.message || 'Failed to upload document');
    }

    if (data && !data.success) {
      throw new Error(data.message || 'Ingestion failed on backend');
    }
  } catch (error: any) {
    console.error('Upload processing error:', error);
    throw new Error(error.message || 'Failed to process document');
  }
}
