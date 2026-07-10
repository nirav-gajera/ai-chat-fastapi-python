from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import auth
from schemas import RegisterRequest, LoginRequest, ProfileUpdateRequest, PasswordUpdateRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        name=req.name,
        email=req.email,
        password=auth.hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token(user.id)
    return {"token": token, "name": user.name, "email": user.email}


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not auth.verify_password(req.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth.create_access_token(user.id)
    return {"token": token, "name": user.name, "email": user.email}


@router.get("/me")
def me(user: models.User = Depends(auth.get_current_user)):
    return {"id": user.id, "name": user.name, "email": user.email}


@router.put("/profile")
def update_profile(
    req: ProfileUpdateRequest,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Check if email is already taken by another user
    if req.email != user.email:
        existing = db.query(models.User).filter(models.User.email == req.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
    
    user.name = req.name
    user.email = req.email
    db.commit()
    db.refresh(user)
    return {"name": user.name, "email": user.email}


@router.put("/password")
def update_password(
    req: PasswordUpdateRequest,
    user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify current password
    if not auth.verify_password(req.current_password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    user.password = auth.hash_password(req.new_password)
    db.commit()
    return {"ok": True, "message": "Password updated successfully"}

