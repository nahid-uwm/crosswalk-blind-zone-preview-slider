import os
from PIL import Image

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
                    
                    # Ensure it is saved as jpg since index.html expects .jpg
                    filename_without_ext = os.path.splitext(filename)[0]
                    output_filename = filename_without_ext + ".jpg"
                    output_path = os.path.join(output_dir, output_filename)
                    
                    # Optimize and save
                    img.save(output_path, "JPEG", quality=80, optimize=True)
                    print(f"Compressed: {filename} -> {output_filename}")
            except Exception as e:
                print(f"Error processing {filename}: {e}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    input_folder = os.path.join(current_dir, "image folder", "new image main")
    output_folder = os.path.join(current_dir, "image folder", "compressed new image")
    
    print(f"Reading from: {input_folder}")
    print(f"Saving to: {output_folder}")
    compress_images(input_folder, output_folder, max_width=1000)
    print("Optimization complete!")
