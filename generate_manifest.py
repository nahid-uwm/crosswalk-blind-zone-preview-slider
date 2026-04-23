#!/usr/bin/env python3
"""Print JS filename arrays to paste into index.html.

Usage:
  1. Edit FIXED_MAP_DIR / DRIVER_VIEW_DIR below if folders change.
  2. Run: python3 generate_manifest.py
  3. Copy-paste the two arrays into index.html (replace `const FILES = [...]`
     and `const DRIVER_FILES = [...]`).
"""
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
IMG_EXT = (".png", ".jpg", ".jpeg")

FIXED_MAP_DIR = "image folder/compressed new image/"
DRIVER_VIEW_DIR = "image folder/new image 3 layer driver view/"


def list_images(rel_dir: str) -> list[str]:
    abs_dir = os.path.join(ROOT, rel_dir)
    if not os.path.isdir(abs_dir):
        print(f"WARN: dir missing: {rel_dir}", file=sys.stderr)
        return []
    names = [f for f in os.listdir(abs_dir) if f.lower().endswith(IMG_EXT)]
    names.sort()
    return names


def print_js_array(name: str, items: list[str]) -> None:
    print(f"      const {name} = [")
    for item in items:
        print(f'        "{item}",')
    print("      ];\n")


def main() -> int:
    print_js_array("FILES", list_images(FIXED_MAP_DIR))
    print_js_array("DRIVER_FILES", list_images(DRIVER_VIEW_DIR))
    return 0


if __name__ == "__main__":
    sys.exit(main())
