from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class RegisterRequest(BaseModel):
    name:     str = Field(..., min_length=2, max_length=100)
    email:    EmailStr
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class ChatRequest(BaseModel):
    message:         str = Field(..., min_length=1, max_length=4000)
    conversation_id: Optional[int] = None


class MessageOut(BaseModel):
    id:         int
    role:       str
    content:    str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id:         int
    title:      str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileUpdateRequest(BaseModel):
    name:  str = Field(..., min_length=2, max_length=100)
    email: EmailStr


class PasswordUpdateRequest(BaseModel):
    current_password: str
    new_password:     str = Field(..., min_length=6)

