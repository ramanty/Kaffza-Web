import os
import re

DIR = '/home/ubuntu/Kaffza-Web/apps/web/src/components'

REPLACEMENTS = [
    (r'bg-white', r'bg-card text-card-foreground'),
    (r'border-black/10', r'border-border'),
    (r'text-kaffza-text/70', r'text-muted-foreground'),
    (r'text-kaffza-text/60', r'text-muted-foreground'),
    (r'text-kaffza-text', r'text-foreground'),
    (r'text-kaffza-primary', r'text-primary'),
    (r'bg-kaffza-bg', r'bg-background'),
    (r'bg-\[\#1A2B4A\]', r'bg-muted/20'),
    (r'border-slate-200', r'border-border'),
    (r'border-black/5', r'border-border'),
    (r'bg-kaffza-primary', r'bg-primary'),
    (r'bg-kaffza-premium', r'bg-premium'),
    (r'text-kaffza-premium', r'text-premium'),
    (r'text-white/80', r'text-muted-foreground'),
    (r'text-white/70', r'text-muted-foreground'),
    (r'hover:bg-white/10', r'hover:bg-muted'),
    (r'bg-white/10', r'bg-muted'),
    (r'border-white/10', r'border-border'),
]

EXCLUDE = ['Button.tsx', 'Card.tsx', 'Input.tsx', 'SiteTopBar.tsx']

for root, _, files in os.walk(DIR):
    for f in files:
        if f.endswith('.tsx') and f not in EXCLUDE:
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            original = content
            for p, r in REPLACEMENTS:
                content = re.sub(p, r, content)
            if content != original:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(content)
                print(f'Updated {path}')
