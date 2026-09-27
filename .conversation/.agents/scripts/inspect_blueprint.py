import fitz
from pathlib import Path

pdf = Path('attached_assets/class9_90day_blueprint_tracker_blank_1790497496715.pdf')
out = Path('.agents/outputs')
doc = fitz.open(pdf)
all_text = []
for i, page in enumerate(doc):
    pix = page.get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
    pix.save(out / f'blueprint-page-{i+1}.png')
    all_text.append(f'\n--- PAGE {i+1} ---\n{page.get_text()}')
(out / 'blueprint-full.txt').write_text('\n'.join(all_text), encoding='utf-8')
print(f'pages={len(doc)}')
print(f'text_chars={sum(len(t) for t in all_text)}')
print(f'outputs={len(list(out.glob("blueprint-page-*.png")))} rendered pages')
