// Image Loader for Cloudflare Image Resizing
// Docs: https://developers.cloudflare.com/images/image-resizing/integration-with-frameworks/#nextjs

export default function cloudflareLoader({
    src,
    width,
    quality,
}: {
    src: string;
    width: number;
    quality?: number;
}) {
    // Bypass cloudflare resizing in development or when not enabled
    // Return raw source URL so images load directly from their origin
    if (
        process.env.NODE_ENV === 'development' ||
        process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGE_RESIZING !== 'true'
    ) {
        return src;
    }

    const params = [`width=${width}`];
    if (quality) {
        params.push(`quality=${quality}`);
    }

    // R2 Domain Handling
    if (src.includes('r2.dev') || src.includes('pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev')) {
        const paramsString = params.join(',');
        return `https://juneteenthtube.com/cdn-cgi/image/${paramsString}/${encodeURIComponent(src)}`;
    }

    // For local paths, we need to map them to the full URL so Cloudflare can fetch them
    let fullSrc = src;
    if (src.startsWith('/')) {
        fullSrc = `https://juneteenthtube.com${src}`;
    }

    const paramsString = params.join(',');
    return `https://juneteenthtube.com/cdn-cgi/image/${paramsString}/${encodeURIComponent(fullSrc)}`;
}
