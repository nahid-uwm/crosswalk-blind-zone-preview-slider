import os
import re
from PIL import Image

# Configuration directories - change these to easily update source and output paths
SOURCE_FOLDER = r"d:\Research Work\GITHUB\2026\crosswalk-blind-zone-preview-slider\image folder\april new color\fixed map"
OUTPUT_FOLDER = r"d:\Research Work\GITHUB\2026\crosswalk-blind-zone-preview-slider\image folder\main fixed map images"

def compress_images(input_dir, output_dir, max_width=1000):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    for filename in os.listdir(input_dir):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            file_path = os.path.join(input_dir, filename)
            
            try:
                with Image.open(file_path) as img:
                    # Calculate new dimensions
                    width, height = img.size
                    if width > max_width:
                        ratio = max_width / width
                        new_size = (max_width, int(height * ratio))
                        img = img.resize(new_size, Image.Resampling.LANCZOS)
                    
                    # Convert to RGB if it has alpha channel
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")
                    
                    # Extract progress value to use as the new filename
                    match = re.search(r'\d+\.\d+', filename)
                    if match:
                        output_filename = f"{match.group(0)}.jpg"
                    else:
                        # Fallback if no progress value found
                        filename_without_ext = os.path.splitext(filename)[0]
                        output_filename = f"{filename_without_ext}.jpg"
                        
                    output_path = os.path.join(output_dir, output_filename)
                    
                    # Optimize and save
                    img.save(output_path, "JPEG", quality=80, optimize=True)
                    print(f"Compressed: {filename} -> {output_filename}")
            except Exception as e:
                print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    print(f"Reading from: {SOURCE_FOLDER}")
    print(f"Saving to: {OUTPUT_FOLDER}")
    compress_images(SOURCE_FOLDER, OUTPUT_FOLDER, max_width=1000)
    print("Optimization complete!")
