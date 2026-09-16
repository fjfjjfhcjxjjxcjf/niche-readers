import os
import tempfile
import zipfile
from app.db.seed import generate_minimal_epub


def test_generate_minimal_epub():
    with tempfile.TemporaryDirectory() as temp_dir:
        test_file = os.path.join(temp_dir, "test.epub")
        generate_minimal_epub(
            file_path=test_file,
            title="Unit Test Book",
            author="Tester",
            body_text="Testing content stream."
        )

        assert os.path.exists(test_file)
        with zipfile.ZipFile(test_file, "r") as zf:
            file_list = zf.namelist()
            assert "mimetype" in file_list
            assert "META-INF/container.xml" in file_list
            assert "OEBPS/content.opf" in file_list
            assert "OEBPS/chapter1.xhtml" in file_list
            assert zf.read("mimetype").decode("utf-8") == "application/epub+zip"