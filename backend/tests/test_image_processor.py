import io
from PIL import Image
from app.core.image_processor import optimize_cover_image


def test_optimize_cover_image_to_webp():
    # Create an oversized mock PNG image in memory (1200x1800)
    orig_img = Image.new("RGB", (1200, 1800), color="crimson")
    raw_io = io.BytesIO()
    orig_img.save(raw_io, format="PNG")
    raw_bytes = raw_io.getvalue()

    # Process through pipeline
    optimized_bytes = optimize_cover_image(raw_bytes, max_width=600, max_height=900)

    # Validate output format and bounds
    with Image.open(io.BytesIO(optimized_bytes)) as result_img:
        assert result_img.format == "WEBP"
        assert result_img.width <= 600
        assert result_img.height <= 900
        # Compression ratio check: WebP should be significantly smaller than raw PNG
        assert len(optimized_bytes) < len(raw_bytes)
