# Learning Games mascot icons

Eight distinct illustrations generated with the built-in imagegen tool, using
`../registration/wave.png` as the mascot identity/style reference. Existing brand
assets are unchanged. Final assets are optimized 512×512 RGBA PNGs, preserving
the generated transparency and composition. `GameGridCard` displays them as
decorative artwork with the game title and an accessible action label.

## Shared prompt

Use case: illustration-story. Asset type: one small square mobile game icon for
PiggyPath. Image 1 is the mascot identity and style reference, not an edit target.
Create ONE transparent PNG illustration of **the subject below**. Match the
reference cheerful coral-pink pig, navy curved eyes and hooves, pink oval snout
and curled tail. Flat clean 2D illustration with simple solid shapes, minimal
shading, coral pink dominant, navy #013060, gold #FDBE02 and green accents. Center
the complete character and props together on a square canvas with even 12%
transparent margins. Must read clearly as a small 48px icon. Only the described
props; no floating overhead coins unrelated to the subject. No text, letters,
numbers, watermark, border, background tile, or extra characters. Genuine
transparent background.

## Subjects and outputs

| File | Subject |
| --- | --- |
| `needs-or-wants.png` | Pig comparing a simple school notebook on one side and an optional wrapped gift on the other |
| `budget-challenge.png` | Pig arranging three gold coins beside a small open wallet |
| `save-or-spend.png` | Pig choosing between a small savings jar and a shopping bag |
| `goal-builder.png` | Pig assembling a small goal board with a pink bullseye target |
| `flight-needs.png` | Pig flying with small simple wings while carrying a school notebook |
| `flight-save.png` | Pig flying with small simple wings while carrying a savings jar |
| `budget-flight.png` | Pig flying with small simple wings while carrying a wallet with two gold coins |
| `goal-rush.png` | Pig flying with small simple wings toward a small target flag |

One built-in generation call was used for each asset. Export resizing is
deterministic; prompts contain no titles or labels because those are native text.

To export another generated source without changing the composition, run
`scripts/export-game-icons.py name=source.png` with Python and Pillow. It validates
square artwork/transparency and writes optimized 512px RGBA files here.

## Savings Flight player sprite

`savings-flight-pig-side.png` is a separate gameplay sprite generated on
2026-10-07 with one call to the built-in `image_gen` tool, with
`transparent_background: true`. The generated PNG was copied into this directory
without resizing or changing its alpha channel. It shows a right-facing pink
pig with cream wings, a curled tail, and tucked legs.

`Player` and `FlightHero` use this sprite with `resizeMode="contain"`. The player
retains its 36×36 footprint and existing tilt animation; compact and regular
heroes retain their 64×64 and 96×96 dimensions.

Validation: the PNG is 1254×1254 with a 32-bit alpha channel. The size-check
sheet at `../../../docs/screenshots/flight-pig-size-preview.png` shows the
unaltered sprite at 36px, 64px, and 96px against the flight field color, including
the player's +8° tilt. Flight presentation/screen tests (15 tests), TypeScript,
and ESLint pass. The size sheet is a composited asset preview, not a native
gameplay screenshot.

### Generation prompt

Create a single game sprite of a cute pink pig flying toward the right, shown in
true side profile. Give it small cream-colored wings, a rounded body, short
tucked legs, a curled tail, a clear snout, and one visible friendly eye. Use simple
polished 2D cartoon shapes with crisp outlines and restrained shading. Center
the complete silhouette on a square transparent canvas with minimal padding.
Keep the character recognizable at 36px. No text, coins, logo badge, scenery, or
ground shadow.
