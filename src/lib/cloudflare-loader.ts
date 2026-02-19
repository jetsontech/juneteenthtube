// Image Loader for Cloudflare Image Resizing
// Docs: https://developers.cloudflare.com/images/image-resizing/integration-with-frameworks/#nextjs

const normalizeSrc = (src: string) => {
    return src.startsWith('/') ? src.slice(1) : src;
};

export default function cloudflareLoader({
    src,
    width,
    quality,
}: {
    src: string;
    width: number;
    quality?: number;
}) {
    // Bypass cloudflare resizing in development to fix local assets
    if (process.env.NODE_ENV === 'development') {
        return src;
    }

    const params = [`width=${width}`];
    if (quality) {
        params.push(`quality=${quality}`);
    }

    // NOTE: This assumes you have 'Resize from any origin' enabled in Cloudflare
    // Check: Cloudflare Dash -> Images -> Transformations -> Resize from any origin

    // R2 Domain Handling
    // If the image is coming from your R2 bucket public domain:
    if (src.includes('r2.dev') || src.includes('pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev')) {
        const paramsString = params.join(',');
        // The src must be encoded to work correctly in the path
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
