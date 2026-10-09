"""Export imagegen PNGs without changing their artwork: name=source.png arguments."""
from pathlib import Path
import sys
from PIL import Image

destination = Path(__file__).resolve().parents[1] / 'assets' / 'branding' / 'games'
destination.mkdir(parents=True, exist_ok=True)
allowed = {
    'needs-or-wants', 'budget-challenge', 'save-or-spend', 'goal-builder',
    'flight-needs', 'flight-save', 'budget-flight', 'goal-rush',
}
for argument in sys.argv[1:]:
    name, source = argument.split('=', 1)
    if name not in allowed:
        raise ValueError('Unknown game icon name')
    with Image.open(source) as original:
        image = original.convert('RGBA')
        if image.width != image.height:
            raise ValueError('Expected square artwork')
        if image.getchannel('A').getextrema()[0] != 0:
            raise ValueError('Expected transparent artwork')
        image.resize((512, 512), Image.Resampling.LANCZOS).save(
            destination / f'{name}.png', optimize=True,
        )
    print(f'{name}: {(destination / f"{name}.png").stat().st_size} bytes')
