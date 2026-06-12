import re

files = [
    'D:/CareTriage/code/backend/backend/src/test/java/com/caretriage/infrastructure/ai/extraction/DocxFileTextExtractorTest.java',
    'D:/CareTriage/code/backend/backend/src/test/java/com/caretriage/infrastructure/ai/extraction/TxtFileTextExtractorTest.java',
    'D:/CareTriage/code/backend/backend/src/test/java/com/caretriage/api/controller/EHRControllerIntegrationTest.java',
    'D:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java',
    'D:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatAttachmentPersistenceService.java',
    'D:/CareTriage/code/backend/backend/src/main/java/com/caretriage/shared/exception/GlobalExceptionHandler.java'
]

def escape_match(match):
    return ''.join(f'\\u{ord(c):04x}' for c in match.group(0))

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We replace any character with ord > 127
    new_content = re.sub(r'[^\x00-\x7F]+', escape_match, content)
    
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f"Fixed {f}")
    else:
        print(f"No changes for {f}")
