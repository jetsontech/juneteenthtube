import os

path = r"C:\Juneteenthtube-Master\.next\server\app\api\tts\route.js"

if not os.path.exists(path):
    print("File not found!")
    exit(1)

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Let's search for "webpack-runtime" occurrences or see what is around offset 55316
# Wait, offset 55316 of line 30 is offset 55316 of the whole file if there is only 1 line, or we can search for the require hook
# Let's find dependencies or require calls in the route file
print("File length:", len(content))

# Print context around index 55316
start = max(0, 55316 - 200)
end = min(len(content), 55316 + 200)
print("Context around offset 55316:")
print(content[start:end])
