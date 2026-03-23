from pydantic import BaseModel
from typing import Optional, Dict, List


class DateRange(BaseModel):
    from_date: Optional[str] = None
    to_date: Optional[str] = None


class QueryParams(BaseModel):
    filters: Optional[Dict[str, List[str]]] = {}
    date_range: Optional[DateRange] = None
    limit: int = 50
    cursor: Optional[str] = None