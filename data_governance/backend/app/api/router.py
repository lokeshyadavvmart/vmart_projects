from fastapi import APIRouter
from app.api.routes.duplicate_item import router as duplicate_item_router
from app.api.routes.color_variant import router as color_variant_router
from app.api.routes.same_style_diff_design import router as same_style_router  # direct file import
from app.api.routes.anomaly import router as anomaly_router

api_router = APIRouter()

api_router.include_router(duplicate_item_router, prefix="/duplicate-items", tags=["Duplicate Items"])
api_router.include_router(color_variant_router, prefix="/color-variants", tags=["Color Variants"])
api_router.include_router(same_style_router, prefix="/same-style-diff-design", tags=["Same Style Diff Design"])
api_router.include_router(anomaly_router, prefix="/anomalies", tags=["Anomalies"])
