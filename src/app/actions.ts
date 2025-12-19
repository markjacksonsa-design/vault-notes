/// <reference types="@cloudflare/workers-types" />

'use server';

interface SaveRatingParams {
  userEmail: string;
  ratingValue: number;
  comment?: string;
}

// Note: In Cloudflare Pages, DB binding is accessed via process.env.DB
// For Next.js on Cloudflare Pages, use @cloudflare/next-on-pages or Pages Functions
export async function saveRating(
  params: SaveRatingParams
): Promise<{ success: boolean; message?: string }> {
  try {
    // Validate rating value
    if (params.ratingValue < 1 || params.ratingValue > 5) {
      return { success: false, message: 'Rating must be between 1 and 5' };
    }

    // Validate email
    if (!params.userEmail || !params.userEmail.includes('@')) {
      return { success: false, message: 'Valid email is required' };
    }

    // Access D1 database via Cloudflare runtime environment
    // In Cloudflare Pages with Next.js, DB is available via process.env.DB
    const db = (process.env.DB || (globalThis as any).DB) as unknown as D1Database | undefined;
    
    if (!db) {
      console.error('D1 database binding not available');
      return { success: false, message: 'Database connection unavailable' };
    }

    // Insert rating into D1 database
    await db
      .prepare('INSERT INTO ratings (user_email, rating_value, comment) VALUES (?, ?, ?)')
      .bind(params.userEmail, params.ratingValue, params.comment || null)
      .run();

    return { success: true, message: 'Rating saved successfully!' };
  } catch (error) {
    console.error('Error saving rating:', error);
    return { success: false, message: 'Failed to save rating. Please try again.' };
  }
}

