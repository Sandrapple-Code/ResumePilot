import os
import re

target_dir = "src"
old_pattern1 = re.compile(r'"http://127\.0\.0\.1:8000')
new_str1 = '(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000") + "'

old_pattern2 = re.compile(r'`http://127\.0\.0\.1:8000')
new_str2 = '`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}'

changed_files = []

for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith(".ts") or file.endswith(".tsx"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            new_content = old_pattern1.sub(new_str1, content)
            new_content = old_pattern2.sub(new_str2, new_content)
            if new_content != content:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                changed_files.append(path)

print(f"Updated {len(changed_files)} files:")
for f in changed_files:
    print(" -", f)