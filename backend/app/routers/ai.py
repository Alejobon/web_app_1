"""Direct AI HTTP endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.core.auth import SupabasePrincipal, get_supabase_principal
from app.schemas import DirectAIStreamRequest
from app.services import direct_ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/stream")
async def stream_direct_ai_message(
    body: DirectAIStreamRequest,
    _principal: SupabasePrincipal = Depends(get_supabase_principal),
) -> StreamingResponse:
    """Stream a direct AI response without chat/message persistence."""
    return StreamingResponse(
        direct_ai_service.stream_direct_ai_response(message=body.message),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
