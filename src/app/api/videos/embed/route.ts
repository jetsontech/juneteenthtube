import { NextRequest, NextResponse } from 'next/server';
import { pipeline } from '@xenova/transformers';
import { createClient } from '@supabase/supabase-js';

// Initialize a singleton pipeline for feature extraction (embeddings)
// This model downloads ~90MB to cache on first run.
let embedPipeline: any = null;

async function getPipeline() {
  if (!embedPipeline) {
    // all-MiniLM-L6-v2 is a lightweight, high-quality open-source embedding model
    embedPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedPipeline;
}

export async function POST(req: NextRequest) {
  try {
    const { videoId, textToEmbed } = await req.json();

    if (!videoId || !textToEmbed) {
      return NextResponse.json({ error: 'videoId and textToEmbed are required' }, { status: 400 });
    }

    const extractor = await getPipeline();
    
    // Generate the embedding (output is a 1D tensor of 384 dimensions)
    const output = await extractor(textToEmbed, { pooling: 'mean', normalize: true });
    
    // Convert Float32Array to standard JS Array so Supabase pgvector can parse it
    const embeddingArray = Array.from(output.data);

    // Save to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error } = await supabase
        .from('videos')
        .update({ embedding: embeddingArray })
        .eq('id', videoId);

        if (error) {
            console.error('Failed to save embedding to Supabase:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    } else {
        console.warn("Supabase credentials missing. Generated embedding, but skipped database update.");
    }

    return NextResponse.json({ success: true, dimensions: embeddingArray.length });

  } catch (error: unknown) {
    console.error('Vector Embedding Error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
