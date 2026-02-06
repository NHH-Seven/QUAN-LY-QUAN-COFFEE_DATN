import re

# Read the file
with open('server/src/routes/shifts.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix broken template strings
# Pattern 1: sql += AND something = $' + idx + '
content = re.sub(r"sql \+= +AND ([^=]+) = \$' \+ idx \+ '", r"sql += ' AND \1 = $' + idx", content)

# Pattern 2: sql += AND (complex) = $' + idx + ')
content = re.sub(r"sql \+= +AND \(([^)]+)\) = \$' \+ idx \+ '\)", r"sql += ' AND (\1)'", content)

# Pattern 3: Fix any remaining broken patterns
content = re.sub(r"sql \+= +AND", r"sql += ' AND", content)

# Fix ${idx} that might still exist
content = re.sub(r'\$\{idx\}', r"$' + idx + '", content)

# Ensure user.userId is used
content = content.replace('user.id', 'user.userId')

# Write back
with open('server/src/routes/shifts.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed!")
