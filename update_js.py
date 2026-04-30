import os
import re

target_file = r"d:\Research Work\GITHUB\2026\crosswalk-blind-zone-preview-slider\js\image-data.js"
fixed_dir = r"d:\Research Work\GITHUB\2026\crosswalk-blind-zone-preview-slider\image folder\main fixed map images"
driver_dir = r"d:\Research Work\GITHUB\2026\crosswalk-blind-zone-preview-slider\image folder\driver view images"

def get_files(d):
    files = [f for f in os.listdir(d) if f.endswith('.jpg')]
    # sort numerically by the first float found
    def sort_key(f):
        m = re.search(r'(\d+(?:\.\d+)?)', f)
        return float(m.group(1)) if m else 0
    files.sort(key=sort_key)
    return files

fixed_files = get_files(fixed_dir)
driver_files = get_files(driver_dir)

js_content = f"""/**
 * Image Data — Auto-generated filename arrays.
 */

// Image source folders
const FIXED_MAP_DIR = "image folder/main fixed map images/";
const DRIVER_VIEW_DIR = "image folder/driver view images/";

const FILES = {repr(fixed_files)};

const DRIVER_FILES = {repr(driver_files)};
"""

js_content = js_content.replace("['", "[\n  \"").replace("', '", "\",\n  \"").replace("']", "\"\n]")

with open(target_file, "w", encoding="utf-8") as f:
    f.write(js_content)

print("Updated image-data.js successfully.")
