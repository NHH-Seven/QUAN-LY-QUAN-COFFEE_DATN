import re

# Read the file
with open('server/src/routes/shifts.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix all ${idx} in template strings to use concatenation
# Pattern: ` something ${idx}` -> ' something $' + idx
content = re.sub(r'`([^`]*)\$\{idx\}([^`]*)`', r"'\1$' + idx + '\2'", content)

# Fix user.id to user.userId (if not already fixed)
content = content.replace('user.id', 'user.userId')

# Write back
with open('server/src/routes/shifts.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed!")
