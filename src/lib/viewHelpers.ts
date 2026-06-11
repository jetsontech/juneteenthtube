/**
 * Shared view count helpers — used sitewide to ensure no video ever shows "0 views".
 *
 * Rules:
 *   1. Owned content always gets deterministic views (min 120–480, scaling with likes).
 *   2. Non-owned content: if db views are 0 but the video exists, give it a
 *      deterministic floor so the UI never looks broken.
 *   3. Views must always be ≥ likes.
 */

/** Deterministic hash for a video ID — returns a positive integer seed. */
function hashId(videoId: string): number {
    let hash = 0;
    for (let i = 0; i < videoId.length; i++) {
        hash = videoId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

/**
 * Returns a guaranteed-non-zero view count for any video.
 *
 * @param videoId   The video's UUID
 * @param dbViews   Raw view count from the database (may be 0)
 * @param likes     Number of likes on the video (default 0)
 * @param isOwned   Whether the current user owns this video
 */
export function getDisplayViews(
    videoId: string,
    dbViews: number,
    likes: number = 0,
    isOwned: boolean = false,
): number {
    const seed = hashId(videoId);

    // Base deterministic floor so every video shows something (120–480 range)
    const baseViews = 120 + (seed % 360);

    if (isOwned) {
        // Owned content: views closely match likes (1.1×–1.5× of likes) + base floor
        const multiplier = 1.1 + ((seed % 40) / 100);
        const offset = 2 + (seed % 9);
        const likeScaled = Math.floor(likes * multiplier) + offset;
        return Math.max(dbViews, likeScaled, baseViews, likes);
    }

    // Non-owned content
    if (likes > 0 && dbViews < likes) {
        // Has likes but views are suspiciously low → scale up
        const multiplier = 1.1 + ((seed % 30) / 100); // 1.1×–1.4×
        const offset = 1 + (seed % 5);
        const likeScaled = Math.floor(likes * multiplier) + offset;
        return Math.max(likeScaled, likes);
    }

    if (dbViews === 0) {
        // No views recorded yet — give a small deterministic floor
        return baseViews;
    }

    return Math.max(dbViews, likes);
}

/**
 * Format a numeric view count into a human-friendly string.
 * e.g. 1234 → "1.2K", 999 → "999", 1_500_000 → "1.5M"
 */
export function formatViews(count: number): string {
    if (count >= 1_000_000) {
        return (count / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1_000) {
        return (count / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
}

/**
 * Convenience: parse a raw views value (string | number | undefined) into a number.
 */
export function parseViews(raw: string | number | undefined | null): number {
    if (raw === undefined || raw === null) return 0;
    const s = raw.toString().replace(/,/g, '').replace(/[KkMm]/g, '');
    return parseInt(s, 10) || 0;
}
