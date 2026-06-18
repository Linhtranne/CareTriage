import re
import subprocess

with open('d:/CareTriage/code/front end/frontend/src/pages/patient/book-appointment-recovery.txt', 'r', encoding='utf-8') as f:
    text = f.read().replace('\r\n', '\n')

lines = text.split('\n')
clean_lines = []
in_code = False
for line in lines:
    if line.startswith('1: import '):
        in_code = True
    if in_code:
        m = re.match(r'^(\d+): (.*)', line)
        if m:
            clean_lines.append(m.group(2))
            if m.group(1) == '800':
                break

content = '\n'.join(clean_lines)

# Get the bottom from old file
bottom_text = subprocess.check_output(['git', 'show', 'HEAD:./src/pages/patient/book-appointment.jsx'], cwd='d:/CareTriage/code/front end/frontend').decode('utf-8').replace('\r\n', '\n')

# Find overlap manually.
overlap_str = "      actions={\n        <Button\n          variant=\"outlined\"\n          onClick={() => navigate('/patient/appointments')}"
idx_top = content.find(overlap_str)
idx_bottom = bottom_text.find(overlap_str)

if idx_top != -1 and idx_bottom != -1:
    full_content = content[:idx_top] + bottom_text[idx_bottom:]
    
    # APPLY THE EXTERNAL DOCTOR FIX
    fix_str_old = "      const extRes = await publicApi.getExternalDoctors();\n      let externalDocs = extRes.data || [];\n      \n      // Basic filtering for external docs if department is selected"
    fix_str_new = "      const extRes = await publicApi.getExternalDoctors();\n      let externalDocs = extRes.data || [];\n\n      // Filter external doctors to only include those approved by Admin\n      externalDocs = externalDocs.filter((d: any) => d.verificationStatus === 'VERIFIED' && d.active === true);\n      \n      // Basic filtering for external docs if department is selected"
    
    if fix_str_old in full_content:
        full_content = full_content.replace(fix_str_old, fix_str_new)
        with open('d:/CareTriage/code/front end/frontend/src/pages/patient/book-appointment.tsx', 'w', encoding='utf-8') as f:
            f.write(full_content)
        print("Restored and fixed successfully! We are back in business!")
    else:
        print("Restored but couldn't find the fix_str_old.")
        with open('d:/CareTriage/code/front end/frontend/src/pages/patient/book-appointment.tsx', 'w', encoding='utf-8') as f:
            f.write(full_content)
else:
    print('idx_top:', idx_top, 'idx_bottom:', idx_bottom)
