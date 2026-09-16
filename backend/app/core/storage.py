import os
import shutil
from abc import ABC, abstractmethod
from typing import BinaryIO
from app.core.config import settings


class StorageBackend(ABC):
    @abstractmethod
    def save_file(self, file_obj: BinaryIO, filename: str, subfolder: str = "") -> str:
        pass

    @abstractmethod
    def get_file_path(self, relative_path: str) -> str:
        pass


class LocalStorageBackend(StorageBackend):
    def __init__(self, base_dir: str = settings.LOCAL_STORAGE_DIR):
        self.base_dir = os.path.abspath(base_dir)
        os.makedirs(self.base_dir, exist_ok=True)

    def save_file(self, file_obj: BinaryIO, filename: str, subfolder: str = "") -> str:
        target_dir = os.path.join(self.base_dir, subfolder) if subfolder else self.base_dir
        os.makedirs(target_dir, exist_ok=True)

        target_path = os.path.join(target_dir, filename)
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file_obj, buffer)

        # Return relative storage path
        return os.path.join(subfolder, filename) if subfolder else filename

    def get_file_path(self, relative_path: str) -> str:
        full_path = os.path.join(self.base_dir, relative_path)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"File not found: {relative_path}")
        return full_path


def get_storage() -> StorageBackend:
    # Extensible for S3StorageBackend in production
    return LocalStorageBackend()
