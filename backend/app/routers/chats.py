"""CRUD router for Chats + AI streaming endpoint.

Thin HTTP layer: validates request, delegates to ChatService / ai_chat_service,
translates service results/errors to HTTP responses.

Chat creation/deletion keeps the User's chats[] in sync (handled by the service).
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.core.auth import get_current_user
from app.db.helpers import DatabaseNotAvailableError
from app.schemas import ChatResponse, ChatStreamRequest, ChatUpdate
from app.services import ai_chat_service, chat_service

router = APIRouter(prefix="/chats", tags=["chats"])


def _to_response(doc: dict) -> ChatResponse:
    """Map a raw Mongo doc to the API response schema, stripping _id."""
    return ChatResponse(
        chatId=doc["chatId"],
        userId=doc["userId"],
        createdAt=doc["createdAt"],
    )


@router.get("", response_model=list[ChatResponse])
async def list_chats(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[ChatResponse]:
    try:
        docs = await chat_service.list_all(user_id=current_user["userId"])
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    return [_to_response(doc) for doc in docs]


@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ChatResponse:
    try:
        doc = await chat_service.find_by_id(chat_id)
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    if doc is None:
        raise HTTPException(status_code=404, detail="Chat not found")
    if doc["userId"] != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return _to_response(doc)


@router.post("", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def create_chat(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ChatResponse:
    try:
        doc = await chat_service.create(current_user["userId"])
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    if doc is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_response(doc)


@router.put("/{chat_id}", response_model=ChatResponse)
async def update_chat(
    chat_id: str,
    body: ChatUpdate,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ChatResponse:
    # exclude_unset=True means only fields the client actually sent get updated.
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "userId" in update_data:
        raise HTTPException(status_code=400, detail="Chat owner cannot be changed")

    try:
        existing = await chat_service.find_by_id(chat_id)
        if existing is None:
            raise HTTPException(status_code=404, detail="Chat not found")
        if existing["userId"] != current_user["userId"]:
            raise HTTPException(status_code=403, detail="Forbidden")
        doc = await chat_service.update(chat_id, update_data)
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    if doc is None:
        raise HTTPException(status_code=404, detail="Chat not found")
    return _to_response(doc)


@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    chat_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> None:
    try:
        existing = await chat_service.find_by_id(chat_id)
        if existing is None:
            raise HTTPException(status_code=404, detail="Chat not found")
        if existing["userId"] != current_user["userId"]:
            raise HTTPException(status_code=403, detail="Forbidden")
        deleted = await chat_service.delete(chat_id)
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    if not deleted:
        raise HTTPException(status_code=404, detail="Chat not found")


# ── AI Streaming Endpoint ─────────────────────────────────────────────


@router.post("/{chat_id}/messages/stream")
async def stream_chat_message(
    chat_id: str,
    body: ChatStreamRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> StreamingResponse:
    """Stream an AI response for the given chat.

    The user message is saved immediately. Tokens arrive as SSE events.
    The assistant message is persisted after the stream completes.

    SSE event contract:
        data: {"type":"token","content":"..."}\\n\\n
        data: {"type":"done","messageId":"..."}\\n\\n
        data: {"type":"error","message":"..."}\\n\\n

    The authenticated user comes from the Authorization bearer token; the
    frontend only sends the message content and optional historyLimit.
    """
    return StreamingResponse(
        ai_chat_service.stream_ai_response(
            chat_id=chat_id,
            user_id=current_user["userId"],
            content=body.content,
            history_limit=body.historyLimit,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
