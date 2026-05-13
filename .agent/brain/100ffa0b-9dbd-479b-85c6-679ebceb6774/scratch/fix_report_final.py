
import os

path = r"d:\CareTriage\.agent\scrum\task-report.md"

def fix_mojibake(text):
    try:
        # Standard fix for UTF-8 bytes read as Latin-1
        return text.encode('latin-1').decode('utf-8')
    except:
        return text

with open(path, "rb") as f:
    raw_content = f.read()

# Try to detect if it's already UTF-8 but mangled inside
try:
    content = raw_content.decode("utf-8")
    
    # We'll split the file and only fix the mangled parts if needed, 
    # but usually the whole file is affected after a bad append.
    # The sections I just added (T-048, T-049) are already correct.
    
    lines = content.splitlines()
    fixed_lines = []
    
    for line in lines:
        # If line contains typical mojibake patterns
        if "Ã" in line or "áº" in line or "á»" in line or "Ä" in line:
            # Try to fix it
            try:
                fixed_line = line.encode('latin-1').decode('utf-8')
                fixed_lines.append(fixed_line)
            except:
                fixed_lines.append(line)
        else:
            fixed_lines.append(line)
            
    # Remove excessive blank lines (more than 2 consecutive)
    final_lines = []
    blank_count = 0
    for line in fixed_lines:
        if not line.strip():
            blank_count += 1
        else:
            blank_count = 0
        
        if blank_count <= 2:
            final_lines.append(line)

    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(final_lines))
    print("Fixed encoding and cleaned up blank lines.")

except Exception as e:
    print(f"Error: {e}")
