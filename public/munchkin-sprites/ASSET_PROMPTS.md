# Munchkin Cat sprite generation prompts

Each numbered block below is fully self-contained. Copy one block into your
image generator and it will produce a sprite that matches the rest of the set.
Save each result to the path given in its heading (the engine already looks for
these filenames).

Shared conventions baked into every prompt:

- Output 256x256 PNG, transparent background, UNLESS a block states a different
  size (the shelf is 256x96; the two yarn-ball grid sheets are 512x512).
- Pixel art authored on a small grid (about 48 to 64 logical pixels), exported
  upscaled with NEAREST-NEIGHBOR and NO anti-aliasing, so pixels stay crisp.
- Light source upper-left, soft flat shading, no baked-in drop shadow.
- Palette: wall plum/brown `#3a2a3f` `#2e2031`; wood `#8a5a33` `#6b4423`
  `#5e3c20`; cream `#fde9c8` `#f5e6c8`; cat orange `#f59e0b` `#d97706`; accents
  amber `#d97706`, violet `#7c3aed`, sky `#0ea5e9`, green `#16a34a`, pink
  `#db2777`; daylight sky `#9fd3ff` `#d8f0ff`, sun `#fde68a`, hills `#86c98a`.
- Floor-standing objects: base flush to the BOTTOM edge, centered horizontally.
- Wall items: centered with even transparent margin.
- Animation frames: same canvas, same baseline, same center, facing RIGHT.
- For multi-frame sets (the cat, the yarn) and the picture series, a reference
  image of the established style will be provided. Match its proportions,
  palette, and framing closely so every asset stays consistent.
- The cat animation frames are delivered as SEPARATE files, one frame per
  256x256 PNG (idle = 4 files, walk = 8 files, jump/fall/land = 2 files each).
- EXCEPTION: the yarn ball is delivered as 2 grid images (a 2x2 grid of 4
  frames each, 8 frames total) to save generations. The engine slices each grid
  into its 4 frames automatically, so do NOT split them yourself.

---

## Batch 1: Tiling surfaces (priority, must be seamless)

