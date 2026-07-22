"""Create the subtle animated homepage avatar from the original pixel artwork."""

from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw


def layered_breathe_frame(
    source: Image.Image,
    background: tuple[int, int, int],
    head_rise: int,
) -> Image.Image:
    # Keep the face, glasses, and main hair mass rigid. The upper block rises as
    # one piece while only the torso block stretches to meet the anchored hem.
    left, top, right, split, bottom = 80, 85, 790, 585, 813
    head = source.crop((left, top, right, split))
    torso = source.crop((left, split, right, bottom))
    torso_height = torso.height + head_rise
    torso = torso.resize((torso.width, torso_height), Image.Resampling.NEAREST)

    frame = Image.new('RGB', source.size, background)
    frame.paste(torso, (left, bottom - torso_height))
    frame.paste(head, (left, top - head_rise))
    return frame


def sway_hair(
    frame: Image.Image,
    offset_x: int,
) -> None:
    # Only echo the loose tip below the chin. Keeping the original pixels underneath
    # avoids the holes that can appear when a masked pixel cluster is moved away.
    left, top, right, bottom = 685, 625, 735, 720
    region = frame.crop((left, top, right, bottom))
    pixels = region.load()
    hair_mask = Image.new('L', region.size, 0)
    mask_pixels = hair_mask.load()

    for y in range(region.height):
        for x in range(region.width):
            red, green, blue = pixels[x, y]
            is_brown = red > 65 and red > green * 1.12 and green > blue * 0.8
            if is_brown:
                mask_pixels[x, y] = 255

    frame.paste(region, (left + offset_x, top), hair_mask)


def blink(frame: Image.Image, amount: int) -> None:
    if amount == 0:
        return

    draw = ImageDraw.Draw(frame)
    skin = (231, 183, 151)
    eye = (51, 34, 26)
    left, right = 651, 670
    top, bottom = 357, 395

    if amount == 1:
        draw.rectangle((left, top, right, top + 20), fill=skin)
    else:
        draw.rectangle((left, top, right, bottom), fill=skin)
        draw.rectangle((left, top + 18, right, top + 25), fill=eye)


def make_frame(
    source: Image.Image,
    background: tuple[int, int, int],
    head_rise: int,
    hair_x: int,
    blink_amount: int,
) -> Image.Image:
    pose = source.copy()
    sway_hair(pose, hair_x)
    blink(pose, blink_amount)
    return layered_breathe_frame(pose, background, head_rise)


def save_preview(frames: list[Image.Image], destination: Path) -> None:
    columns = 8 if len(frames) > 16 else 4
    thumb_size = 154 if len(frames) > 16 else 232
    rows = math.ceil(len(frames) / columns)
    preview = Image.new(
        'RGB',
        (thumb_size * columns, thumb_size * rows),
        frames[0].getpixel((0, 0)),
    )
    for index, frame in enumerate(frames):
        thumb = frame.resize((thumb_size, thumb_size), Image.Resampling.NEAREST)
        preview.paste(
            thumb,
            ((index % columns) * thumb_size, (index // columns) * thumb_size),
        )
    destination.parent.mkdir(parents=True, exist_ok=True)
    preview.save(destination)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--preview', type=Path)
    args = parser.parse_args()

    source = Image.open(args.source).convert('RGB')
    background = source.getpixel((0, 0))
    # Two continuous breathing cycles per GIF loop. The second cycle contains
    # one blink, so blinking is not mechanically tied to every breath.
    breath_cycle = [
        (0, 0),
        (1, 0),
        (2, 1),
        (3, 1),
        (4, 2),
        (3, 2),
        (2, 1),
        (1, 1),
        (0, 0),
        (-1, 0),
        (-2, -1),
        (-3, -1),
        (-4, -2),
        (-3, -2),
        (-2, -1),
        (-1, -1),
    ]
    choreography = []
    for cycle in range(2):
        for index, (head_rise, hair_x) in enumerate(breath_cycle):
            blink_amount = 0
            if cycle == 1 and index in (6, 8):
                blink_amount = 1
            elif cycle == 1 and index == 7:
                blink_amount = 2
            choreography.append((head_rise, hair_x, blink_amount, 140))
    frames = [
        make_frame(source, background, breathe, hair, eye)
        for breathe, hair, eye, _ in choreography
    ]
    durations = [duration for _, _, _, duration in choreography]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(
        args.output,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        disposal=1,
        optimize=False,
    )

    if args.preview:
        save_preview(frames, args.preview)


if __name__ == '__main__':
    main()
