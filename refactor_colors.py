import os
import re

directories = [
    r"d:\CareTriage\code\front end\frontend\src",
    r"d:\CareTriage\code\front end\admin-frontend\src"
]

exclude_dirs = ["patient", "doctor"]

def replacer(match):
    opacity_str = match.group(1).strip()
    try:
        opacity_val = float(opacity_str)
        percentage = opacity_val * 100
        # format to avoid .0 if it's an integer
        if percentage.is_integer():
            percentage = int(percentage)
        return f"color-mix(in srgb, var(--color-primary-500) {percentage}%, transparent)"
    except ValueError:
        return match.group(0)

# Also replace hardcoded white backgrounds that have opacity, 
# typically rgba(255, 255, 255, 0.9) to color-mix(in srgb, var(--color-surface-50) 90%, transparent)
def white_replacer(match):
    opacity_str = match.group(1).strip()
    try:
        opacity_val = float(opacity_str)
        percentage = opacity_val * 100
        if percentage.is_integer():
            percentage = int(percentage)
        return f"color-mix(in srgb, var(--color-surface-50) {percentage}%, transparent)"
    except ValueError:
        return match.group(0)

pattern_green = re.compile(r"rgba\(\s*16\s*,\s*185\s*,\s*129\s*,\s*([0-9.]+)\s*\)")
pattern_white = re.compile(r"rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*([0-9.]+)\s*\)")

for d in directories:
    if not os.path.exists(d):
        continue
    for root, dirs, files in os.walk(d):
        # Exclude directories
        dirs[:] = [dir_name for dir_name in dirs if dir_name not in exclude_dirs]
        
        for file in files:
            if file.endswith((".js", ".jsx", ".ts", ".tsx")):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                new_content = pattern_green.sub(replacer, content)
                new_content = pattern_white.sub(white_replacer, new_content)
                
                if new_content != content:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Refactored: {filepath}")

print("Done replacing hardcoded colors.")
