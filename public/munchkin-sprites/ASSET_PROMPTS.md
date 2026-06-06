# Munchkin Cat sprite generation prompts

Each numbered block below is fully self-contained. Copy one block into your
image generator and it will produce a sprite that matches the rest of the set.
Save each result to the path given in its heading (the engine already looks for
these filenames).

Shared conventions baked into every prompt:

- Output 256x256 PNG, transparent background.
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
Cozy 16-bit pixel-art framed wall picture, 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Simple wooden frame (#8a6d3b) around a cream mat (#fcefd6); inside, a sleeping curled-up orange cat. Centered with transparent margin, hung flat on the wall.

### 8. pictures/pic_2.png
Same framed wall picture style as pic_1 (256x256 transparent PNG, pixel art, wooden #8a6d3b frame, cream #fcefd6 mat). Inside: a potted green plant.

### 9. pictures/pic_3.png
Same framed wall picture style as pic_1 (256x256 transparent PNG, pixel art, wooden #8a6d3b frame, cream #fcefd6 mat). Inside: a ball of pink yarn (#ec4899).

### 10. pictures/pic_4.png
Same framed wall picture style as pic_1 (256x256 transparent PNG, pixel art, wooden #8a6d3b frame, cream #fcefd6 mat). Inside: a sunny landscape with green hills and a soft sun.

### 11. pictures/pic_5.png
Same framed wall picture style as pic_1 (256x256 transparent PNG, pixel art, wooden #8a6d3b frame, cream #fcefd6 mat). Inside: a round goldfish bowl.

### 12. pictures/pic_6.png
Same framed wall picture style as pic_1 (256x256 transparent PNG, pixel art, wooden #8a6d3b frame, cream #fcefd6 mat). Inside: a tidy paw-print pattern.

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

## Batch 5: The cat (orange short-legged munchkin tabby, cream belly, pink nose, big eyes; facing right; feet on bottom edge; identical alignment across frames)

### 18. cat/idle_1.png ... cat/idle_4.png (4 frames)
Cozy 16-bit pixel-art orange munchkin tabby cat (short legs, long low body, cream belly, pink nose, big friendly eyes), facing right, 256x256 transparent PNG each, nearest-neighbor crisp pixels, no anti-aliasing. A 4-frame gentle idle: subtle breathing and tail sway, with a blink on one frame. Feet flush to the bottom edge, body centered, identical alignment across all 4 frames.

### 19. cat/walk_1.png ... cat/walk_8.png (8 frames)
Same orange munchkin tabby, facing right, 256x256 transparent PNG each, pixel art, nearest-neighbor, no anti-aliasing. A smooth 8-frame walk cycle: short legs stepping, tail and body bob. Consistent baseline and center so the frames align when played in sequence.

### 20. cat/jump_1.png, cat/jump_2.png (2 frames)
Same orange munchkin tabby, facing right, 256x256 transparent PNG each, pixel art, nearest-neighbor, no anti-aliasing. Frame 1: launch crouch (legs compressed, pushing off). Frame 2: rising / apex (body stretched slightly upward, legs tucked). Same feet baseline as the other sets.

### 21. cat/fall_1.png, cat/fall_2.png (2 frames)
Same orange munchkin tabby, facing right, 256x256 transparent PNG each, pixel art, nearest-neighbor, no anti-aliasing. Frame 1: beginning to fall (ears up, legs reaching). Frame 2: fast fall (body stretched vertically, braced for landing).

### 22. cat/land_1.png, cat/land_2.png (2 frames)
Same orange munchkin tabby, facing right, 256x256 transparent PNG each, pixel art, nearest-neighbor, no anti-aliasing. Frame 1: maximum landing squash (body flattened wide on impact). Frame 2: recovering toward a neutral standing pose.

---

## Batch 6: Items and FX

### 23. items/ball_1.png ... items/ball_7.png (7 frames)
Cozy 16-bit pixel-art round ball of pink/magenta yarn (#ec4899 with #f9a8d4 highlights and visible wound strands), 256x256 transparent PNG each, nearest-neighbor crisp pixels, no anti-aliasing. A 7-frame rolling animation where the strand pattern rotates so it reads as rolling. Centered, identical size each frame.

### 24. particles/sparkle.png
Cozy 16-bit pixel-art four-point sparkle / star twinkle in warm yellow-pink (#fcd34d, #f9a8d4), 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Centered, used for collect bursts.

### 25. particles/smoke.png
Cozy 16-bit pixel-art soft dust / smoke puff in pale cream (#d6c7a1, #efe3c4), 256x256 transparent PNG, nearest-neighbor crisp pixels, no anti-aliasing. Centered, used for jump and landing kicks.
