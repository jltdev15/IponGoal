# Registration mascot artwork

These four 512 px transparent PNGs were generated with the built-in imagegen tool using `assets/piggpath-logo.webp` as the new character/style reference. The accepted wave image was also used as a consistency reference for the remaining three poses. The user-supplied logo is unchanged.

Final assets: `wave.png`, `identity.png`, `shield.png`, and `celebrate.png`. Exports preserve generated alpha and use the same 512 px square framing with the complete artwork fitted into a 450 px area. The poses remain readable at 144 px and keep the existing registration UI, text, and navigation.

## Final prompt set

Wave prompt:

> Use case: illustration-story. Asset type: PiggyPath registration wave mascot PNG. Reference image is character/style identity ONLY; do not modify the supplied logo. Generate ONE new flat 2D vector-style illustration of this same friendly coral-pink pig with navy smiling curved eyes, pink-red oval snout with navy nostrils, navy coin slot, upright pointed ears and gold coin. Extend the logo character into a rounded small body with tiny hooves. Pose: front-facing pig raises one hoof in a friendly welcoming wave, other hoof lowered. Match reference coral pink #FD7F8E, navy #013060, green #04B979 accents and gold #FDBE02; clean solid fills and smooth outlines, no gradients or glossy 3D shading. Centered complete character, square framing, uniform 12% transparent margins on every side; decoration kept close and sparse. True transparent background, no base/path, no lettering, no border/tile, no watermark or additional characters. Must read clearly as a small 144px registration illustration.

Shared prompt for identity, shield, and celebrate (followed by the pose-specific prompt below):

> Use case: illustration-story. Asset type: PiggyPath registration mascot PNG. Image 1 is the supplied logo's identity and palette reference; Image 2 is the accepted wave mascot, use the SAME pig character, proportions, smiling navy eyes and mouth, coral-pink body, red-pink snout with navy nostrils, navy hooves, upright pointed ears, tiny curled tail, and flat 2D illustration style. Generate ONE complete centered character illustration on a genuinely transparent background with even 10-12% clear margins. Match coral #FD7F8E, navy #013060, green #04B979 and gold #FDBE02. Clean mostly solid fills, NO glossy 3D rendering or heavy gradients. Readable at 144px. No lettering, watermark, logo tile, path, ground plane or extra characters. Keep gold coin decoration sparse and close to the head.

- `identity.png`: Pose: hold a cream/white rounded identity card in both hooves in front of the body. Card has one navy generic profile silhouette and two green lines, NO readable text.
- `shield.png`: Pose: hold a navy shield with a gold border and simple gold lock symbol in front of the body; friendly protective expression, green accent only small.
- `celebrate.png`: Pose: raise one hoof holding a gold coin with a simple circular inset, other hoof raised joyfully, two close green/gold sparkle accents. Keep complete pig body and all decorations fully within frame.

These are decorative locally bundled assets. Adjacent step text communicates the meaning to screen readers. The logo/icon exporter does not overwrite these selected generated illustrations.
