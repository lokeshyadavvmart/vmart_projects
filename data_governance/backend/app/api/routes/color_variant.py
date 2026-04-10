#D:\work\vmart_projects\data_governance\backend\app\api\routes\color_variant.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from io import StringIO
import csv

from app.schemas.common import QueryParams
from app.services.color_variant_service import get_color_variants, get_full_color_variants

router = APIRouter()

# -----------------------------
# POST endpoint with filters + infinite scroll
# -----------------------------
@router.post("/")
def fetch_color_variants_endpoint(params: QueryParams):
    previous_distincts = getattr(params, "previous_distincts", None)
    return get_color_variants(params, previous_distincts)

# -----------------------------
# GET endpoint for full CSV export
# -----------------------------
@router.get("/export-full-report")
def export_full_color_variants(
    vendor: str = None,
    site_code: str = None,
    fabric: str = None
):
    filters = {}
    if vendor:
        filters["vendor"] = vendor
    if site_code:
        filters["site_code"] = site_code
    if fabric:
        filters["fabric"] = fabric

    rows, columns = get_full_color_variants(filters)

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(columns)
    writer.writerows(rows)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=color_variants_full_report.csv"}
    )