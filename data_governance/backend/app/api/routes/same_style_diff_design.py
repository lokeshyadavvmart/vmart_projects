from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from io import StringIO
import csv

from app.schemas.common import QueryParams
from app.services.same_style_diff_design_service import (
    get_same_style_diff_design,
    get_full_same_style_diff_design
)

router = APIRouter()

# -----------------------------
# POST endpoint: filtered fetch with infinite scroll
# -----------------------------
@router.post("/")
def fetch_same_styles(params: QueryParams):
    previous_distincts = getattr(params, "previous_distincts", None)
    return get_same_style_diff_design(params, previous_distincts)

# -----------------------------
# GET endpoint: full CSV export
# -----------------------------
@router.get("/export-full-report")
def export_full_same_styles(
    vendor: str = None,
    site_code: str = None,
    color_or_style: str = None
):
    filters = {}
    if vendor:
        filters["vendor"] = vendor
    if site_code:
        filters["site_code"] = site_code
    if color_or_style:
        filters["color_or_style"] = color_or_style

    rows, columns = get_full_same_style_diff_design(filters)

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(columns)
    writer.writerows(rows)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=same_style_diff_design_full_report.csv"}
    )