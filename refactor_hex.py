import os

directories = [
    r"d:\CareTriage\code\front end\frontend\src",
    r"d:\CareTriage\code\front end\admin-frontend\src"
]

exclude_dirs = ["patient", "doctor"]

replacements = {
    "'#10b981'": "'var(--color-primary-500)'",
    '"#10b981"': '"var(--color-primary-500)"',
    "'#059669'": "'var(--color-primary-600)'",
    '"#059669"': '"var(--color-primary-600)"',
    "'#ef4444'": "'var(--color-danger)'",
    '"#ef4444"': '"var(--color-danger)"',
    "'#f59e0b'": "'var(--color-warning)'",
    '"#f59e0b"': '"var(--color-warning)"',
    "'#3b82f6'": "'var(--color-info)'",
    '"#3b82f6"': '"var(--color-info)"',
    # Gradients that have hex inside
    "#10b981": "var(--color-primary-500)",
    "#059669": "var(--color-primary-600)"
}

for d in directories:
    if not os.path.exists(d):
        continue
    for root, dirs, files in os.walk(d):
        dirs[:] = [dir_name for dir_name in dirs if dir_name not in exclude_dirs]
        
        for file in files:
            if file.endswith((".js", ".jsx", ".ts", ".tsx")):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                new_content = content
                for old_val, new_val in replacements.items():
                    new_content = new_content.replace(old_val, new_val)
                
                if new_content != content:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Refactored: {filepath}")

print("Done replacing hex colors.")
