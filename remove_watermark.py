"""
Remove watermark stars from glass_tiled.png and convert to WebP
Uses inpainting to intelligently fill watermarked regions
"""
from PIL import Image
import numpy as np
import cv2

# Load image
print("Loading image...")
img = Image.open('workers/assets/glass_tiled.png').convert('RGB')
arr = np.array(img, dtype=np.uint8)
print(f"Image loaded: {arr.shape}")

# Create mask for watermark regions
# Watermark stars are grey (brightness ~120-220) on dark background
gray = arr.mean(axis=2)
mask = ((gray > 110) & (gray < 225)).astype(np.uint8) * 255

# Dilate mask slightly to ensure we cover edges of stars
kernel = np.ones((5, 5), np.uint8)
mask = cv2.dilate(mask, kernel, iterations=2)

print(f"Mask created: {mask.sum() / 255} pixels to inpaint")

# Use OpenCV inpainting to remove watermarks
# INPAINT_TELEA is better for texture preservation
arr_bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
result_bgr = cv2.inpaint(arr_bgr, mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
result_rgb = cv2.cvtColor(result_bgr, cv2.COLOR_BGR2RGB)

print("Inpainting complete")

# Convert to PIL Image
result_img = Image.fromarray(result_rgb, 'RGB')

# Save as high-quality WebP
output_path = 'workers/assets/glass_tiled.webp'
result_img.save(output_path, 'WEBP', quality=90, method=6)
print(f"Saved to {output_path}")

# Also save cleaned PNG version
result_img.save('workers/assets/glass_tiled_clean.png', 'PNG', optimize=True)
print("Saved clean PNG version")

# Report file sizes
import os
original_size = os.path.getsize('workers/assets/glass_tiled.png')
webp_size = os.path.getsize(output_path)
clean_png_size = os.path.getsize('workers/assets/glass_tiled_clean.png')

print(f"\nFile sizes:")
print(f"  Original PNG: {original_size:,} bytes ({original_size/1024:.1f} KB)")
print(f"  WebP:         {webp_size:,} bytes ({webp_size/1024:.1f} KB)")
print(f"  Clean PNG:    {clean_png_size:,} bytes ({clean_png_size/1024:.1f} KB)")
print(f"  Reduction:    {(1 - webp_size/original_size)*100:.1f}%")
