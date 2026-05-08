
import os

path = r"d:\CareTriage\.agent\scrum\task-report.md"
with open(path, "rb") as f:
    content = f.read()

try:
    # Handle BOM
    if content.startswith(b'\xef\xbb\xbf'):
        content = content[3:]
    
    # Try to decode
    try:
        text = content.decode("utf-8")
    except:
        text = content.decode("latin-1")

    # Fix mojibake
    try:
        fixed_text = text.encode("latin-1").decode("utf-8")
    except:
        fixed_text = text

    with open(path, "w", encoding="utf-8") as f:
        f.write(fixed_text)
    print("Fixed encoding successfully.")
except Exception as e:
    print(f"Error: {e}")
