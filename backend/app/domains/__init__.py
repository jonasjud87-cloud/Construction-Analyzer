from app.domains.base import BaseDomain
from app.domains.bau.domain import BauDomain

DOMAINS: dict[str, BaseDomain] = {
    "bau": BauDomain(),
}


def get_domain(domain_id: str) -> BaseDomain:
    if domain_id not in DOMAINS:
        raise ValueError(f"Unbekannte Domain: {domain_id}")
    return DOMAINS[domain_id]
