from PIL import Image
import sys

def remove_black_background(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Estimate alpha based on the maximum color component (brightness)
            # This perfectly extracts colors that were originally blended over black.
            alpha = max(r, g, b)
            
            if alpha > 0:
                # Un-premultiply the color
                new_r = int(min(255, (r * 255) / alpha))
                new_g = int(min(255, (g * 255) / alpha))
                new_b = int(min(255, (b * 255) / alpha))
                pixels[x, y] = (new_r, new_g, new_b, alpha)
            else:
                pixels[x, y] = (0, 0, 0, 0)

    img.save(output_path, "PNG")
    print(f"Saved transparent image to {output_path}")

if __name__ == "__main__":
    remove_black_background(
        "public/official-logo.png", 
        "public/official-logo.png"
    )
