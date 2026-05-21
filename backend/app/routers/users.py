"""CRUD router for Users.

Thin HTTP layer: validates request, delegates to UserService,
translates service results/errors to HTTP responses.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.auth import get_current_user
from app.db.helpers import DatabaseNotAvailableError
from app.schemas import UserCreate, UserResponse, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


def _to_response(doc: dict) -> UserResponse:
    """Map a raw Mongo doc to the API response schema, stripping _id."""
    return UserResponse(
        userId=doc["userId"],
        authProvider=doc.get("authProvider"),
        authProviderUserId=doc.get("authProviderUserId"),
        email=doc.get("email"),
        username=doc["username"],
        personality=doc.get("personality", {}),
        chats=doc.get("chats", []),
    )


@router.get("", response_model=list[UserResponse])
async def list_users(current_user: dict[str, Any] = Depends(get_current_user)) -> list[UserResponse]:
    """Return only the authenticated user.

    Listing every user is not exposed without an admin authorization model.
    """
    return [_to_response(current_user)]


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict[str, Any] = Depends(get_current_user)) -> UserResponse:
    return _to_response(current_user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> UserResponse:
    if user_id != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        doc = await user_service.find_by_id(user_id)
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    if doc is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_response(doc)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(body: UserCreate) -> UserResponse:
    try:
        doc = await user_service.create(body.username, body.personality)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Username already exists")
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    return _to_response(doc)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    body: UserUpdate,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> UserResponse:
    if user_id != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    # exclude_unset=True: only fields the client explicitly sent get patched.
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        doc = await user_service.update(user_id, update_data)
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    if doc is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_response(doc)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> None:
    if user_id != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        deleted = await user_service.delete(user_id)
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
