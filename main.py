"""
LearnPool API — re-exports the full backend app.
Run from learnpool/:  uvicorn main:app --reload --port 8000
Or from backend/:    uvicorn main:app --reload --port 8000
"""
import importlib.util
import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent / "backend"
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

_backend_main = _backend_dir / "main.py"
_spec = importlib.util.spec_from_file_location("backend_main", _backend_main)
_backend = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_backend)

app = _backend.app
