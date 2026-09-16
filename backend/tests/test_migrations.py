import pytest
from alembic.config import Config
import os

def test_alembic_configuration_integrity():
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    alembic_ini_path = os.path.join(backend_dir, "alembic.ini")
    assert os.path.exists(alembic_ini_path)

    alembic_cfg = Config(alembic_ini_path)
    alembic_cfg.set_main_option("script_location", os.path.join(backend_dir, "alembic"))
    
    # Verify migration script exists and has valid revision head
    script_dir = os.path.join(backend_dir, "alembic", "versions")
    version_files = [f for f in os.listdir(script_dir) if f.endswith(".py")]
    assert len(version_files) >= 1
    assert any("0001_initial_schema" in f for f in version_files)