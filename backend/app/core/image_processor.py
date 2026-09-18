import io
from PIL import Image, ImageOps


def optimize_cover_image(
    file_bytes: bytes,
    max_width: int = 800,
    max_height: int = 1200,
    quality: int = 82
) -> bytes:
    """
    Normalizes image orientation, scales within bounds while maintaining aspect ratio,
    and converts to optimized WebP format.
    """
    with Image.open(io.BytesIO(file_bytes)) as img:
        # Correct mobile image orientation from EXIF if present
        img = ImageOps.exif_transpose(img)

        # Convert to RGB (dropping alpha channel if converting from RGBA/PNG for consistent compression)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # Resize preserving aspect ratio
        img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

        output_io = io.BytesIO()
        img.save(output_io, format="WEBP", quality=quality, optimize=True)
        output_io.seek(0)
        return output_io.getvalue()
