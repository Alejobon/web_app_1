"""Pydantic schemas for request/response data.

Each entity lives in its own module under this package.
All public names are re-exported here for convenience::

    from app.schemas import UserCreate, ChatResponse, ...
"""

from app.schemas.chat import ChatCreate, ChatResponse, ChatUpdate
from app.schemas.chat_stream import ChatStreamRequest
from app.schemas.direct_ai import DirectAIStreamRequest
from app.schemas.message import MessageCreate, MessageResponse, MessageUpdate
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.schemas.user import UserCreate, UserResponse, UserUpdate

__all__ = [
    # user
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    # chat
    "ChatCreate",
    "ChatUpdate",
    "ChatResponse",
    # chat stream
    "ChatStreamRequest",
    # direct AI
    "DirectAIStreamRequest",
    # message
    "MessageCreate",
    "MessageUpdate",
    "MessageResponse",
    # task
    "TaskCreate",
    "TaskUpdate",
    "TaskResponse",
]
