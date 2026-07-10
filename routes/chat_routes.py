from sqlalchemy.dialects import postgresql
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env", override=True)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from google import genai
from database import get_db
import models
import auth
from schemas import ChatRequest, MessageOut, ConversationOut
import os
from fastapi.responses import StreamingResponse

router = APIRouter(tags=["chat"])

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MEMORY_LIMIT = 20  # last N messages sent as context to Gemini


@router.get("/conversations", response_model=List[ConversationOut])
def list_conversations(
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Conversation)
        .filter(models.Conversation.user_id == user.id)
        .order_by(models.Conversation.id.desc())
        .all()
    )


@router.get("/conversations/{conv_id}/messages", response_model=List[MessageOut])
def get_messages(
    conv_id: int,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(models.Conversation)
        .filter(
            models.Conversation.id == conv_id,
            models.Conversation.user_id == user.id,
        )
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv.messages


# @router.post("/chat")
# def chat(
#     req: ChatRequest,
#     user: models.User = Depends(auth.get_current_user),
#     db: Session = Depends(get_db),
# ):
#     conv = None

#     if req.conversation_id:
#         conv = (
#             db.query(models.Conversation)
#             .filter(
#                 models.Conversation.id == req.conversation_id,
#                 models.Conversation.user_id == user.id,
#             )
#             .first()
#         )

#     if not conv:
#         title = req.message[:60]
#         conv = models.Conversation(user_id=user.id, title=title)
#         db.add(conv)
#         db.commit()
#         db.refresh(conv)

#     recent = (
#         db.query(models.Message)
#         .filter(models.Message.conversation_id == conv.id)
#         .order_by(models.Message.id.desc())
#         .limit(MEMORY_LIMIT)
#         .all()
#     )

#     recent.reverse()

#     history = [
#         {
#             "role": m.role,
#             "parts": [{"text": m.content}]
#         }
#         for m in recent
#     ]

#     history.append({
#         "role": "user",
#         "parts": [{"text": req.message}]
#     })

#     try:
#         response = client.models.generate_content(
#             model="gemini-2.5-flash",
#             contents=history,
#         )

#         reply = response.text or "No response."

#     except Exception as e:
#         print("Gemini Error:", e)
#         raise HTTPException(status_code=500, detail=str(e))

#     db.add(models.Message(
#         conversation_id=conv.id,
#         role="user",
#         content=req.message
#     ))

#     db.add(models.Message(
#         conversation_id=conv.id,
#         role="model",
#         content=reply
#     ))

#     db.commit()

#     return {
#         "reply": reply,
#         "conversation_id": conv.id
#     }

@router.post("/chat")
def chat(
    req: ChatRequest,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):

    conv = None

    if req.conversation_id:
        conv = (
            db.query(models.Conversation)
            .filter(
                models.Conversation.id == req.conversation_id,
                models.Conversation.user_id == user.id,
            )
            .first()
        )

    if not conv:
        title = req.message[:60]
        conv = models.Conversation(user_id=user.id, title=title)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    recent = (
        db.query(models.Message)
        .filter(models.Message.conversation_id == conv.id)
        .order_by(models.Message.id.desc())
        .limit(MEMORY_LIMIT)
        .all()
    )

    recent.reverse()

    history = [
        {
            "role": m.role,
            "parts": [{"text": m.content}]
        }
        for m in recent
    ]

    history.append({
        "role": "user",
        "parts": [{"text": req.message}]
    })

    def generate():

        full_reply = ""

        try:
            model_name = os.getenv("GEMINI_MODEL") or os.getenv("OPENAI_API_MODEL") or "gemini-2.5-flash"
            model_name = model_name.strip('"\'')
            response = client.models.generate_content_stream(
                model=model_name,
                contents=history,
            )

            for chunk in response:

                if chunk.text:
                    full_reply += chunk.text
                    yield chunk.text

            # Save messages AFTER stream finishes
            db.add(models.Message(
                conversation_id=conv.id,
                role="user",
                content=req.message
            ))

            db.add(models.Message(
                conversation_id=conv.id,
                role="model",
                content=full_reply
            ))

            db.commit()

        except Exception as e:
            yield f"\n[ERROR]: {str(e)}"

    return StreamingResponse(
        generate(),
        media_type="text/plain"
    )


@router.delete("/conversations/{conv_id}")
def delete_conversation(
    conv_id: int,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    conv = (
        db.query(models.Conversation)
        .filter(
            models.Conversation.id == conv_id,
            models.Conversation.user_id == user.id,
        )
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Not found")

    db.delete(conv)
    db.commit()
    return {"ok": True}
