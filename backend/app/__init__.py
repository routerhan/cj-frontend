"""Backend application package for FastAPI risk assessment service."""

from __future__ import annotations

import sys

# Allow importing modules as `app.*` even when the package is loaded as `backend.app`.
sys.modules.setdefault("app", sys.modules[__name__])

