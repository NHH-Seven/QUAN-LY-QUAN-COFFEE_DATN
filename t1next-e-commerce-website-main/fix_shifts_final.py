import re

# Read the file
with open('server/src/routes/shifts.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove all broken XML-like tags
content = re.sub(r'</content>\s*</file>', '', content)
content = re.sub(r'<file[^>]*>', '', content)
content = re.sub(r'<content>', '', content)

# Fix broken SQL concatenations
# Pattern: sql += ' AND something = \n should be sql += ' AND something = $' + idx
content = re.sub(r"sql \+= ' AND ([^=]+) = \n", r"sql += ' AND \1 = $' + idx\n", content)

# Fix: sql += ' AND (complex)\n should have proper ending
content = re.sub(r"sql \+= ' AND \(([^)]+)\) \+ idx \+ ' OR ([^)]+)\) \+ idx \+ '\)", 
                 r"sql += ' AND (\1 = $' + idx + ' OR \2 = $' + idx + ')'", content)

# Write back
with open('server/src/routes/shifts.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed!")
