from pathlib import Path
text = Path('public/assets/scripts/app.js').read_text(encoding='utf-8')
start = text.index('    errorBlock.textContent = "";')
print(text[start:start+400])
