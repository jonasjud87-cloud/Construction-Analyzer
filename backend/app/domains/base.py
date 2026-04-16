from abc import ABC, abstractmethod
from app.models.schemas import AnalysisItemOut


class BaseDomain(ABC):
    domain_id: str
    display_name: str

    @abstractmethod
    def get_analysis_prompt(self, context: dict) -> str:
        """System-Prompt für Plan-Analyse (mit Prompt Caching)."""
        ...

    @abstractmethod
    def get_standards_search_prompt(self, location: dict) -> str:
        """Prompt für Normen-Recherche via Claude Web Search."""
        ...

    @abstractmethod
    def parse_analysis_result(self, raw: str) -> list[AnalysisItemOut]:
        """Parst Claude JSON-Output zu strukturierten AnalysisItems."""
        ...
