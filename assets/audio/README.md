# Welcome oink

`welcome-oink.wav` is a 0.555-second cartoon "oink-oink" pair, mono, 44.1 kHz,
16-bit PCM. The voiced part of a performed snort is trimmed to 0.045–0.305 seconds
within the retained source excerpt. A 170 Hz high-pass reduces rumble; a two-stage
3600 Hz low-pass softens breath noise, and a broad +3.5 dB bell at 900 Hz adds
nasal presence (Q 0.85).

The first burst uses a pitch/speed factor of 1.22; the second uses 1.12 at 90%
level. A 110 ms gap separates them. Each burst has a 6 ms attack and 25 ms release.
Tanh compression at three times the voiced RMS softens isolated transients; peak
normalization to 22000/32768 leaves headroom. The lower pitch factors and
shortened breath tails refine the earlier 0.531-second version.

## Source and license

- **10-Piggy oinks (voice and hand)-210819_2155.wav** by **SavReese**, published
  October 29, 2021: <https://freesound.org/people/SavReese/sounds/595471/>
- License: **CC0 1.0 Universal** (public-domain dedication):
  <https://creativecommons.org/publicdomain/zero/1.0/>
- Downloaded high-quality preview:
  <https://cdn.freesound.org/previews/595/595471_12672587-hq.mp3>
- `source/piggy-oink-savreese-595471.wav` retains the 21.79–22.12 second excerpt
  decoded to mono 44.1 kHz PCM16. The packaging script performs the effects above.

Regenerate the packaged clip and its identical Android raw-resource copy with
`node scripts/generate-welcome-oink.cjs`. iOS bundles this file directly through
the Xcode Resources phase. Native players restart the clip on every activation,
respect system mute/volume, and retain playback across the onboarding transition.
