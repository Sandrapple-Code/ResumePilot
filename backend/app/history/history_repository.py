import os
import json
import logging
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("app.history.repository")

class HistoryRepository:
    def __init__(self, filepath: Optional[str] = None):
        if filepath is None:
            self.filepath = os.path.join(settings.UPLOAD_DIR, "history.json")
        else:
            self.filepath = filepath

    def get_all(self) -> List[Dict[str, Any]]:
        """Retrieves all version history entries."""
        if not os.path.exists(self.filepath):
            return []
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to read history registry from {self.filepath}: {str(e)}")
            return []

    def save_all(self, entries: List[Dict[str, Any]]) -> bool:
        """Overwrites the version history registry."""
        try:
            os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(entries, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            logger.error(f"Failed to write history registry to {self.filepath}: {str(e)}")
            return False

    def add(self, entry: Dict[str, Any]) -> None:
        """Appends a single entry to the version history."""
        entries = self.get_all()
        entries.append(entry)
        self.save_all(entries)

    def clear(self) -> None:
        """Wipes the version history database."""
        if os.path.exists(self.filepath):
            try:
                os.remove(self.filepath)
                logger.info(f"Cleared version history at {self.filepath}")
            except Exception as e:
                logger.error(f"Failed to delete history file: {str(e)}")
