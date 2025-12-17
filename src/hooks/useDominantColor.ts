"use client";

import { useState, useEffect } from "react";

/**
 * Extracts the dominant color from an image URL using canvas
 * Returns an RGBA color string with low opacity for use as hover background
 */
export function useDominantColor(imageUrl: string | undefined): string {
    // Disabled to prevent CORS errors with R2 public domain
    // The effect is subtle anyway - just returns a default hover color
    return "rgba(255, 255, 255, 0.05)";

    /* Original implementation - re-enable if CORS is fixed
    const [color, setColor] = useState<string>("rgba(255, 255, 255, 0.05)");

    useEffect(() => {
        if (!imageUrl) return;

        const img = new Image();
        img.crossOrigin = "Anonymous";

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                // Sample a small version for performance
                canvas.width = 10;
                canvas.height = 10;
                ctx.drawImage(img, 0, 0, 10, 10);

                const imageData = ctx.getImageData(0, 0, 10, 10).data;

                // Calculate average color
                let r = 0, g = 0, b = 0, count = 0;

                for (let i = 0; i < imageData.length; i += 4) {
                    // Skip very dark or very light pixels for better color extraction
                    const brightness = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
                    if (brightness > 30 && brightness < 225) {
                        r += imageData[i];
                        g += imageData[i + 1];
                        b += imageData[i + 2];
                        count++;
                    }
                }

                if (count > 0) {
                    r = Math.round(r / count);
                    g = Math.round(g / count);
                    b = Math.round(b / count);

                    // Return a low-opacity version for subtle hover effect
                    setColor(`rgba(${r}, ${g}, ${b}, 0.15)`);
                }
            } catch (error) {
                // CORS or other error - use default
                console.log("Color extraction failed, using default");
            }
        };

        img.onerror = () => {
            // Image failed to load - use default color
        };

        img.src = imageUrl;
    }, [imageUrl]);

    return color;
    */
}
