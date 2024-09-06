import os
from PIL import Image

L = 256
step = 20
pathname = "static/sprites_gridded/"
os.makedirs("static/sprites", exist_ok=True)
filenames = next(os.walk("static/sprites_gridded"), (None, None, []))[2]
for file in filenames:
    original = Image.open(pathname + file)
    new_image = Image.new("RGBA", (L * step, L))

    count = 0
    for row in range(4):
        for i in range(6):
            cropped = original.crop((
                L * i,
                row * L,
                L * (i + 1),
                (row + 1) * L
            ))
            new_image.paste(cropped, (count * L, 0))
            count += 1
            if count == step:
                break
    new_image.save(f"static/sprites/Idle{(int(file.split(".")[0][-1]) - 4) % 8}.png")