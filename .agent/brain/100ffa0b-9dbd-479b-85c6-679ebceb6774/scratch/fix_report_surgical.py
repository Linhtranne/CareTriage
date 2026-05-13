
import os

path = r"d:\CareTriage\.agent\scrum\task-report.md"

# Map of common Vietnamese mojibake sequences
v_map = {
    "Ã ": "à", "Ã¡": "á", "áº£": "ả", "Ã£": "ã", "áº¡": "ạ",
    "Äƒ": "ă", "áº±": "ằ", "áº¯": "ắ", "áº³": "ẳ", "áºµ": "ẵ", "áº·": "ặ",
    "Ã¢": "â", "áº§": "ầ", "áº¥": "ấ", "áº©": "ẩ", "áº«": "ẫ", "áº­": "ậ",
    "Ã¨": "è", "Ã©": "é", "áº»": "ẻ", "áº½": "ẽ", "áº¹": "ẹ",
    "Ãª": "ê", "á» " : "ề", "áº¿": "ế", "á»ƒ": "ể", "á»…": "ễ", "á»‡": "ệ",
    "Ã¬": "ì", "Ã­": "í", "á»‰": "ỉ", "Ä©": "ĩ", "á»‹": "ị",
    "Ã²": "ò", "Ã³": "ó", "á» ": "ỏ", "Ãµ": "õ", "á» ": "ọ",
    "Ã´": "ô", "á»“": "ồ", "á»‘": "ố", "á»•": "ổ", "á»—": "ỗ", "á»™": "ộ",
    "Æ¡": "ơ", "á» ": "ờ", "á»›": "ớ", "á»Ÿ": "ở", "á»¡": "ỡ", "á»£": "ợ",
    "Ã¹": "ù", "Ãº": "ú", "á»§": "ủ", "Å©": "ũ", "á»¥": "ụ",
    "Æ°": "ư", "á»«": "ừ", "á»©": "ứ", "á»­": "ử", "á»¯": "ữ", "á»±": "ự",
    "Ã½": "ý", "á»³": "ỳ", "á»·": "ỷ", "á»¹": "ỹ", "á»µ": "ỵ",
    "Ä‘": "đ", "Ã€": "À", "Ã ": "Á", "Ã‚": "Â", "Ãˆ": "È", "Ã‰": "É", "ÃŠ": "Ê",
    "ÃŒ": "Ì", "Ã ": "Í", "Ã’": "Ò", "Ã“": "Ó", "Ã”": "Ô", "Ã™": "Ù", "Ãš": "Ú",
    "Ã ": "Ý", "Ä ": "Đ",
    "áº¬": "Ậ", "áº¤": "Ấ", "áº¦": "Ầ", "áº ": "Ả", "áº ": "Ạ", "áº¸": "Ẹ", "áº¾": "Ế",
    "á»‹": "ị", "á» ": "ọ", "á»™": "ộ", "á»¥": "ụ", "á»±": "ự",
    "Ä‘": "đ", "áº£": "ả", "á» ": "ờ"
}

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Fix by replacement map
fixed_content = content
for k, v in v_map.items():
    fixed_content = fixed_content.replace(k, v)

# Fix common remaining issues
fixed_content = fixed_content.replace("LÃ½ do", "Lý do").replace("Công nghá»‡", "Công nghệ").replace("triá»ƒn khai", "triển khai")
fixed_content = fixed_content.replace("kháº£ dá»¥ng", "khả dụng").replace("há»‡ thá»‘ng", "hệ thống").replace("ngÆ°á» i dÃ¹ng", "người dùng")
fixed_content = fixed_content.replace("bác sÄ©", "bác sĩ").replace("há»“ sÆ¡", "hồ sơ").replace("bá»‡nh nhÃ¢n", "bệnh nhân")

# Clean up redundant empty lines
lines = fixed_content.splitlines()
clean_lines = []
for i in range(len(lines)):
    if i > 0 and not lines[i].strip() and not lines[i-1].strip():
        continue
    clean_lines.append(lines[i])

with open(path, "w", encoding="utf-8") as f:
    f.write("\n".join(clean_lines))

print("Fixed task-report.md font issues.")
