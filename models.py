from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(100))
    email      = Column(String(150), unique=True, index=True)
    password   = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())

    conversations = relationship("Conversation", back_populates="user", cascade="all, delete")


class Conversation(Base):
    __tablename__ = "conversations"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"))
    title      = Column(String(255), default="New Chat")
    created_at = Column(DateTime, server_default=func.now())

    user     = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation",
                            order_by="Message.id", cascade="all, delete")


class Message(Base):
    __tablename__ = "messages"

    id              = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    role            = Column(String(10))   # "user" or "model"
    content         = Column(Text)
    created_at      = Column(DateTime, server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")