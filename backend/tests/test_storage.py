import io
import os
import shutil
import tempfile
from app.core.storage import LocalStorageBackend


def test_local_storage_lifecycle():
    temp_dir = tempfile.mkdtemp()
    try:
        storage = LocalStorageBackend(base_dir=temp_dir)
        sample_content = b"Sample EPUB Content Stream"
        file_obj = io.BytesIO(sample_content)

        relative_path = storage.save_file(file_obj, "test_book.epub", subfolder="manuscripts")
        assert relative_path == os.path.join("manuscripts", "test_book.epub")

        full_path = storage.get_file_path(relative_path)
        assert os.path.exists(full_path)

        with open(full_path, "rb") as f:
            assert f.read() == sample_content
    finally:
        shutil.rmtree(temp_dir)