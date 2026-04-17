import os
from PIL import Image

def process_images(img_folder, legend_path):
    if not os.path.exists(img_folder):
        print(f"Error: {img_folder} does not exist.")
        return
    if not os.path.exists(legend_path):
        print(f"Error: {legend_path} does not exist.")
        return

    try:
        # Load the legend image and ensure it has an alpha channel for transparency
        legend = Image.open(legend_path).convert("RGBA")
    except Exception as e:
        print(f"Failed to open legend image: {e}")
        return

    valid_extensions = {".png", ".jpg", ".jpeg", ".bmp", ".gif", ".webp"}

    for filename in os.listdir(img_folder):
        ext = os.path.splitext(filename)[1].lower()
        if ext not in valid_extensions:
            continue

        img_path = os.path.join(img_folder, filename)
        
        # Avoid processing the legend image if it happens to be the same path
        if os.path.abspath(img_path) == os.path.abspath(legend_path):
            continue

        try:
            # Open the target image
            with Image.open(img_path) as img:
                original_mode = img.mode
                img_rgba = img.convert("RGBA")
                
                # Position for top-right corner
                position = (img_rgba.width - legend.width, 0)
                
                # Paste the legend onto the image using the legend itself as a mask for transparency
                img_rgba.paste(legend, position, legend)
                
                # Convert back to original mode if necessary (e.g., JPEG doesn't support RGBA)
                if ext in {".jpg", ".jpeg"}:
                    final_img = img_rgba.convert("RGB")
                else:
                    final_img = img_rgba.convert(original_mode)
                
                # Overwrite the original image
                final_img.save(img_path)
                print(f"Successfully processed: {filename}")
                
        except Exception as e:
            print(f"Failed to process {filename}: {e}")

if __name__ == "__main__":
    # Define the paths
    img_folder = r"d:\Research Work\GITHUB\slide crosswalk\img"
    legend_path = r"d:\Research Work\GITHUB\slide crosswalk\legend\legend.png"
    
    print(f"Starting to process images in {img_folder}...")
    process_images(img_folder, legend_path)
    print("Done!")
