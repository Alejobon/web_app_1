"""CRUD router for Messages.

Thin HTTP layer: validates request, delegates to MessageService,
translates service results/errors to HTTP responses.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.auth import get_current_user
from app.db.helpers import DatabaseNotAvailableError
from app.llm.sanitizers import sanitize_llm_output
from app.schemas import MessageCreate, MessageResponse, MessageUpdate
from app.services import chat_service, message_service

router = APIRouter(prefix="/messages", tags=["messages"])


def _to_response(doc: dict) -> MessageResponse:
    """Map a raw Mongo doc to the API response schema, stripping _id."""
    content = doc["content"]
    if doc["role"] == "assistant":
        content = sanitize_llm_output(content)

    return MessageResponse(
        messageId=doc["messageId"],
        chatId=doc["chatId"],
        role=doc["role"],
        content=content,
        createdAt=doc["createdAt"],
    )


@router.get("", response_model=list[MessageResponse])
async def list_messages(
    chat_id: str = Query(..., description="Filter by chatId"),
    limit: int = Query(default=50, ge=1, le=200, description="Max messages to return"),
    sort: str = Query(default="desc", description="Sort order: asc or desc"),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[MessageResponse]:
    try:
        await _ensure_chat_owner(chat_id, current_user)
        docs = await message_service.list_all(
            chat_id=chat_id, limit=limit, sort=sort,
        )
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    return [_to_response(doc) for doc in docs]


@router.get("/latest/{chat_id}", response_model=MessageResponse)
async def get_latest_message(
    chat_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> MessageResponse:
    """Return the most recent message for a given chat.

    Uses MongoDB's sort+limit(1) pattern on createdAt to efficiently
    grab the last message without loading the full message history.
    This is the recommended way to build chat preview cards in a list.
    """
    try:
        await _ensure_chat_owner(chat_id, current_user)
        doc = await message_service.find_latest_by_chat(chat_id)
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    if doc is None:
        raise HTTPException(status_code=404, detail="No messages found for this chat")
    return _to_response(doc)


@router.get("/{message_id}", response_model=MessageResponse)
async def get_message(
    message_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> MessageResponse:
    try:
        doc = await message_service.find_by_id(message_id)
        if doc is not None:
            await _ensure_chat_owner(doc["chatId"], current_user)
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    if doc is None:
        raise HTTPException(status_code=404, detail="Message not found")
    return _to_response(doc)


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    body: MessageCreate,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> MessageResponse:
    if body.role != "user":
        raise HTTPException(
            status_code=400,
            detail="Clients can only create user messages via this endpoint",
        )
    try:
        await _ensure_chat_owner(body.chatId, current_user)
        doc = await message_service.create(body.chatId, body.role, body.content)
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    return _to_response(doc)


@router.put("/{message_id}", response_model=MessageResponse)
async def update_message(
    message_id: str,
    body: MessageUpdate,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> MessageResponse:
    # exclude_unset=True: only fields the client explicitly sent get patched.
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "role" in update_data and update_data["role"] != "user":
        raise HTTPException(
            status_code=400,
            detail="Clients can only persist user-role messages via this endpoint",
        )

    try:
        existing = await message_service.find_by_id(message_id)
        if existing is None:
            raise HTTPException(status_code=404, detail="Message not found")
        await _ensure_chat_owner(existing["chatId"], current_user)
        if existing["role"] != "user":
            raise HTTPException(
                status_code=400,
                detail="Only user messages can be edited via this endpoint",
            )
        doc = await message_service.update(message_id, update_data)
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    if doc is None:
        raise HTTPException(status_code=404, detail="Message not found")
    return _to_response(doc)


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> None:
    try:
        existing = await message_service.find_by_id(message_id)
        if existing is None:
            raise HTTPException(status_code=404, detail="Message not found")
        await _ensure_chat_owner(existing["chatId"], current_user)
        deleted = await message_service.delete(message_id)
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    if not deleted:
        raise HTTPException(status_code=404, detail="Message not found")


async def _ensure_chat_owner(chat_id: str, current_user: dict[str, Any]) -> None:
    """Raise if the chat does not belong to the authenticated user."""
    chat = await chat_service.find_by_id(chat_id)
    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat["userId"] != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Forbidden")
