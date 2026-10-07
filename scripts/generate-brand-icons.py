from PIL import Image, ImageDraw, ImageFilter

def build_icon():
    # 1. Base 512x512 canvas
    badge = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(badge)

    # Draw solid dark obsidian squircle (#0a0c14) with electric cyan border
    draw.rounded_rectangle(
        [16, 16, 496, 496],
        radius=108,
        fill=(10, 12, 20, 255),
        outline=(56, 189, 248, 255),
        width=5
    )

    # 2. Add subtle radial glow on right side (neural network side)
    glow = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for r in range(220, 0, -4):
        alpha = int(45 * (1 - r / 220) ** 1.6)
        gd.ellipse([330 - r, 256 - r, 330 + r, 256 + r], fill=(56, 189, 248, alpha))
    
    # Clip glow to squircle
    mask = Image.new('L', (512, 512), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([16, 16, 496, 496], radius=108, fill=255)
    
    glow_clipped = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    glow_clipped.paste(glow, (0, 0), mask)
    badge = Image.alpha_composite(badge, glow_clipped)

    # 3. Process original brain strokes
    src = Image.open('assets/icon.png').convert('RGBA')
    W, H = src.size
    brain = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sp = src.load()
    bp = brain.load()

    for y in range(H):
        for x in range(W):
            _, _, _, a = sp[x, y]
            if a > 0:
                if x < 224:
                    # Crisp bright white for organic human lobe
                    bp[x, y] = (255, 255, 255, a)
                elif x > 230:
                    # Vibrant electric cyan (#38bdf8) for AI cyber neural net
                    bp[x, y] = (56, 189, 248, a)
                else:
                    # Center dividing seam
                    bp[x, y] = (160, 224, 252, a)

    # Soft ambient cyan drop shadow / glow behind the brain
    glow_layer = brain.filter(ImageFilter.GaussianBlur(radius=6))
    gp = glow_layer.load()
    for y in range(H):
        for x in range(W):
            r, g, b, a = gp[x, y]
            if a > 0:
                gp[x, y] = (56, 189, 248, int(a * 0.55))

    target_size = 356
    brain_resized = brain.resize((target_size, target_size), Image.Resampling.LANCZOS)
    glow_resized = glow_layer.resize((target_size, target_size), Image.Resampling.LANCZOS)

    offset = (512 - target_size) // 2
    
    glow_canvas = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    glow_canvas.paste(glow_resized, (offset, offset))

    brain_canvas = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    brain_canvas.paste(brain_resized, (offset, offset))

    badge = Image.alpha_composite(badge, glow_canvas)
    final_icon = Image.alpha_composite(badge, brain_canvas)

    final_icon.save('docs/assets/icon.png', 'PNG')
    print('Saved docs/assets/icon.png successfully')

    # Save favicon sizes
    final_icon.resize((32, 32), Image.Resampling.LANCZOS).save('docs/assets/favicon-32x32.png')
    final_icon.resize((16, 16), Image.Resampling.LANCZOS).save('docs/assets/favicon-16x16.png')
    final_icon.resize((180, 180), Image.Resampling.LANCZOS).save('docs/assets/apple-touch-icon.png')

    # Save SVG favicon
    import base64
    with open('docs/assets/icon.png', 'rb') as f:
        png_data = base64.b64encode(f.read()).decode('ascii')
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image width="512" height="512" href="data:image/png;base64,{png_data}"/>
</svg>'''
    with open('docs/assets/favicon.svg', 'w') as f:
        f.write(svg_content)
    print('Saved docs/assets/favicon.svg and all sizes!')

if __name__ == '__main__':
    build_icon()
