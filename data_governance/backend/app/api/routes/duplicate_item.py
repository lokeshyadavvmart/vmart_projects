from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from io import StringIO
import csv

from app.schemas.common import QueryParams
from app.services.duplicate_item_service import get_duplicate_items, get_full_duplicate_items

router = APIRouter()

# ------------------------
# Main endpoint (updated to pass previous_distincts)
# ------------------------
@router.post("/")
def fetch_duplicate_items_endpoint(params: QueryParams):
    previous_distincts = getattr(params, "previous_distincts", None)
    return get_duplicate_items(params, previous_distincts)

# ------------------------
# Full export (unchanged)
# ------------------------
@router.get("/export-full-report")
def export_full_duplicate_items(vendor: str = None, site_code: str = None):
    filters = {}
    if vendor:
        filters["vendor"] = vendor
    if site_code:
        filters["site_code"] = site_code

    rows, columns = get_full_duplicate_items(filters)

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(columns)
    writer.writerows(rows)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=duplicate_items_full_report.csv"}
    )