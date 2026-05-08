
import os

path = r"d:\CareTriage\.agent\scrum\task-report.md"
with open(path, "rb") as f:
    content = f.read()

# If content is mangled like Ã¡ -> á
# It means the bytes \xc3\xa1 (á in UTF-8) were read as Latin-1 (Ã¡) 
# and then written back as \xc3\x83\xc2\xa1 (UTF-8 for Ã¡).
# To fix:
# Decode as UTF-8 -> "BÃ¡o cÃ¡o"
# Encode as Latin-1 -> \x42\xc3\xa1\x6f... (original UTF-8 bytes)
# Decode as UTF-8 -> "Báo cáo"

try:
    text = content.decode("utf-8")
    fixed_bytes = text.encode("latin-1")
    fixed_text = fixed_bytes.decode("utf-8")
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(fixed_text)
    print("Fixed encoding level 1.")
except Exception as e:
    print(f"Failed level 1: {e}")
    # Try another level
    try:
        text = content.decode("utf-8")
        # Maybe it's double mangled?
        # Let's just try to fix common sequences
        text = text.replace("Ã¡", "á").replace("Ã ", "à").replace("Ã£", "ã").replace("Ã­", "í").replace("Ã³", "ó").replace("Ã´", "ô").replace("Ãº", "ú").replace("Ä‘", "đ")
        # This is not ideal but might help
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
        print("Fixed common mangled characters.")
    except Exception as e2:
         print(f"Failed all levels: {e2}")
