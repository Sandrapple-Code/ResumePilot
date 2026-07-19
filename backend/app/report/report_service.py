import os
import json
import logging
from typing import Dict, Any, Optional
from app.config import settings
from app.report.report_models import CareerReport
from app.report.report_builder import ReportBuilder

logger = logging.getLogger("app.report.report_service")

class ReportService:
    def __init__(self, upload_dir: str = settings.UPLOAD_DIR, uid: Optional[str] = None):
        if uid:
            self.upload_dir = os.path.join(upload_dir, uid)
        else:
            self.upload_dir = upload_dir

    def _get_report_path(self, upload_id: str) -> str:
        return os.path.join(self.upload_dir, f"report_{upload_id}.json")

    def get_report(self, upload_id: str) -> Optional[CareerReport]:
        """Loads and returns a CareerReport for a given upload_id, or None if it doesn't exist."""
        if not upload_id:
            return None
        path = self._get_report_path(upload_id)
        if not os.path.exists(path):
            logger.info(f"Report for upload_id {upload_id} not found at {path}")
            return None
        
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return CareerReport.model_validate(data)
        except Exception as e:
            logger.error(f"Error loading report for upload_id {upload_id}: {str(e)}")
            return None

    def save_report(self, upload_id: str, report: CareerReport) -> None:
        """Saves a CareerReport as a JSON file."""
        if not upload_id:
            return
        
        os.makedirs(self.upload_dir, exist_ok=True)
        path = self._get_report_path(upload_id)
        try:
            with open(path, "w", encoding="utf-8") as f:
                f.write(report.model_dump_json(indent=2))
            logger.info(f"Report for upload_id {upload_id} saved to {path}")
        except Exception as e:
            logger.error(f"Error saving report for upload_id {upload_id}: {str(e)}")

    def generate_and_save_report(self, upload_id: str, graph_output: Dict[str, Any], parsed_resume: Dict[str, Any], target_role: str) -> CareerReport:
        """Generates, saves, and returns a CareerReport."""
        report = ReportBuilder.build_report(graph_output, parsed_resume, target_role)
        self.save_report(upload_id, report)
        return report
