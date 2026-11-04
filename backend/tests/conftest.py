import sys
from pathlib import Path

# Ensure backend root directory is added to sys.path for test discovery and execution
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