### 1. layers/wall_tile.png
Cozy 16-bit pixel-art wallpaper texture, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Muted plum-brown wall (#3a2a3f to #2e2031) with a subtle warm vertical stripe and faint repeating motif. MUST tile seamlessly on all four edges so it can fill a large wall. No objects, just the wall surface.

### 2. layers/floor_tile.png
Cozy 16-bit pixel-art wooden plank floor, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Warm wood browns (#8a5a33 highlight to #5e3c20 shadow), vertical plank seams and light grain, with the top ~8 pixels a lighter polished surface edge. MUST tile seamlessly left-to-right (and acceptably top-to-bottom). No objects.

---

## Batch 2: Fixtures

### 3. objects/window.png
Cozy 16-bit pixel-art wall window, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Cream/tan wooden cross-frame (#e7d3b3) looking out on a sunny day: gradient sky (#9fd3ff to #d8f0ff), soft round sun (#fde68a) upper right, rolling green hills (#86c98a) along the bottom. Hangs flat on a wall, centered with transparent margin all around. Light from upper-left.

### 4. objects/rug.png
Cozy 16-bit pixel-art oval floor rug in slight top-down perspective, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Deep rose/wine center (#7f1d3a, #a83a5b) with a patterned woven border, wider than tall. Lying flat, resting on the bottom edge of the canvas, centered.

### 5. objects/shelf.png
Cozy 16-bit pixel-art wooden wall shelf / ledge seen straight on, 256x96 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Flat plank top (#8a5a33 surface, #6b4423 body, dark underside) with two small support brackets underneath. IMPORTANT: make the middle third a plain uniform plank that can be stretched horizontally without distortion; keep bracket detail near the left and right ends only.

### 6. objects/front_door.png
Cozy 16-bit pixel-art wooden front door seen straight on, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Warm wood (#7a4e2a body, #5b3920 frame) with two recessed panels and a small gold doorknob (#fcd34d). Tall and narrow, standing on the bottom edge of the canvas, centered. Light from upper-left.

---

## Batch 3: Wall pictures (one file each, same frame style across all six)

### 7. pictures/pic_1.png
Cozy 16-bit pixel-art framed wall picture, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Simple wooden frame (#8a6d3b) around a cream mat (#fcefd6), hung flat on the wall, centered with transparent margin. I will provide a reference image for the overall frame style; match its frame, mat, and proportions. Inside: a sleeping curled-up orange cat.

### 8. pictures/pic_2.png
Cozy 16-bit pixel-art framed wall picture, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Simple wooden frame (#8a6d3b) around a cream mat (#fcefd6), hung flat on the wall, centered with transparent margin. I will provide a reference image of the frame style; match its frame, mat, and proportions. Inside: a potted green plant.

### 9. pictures/pic_3.png
Cozy 16-bit pixel-art framed wall picture, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Simple wooden frame (#8a6d3b) around a cream mat (#fcefd6), hung flat on the wall, centered with transparent margin. I will provide a reference image of the frame style; match its frame, mat, and proportions. Inside: a ball of pink yarn (#ec4899).

### 10. pictures/pic_4.png
Cozy 16-bit pixel-art framed wall picture, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Simple wooden frame (#8a6d3b) around a cream mat (#fcefd6), hung flat on the wall, centered with transparent margin. I will provide a reference image of the frame style; match its frame, mat, and proportions. Inside: a sunny landscape with green hills and a soft sun.

### 11. pictures/pic_5.png
Cozy 16-bit pixel-art framed wall picture, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Simple wooden frame (#8a6d3b) around a cream mat (#fcefd6), hung flat on the wall, centered with transparent margin. I will provide a reference image of the frame style; match its frame, mat, and proportions. Inside: a round goldfish bowl.

### 12. pictures/pic_6.png
Cozy 16-bit pixel-art framed wall picture, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Simple wooden frame (#8a6d3b) around a cream mat (#fcefd6), hung flat on the wall, centered with transparent margin. I will provide a reference image of the frame style; match its frame, mat, and proportions. Inside: a tidy paw-print pattern.

---

## Batch 4: Furniture stations (floor-standing, base flush to bottom edge)

### 13. objects/desk_lamp.png
Cozy 16-bit pixel-art small wooden writing desk with an angled desk lamp glowing warm amber (#d97706) and a sheet of paper on top, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Floor-standing, base flush to the bottom edge, centered. Light from upper-left.

### 14. objects/bookshelf.png
Cozy 16-bit pixel-art short wooden bookshelf filled with colorful book spines (red, blue, green, yellow, violet), violet accent mood (#7c3aed), 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Floor-standing, base flush to the bottom edge, centered.

### 15. objects/computer.png
Cozy 16-bit pixel-art retro desktop computer: tower plus a monitor with a glowing sky-blue screen (#0ea5e9) and a small keyboard, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Floor-standing, base flush to the bottom edge, centered.

### 16. objects/toolbox.png
Cozy 16-bit pixel-art red metal toolbox (#b91c1c) with a handle and a couple of tools (wrench, screwdriver) beside it, green accent mood (#16a34a), 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Floor-standing, base flush to the bottom edge, centered.

### 17. objects/mailbox.png
Cozy 16-bit pixel-art classic rounded-top mailbox on a post with a raised red flag (#ef4444) and a letter slot, pink accent mood (#db2777), 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Base of the post flush to the bottom edge, centered.

---

## Batch 5: The cat (one separate 256x256 file per frame)

Every block below is its own image. The cat is the same character throughout:
an orange short-legged munchkin tabby with stubby legs, a long low body, cream
belly and chest, pink nose, big friendly eyes, and a striped tail, drawn in
profile facing RIGHT. In every frame the supporting paws rest exactly on the
bottom edge of the canvas and the body sits centered, so the frames line up when
swapped. I will provide a reference image of the cat; match its colors,
proportions, and shading in each one.

### 18. cat/idle_1.png (idle, frame 1 of 4)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, paws on the bottom edge, body centered. Pose: relaxed neutral stand, all four feet planted, eyes open, ears upright, tail resting low and curved gently behind. This is the rest pose of a gentle idle loop.

### 19. cat/idle_2.png (idle, frame 2 of 4)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, paws on the bottom edge, body centered. Pose: same neutral stand but breathing IN, chest and back lifted about 2 pixels higher, eyes open, tail swaying slightly to the left (toward the tail side). A small step in the idle loop.

### 20. cat/idle_3.png (idle, frame 3 of 4)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, paws on the bottom edge, body centered. Pose: neutral stand, eyes BLINKING (closed, drawn as two short curved lashes), body at rest height, tail centered. The blink frame of the idle loop.

### 21. cat/idle_4.png (idle, frame 4 of 4)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, paws on the bottom edge, body centered. Pose: neutral stand but breathing OUT, chest settled about 2 pixels lower than frame 1, eyes open, tail swaying slightly to the right. Closes the idle loop back toward frame 1.

### 22. cat/walk_1.png (walk, frame 1 of 8)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, paws on the bottom edge, body centered. Walk-cycle CONTACT pose: front-right leg reaching forward and planted, rear-left leg extended back, body at mid height, tail out behind for balance.

### 23. cat/walk_2.png (walk, frame 2 of 8)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, paws on the bottom edge, body centered. Walk-cycle DOWN/recoil pose: weight settling onto the front leg, body dipped about 2 pixels lower, rear leg beginning to lift and swing forward.

### 24. cat/walk_3.png (walk, frame 3 of 8)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, paws on the bottom edge, body centered. Walk-cycle PASSING pose: legs gathered under the body, the swinging rear leg passing beneath, body rising back to mid height, tail mid-sway.

### 25. cat/walk_4.png (walk, frame 4 of 8)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, paws on the bottom edge, body centered. Walk-cycle HIGH point: body lifted about 2 pixels at its tallest, the forward-swinging leg reaching ahead, ready to plant for the next contact.

### 26. cat/walk_5.png (walk, frame 5 of 8)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, paws on the bottom edge, body centered. Walk-cycle CONTACT pose, mirrored stride: the OTHER front leg now reaching forward and planted, opposite rear leg extended back, body at mid height.

### 27. cat/walk_6.png (walk, frame 6 of 8)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, paws on the bottom edge, body centered. Walk-cycle DOWN/recoil pose of the mirrored stride: body dipped about 2 pixels lower, weight on the front leg, opposite rear leg lifting.

### 28. cat/walk_7.png (walk, frame 7 of 8)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, paws on the bottom edge, body centered. Walk-cycle PASSING pose of the mirrored stride: legs gathered under the body, body rising back to mid height, tail mid-sway the other way.

### 29. cat/walk_8.png (walk, frame 8 of 8)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, paws on the bottom edge, body centered. Walk-cycle HIGH point of the mirrored stride: body at its tallest, the forward leg reaching ahead, ready to loop back to frame 1 (walk_1).

### 30. cat/jump_1.png (jump, launch)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, paws on the bottom edge, body centered. Pose: LAUNCH crouch, legs compressed and coiled, body squashed low and tense, ears up, tail curling, about to spring upward.

### 31. cat/jump_2.png (jump, apex)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, lowest paw on the bottom edge, body centered (keep the same foot baseline as every other frame). Pose: RISING / apex, body stretched slightly taller, front legs tucked up, rear legs trailing down to the bottom edge, tail streaming down behind, ears back from the upward motion.

### 32. cat/fall_1.png (fall, start)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, lowest paw on the bottom edge, body centered (keep the same foot baseline as every other frame). Pose: BEGINNING to fall, body near neutral length, ears up, front legs reaching down to the bottom edge to feel for the ground, tail raised for balance.

### 33. cat/fall_2.png (fall, fast)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, lowest paw on the bottom edge, body centered (keep the same foot baseline as every other frame). Pose: FAST fall, body stretched vertically (taller than neutral but feet still on the bottom edge), all four legs braced downward for impact, ears pinned back, tail streaming up. Reads as dropping quickly.

### 34. cat/land_1.png (land, impact)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, paws on the bottom edge, body centered. Pose: maximum landing SQUASH, body flattened wide and low on impact, legs splayed outward absorbing the hit, ears down, eyes scrunched.

### 35. cat/land_2.png (land, recover)
Cozy 16-bit pixel-art orange munchkin tabby cat (short stubby legs, long low body, cream belly, pink nose, big eyes, striped tail), profile facing right, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing, paws on the bottom edge, body centered. Pose: RECOVERING from the squash, body springing partway back up toward neutral, legs gathering under the body, ears lifting. Bridges the landing back to the idle/walk height.

---

## Batch 6: Items and FX

### 36. items/ball_sheet_1.png (one image, 2x2 grid = frames 1 to 4)
Cozy 16-bit pixel-art yarn-ball rolling animation, frames 1 to 4 of 8, arranged in a 2x2 grid on a single 512x512 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Each of the 4 cells holds one round ball of pink/magenta yarn (#ec4899 with #f9a8d4 highlights and visible wound strands), identical size and centered within its cell. The wound-strand pattern rotates clockwise across the frames so it reads as a smooth roll: top-left = 0 degrees, top-right = 45 degrees, bottom-left = 90 degrees, bottom-right = 135 degrees. Even gutter between cells, no grid lines or labels. I will provide a reference image of the yarn ball; match its color and winding style.

### 37. items/ball_sheet_2.png (one image, 2x2 grid = frames 5 to 8)
Cozy 16-bit pixel-art yarn-ball rolling animation, frames 5 to 8 of 8 (continuing the clockwise roll from sheet 1), arranged in a 2x2 grid on a single 512x512 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Each of the 4 cells holds one round ball of pink/magenta yarn (#ec4899 with #f9a8d4 highlights and visible wound strands), identical size and centered within its cell. The wound-strand pattern continues rotating clockwise: top-left = 180 degrees, top-right = 225 degrees, bottom-left = 270 degrees, bottom-right = 315 degrees. Even gutter between cells, no grid lines or labels. I will provide the same yarn-ball reference image used for sheet 1; match its color and winding style so both sheets are identical.

### 38. particles/sparkle.png
Cozy 16-bit pixel-art four-point sparkle / star twinkle in warm yellow-pink (#fcd34d, #f9a8d4), 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Centered, used for collect bursts.

### 39. particles/smoke.png
Cozy 16-bit pixel-art soft dust / smoke puff in pale cream (#d6c7a1, #efe3c4), 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Centered, used for jump and landing kicks.
