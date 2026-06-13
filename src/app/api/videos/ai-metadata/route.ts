import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { filename, contextTitle } = await req.json();

    if (!filename && !contextTitle) {
      return NextResponse.json(
        { error: 'Provide a filename or initial title context to generate metadata.' },
        { status: 400 }
      );
    }

    const input = contextTitle || filename || "";
    
    // Clean up the filename (remove extension, replace underscores/hyphens with spaces)
    let cleanTitle = input.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    
    // Capitalize words
    cleanTitle = cleanTitle.replace(/\b\w/g, l => l.toUpperCase());
    
    // Shorten title to 60 chars
    const title = cleanTitle.length > 60 ? cleanTitle.substring(0, 57) + "..." : cleanTitle;

    // Define smart category and tag mapping based on keywords
    const keywordMap: Record<string, { category: string, tags: string[], description: string }> = {
      'parade': { category: 'Parade', tags: ['Juneteenth', 'Parade', 'Celebration', 'Culture'], description: 'Experience the vibrant energy and cultural celebration of this incredible parade.' },
      'music': { category: 'Music', tags: ['Music', 'Live Performance', 'Culture'], description: 'A powerful musical performance highlighting rich cultural heritage.' },
      'speech': { category: 'Speeches', tags: ['Speech', 'History', 'Voices'], description: 'An inspiring and historic speech that resonates with the community.' },
      'food': { category: 'Food', tags: ['Food', 'Culinary', 'Culture'], description: 'A delicious dive into traditional culinary arts and cultural foodways.' },
      'history': { category: 'History', tags: ['Black History', 'Heritage', 'Documentary'], description: 'An educational look back at the historical milestones that shaped our present.' },
      'sarembok': { category: 'SAREMBOK', tags: ['SAREMBOK', 'Exclusive', 'Culture'], description: 'Exclusive SAREMBOK coverage capturing the essence of the event.' },
      '2024': { category: '2024', tags: ['2024', 'Highlights', 'Recent'], description: 'Highlights and key moments from the 2024 celebrations.' },
    };

    let selectedCategory = "History"; // Default fallback
    let tags = ['CultureQuest', 'Black History'];
    let description = `A captivating video exploring Black culture and history. Watch to discover more!`;

    const lowerInput = input.toLowerCase();
    for (const [key, data] of Object.entries(keywordMap)) {
      if (lowerInput.includes(key)) {
        selectedCategory = data.category;
        tags = [...new Set([...tags, ...data.tags])];
        description = data.description;
        break; // Use the first match
      }
    }

    // Add some random flare to the description
    description += ` Join the CultureQuest community as we preserve and celebrate these incredible moments.`;

    const metadata = {
      title,
      description,
      tags: tags.slice(0, 5), // Max 5 tags
      category: selectedCategory
    };

    return NextResponse.json(metadata);

  } catch (error: unknown) {
    console.error('Local Metadata Generation Error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
