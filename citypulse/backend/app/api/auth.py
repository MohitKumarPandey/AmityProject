from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import jwt
from pydantic import BaseModel
from typing import Optional

from ..db.database import get_db
from ..models.user import UserORM, UserSignup, UserLogin, UserResponse, UserPreferenceORM
from ..services.auth import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[UserResponse] = None

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = await db.get(UserORM, int(user_id))
    if user is None:
        raise credentials_exception
    return user

@router.post("/signup", response_model=UserResponse)
async def signup(user_data: UserSignup, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserORM).where(UserORM.email == user_data.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    new_user = UserORM(
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name
    )
    db.add(new_user)
    await db.flush()
    
    # Create default preferences
    pref = UserPreferenceORM(user_id=new_user.id)
    db.add(pref)
    
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserORM).where(UserORM.email == user_data.email))
    user = result.scalars().first()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    user.last_login_at = datetime.utcnow()
    await db.commit()

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserORM = Depends(get_current_user)):
    return current_user

import os
from google.oauth2 import id_token
from google.auth.transport import requests

class GoogleAuth(BaseModel):
    credential: str

@router.post("/google", response_model=Token)
async def google_auth(google_data: GoogleAuth, db: AsyncSession = Depends(get_db)):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="Google Client ID not configured on server")
    
    try:
        idinfo = id_token.verify_oauth2_token(google_data.credential, requests.Request(), client_id)
        email = idinfo.get("email")
        name = idinfo.get("name", "Google User")
        
        if not email:
            raise HTTPException(status_code=400, detail="Google token missing email")
            
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")
        
    result = await db.execute(select(UserORM).where(UserORM.email == email))
    user = result.scalars().first()
    
    if not user:
        # Create new user for google sign-in
        new_user = UserORM(
            email=email,
            password_hash="google_oauth",
            full_name=name,
            is_active=True
        )
        db.add(new_user)
        await db.flush()
        
        pref = UserPreferenceORM(user_id=new_user.id)
        db.add(pref)
        
        await db.commit()
        await db.refresh(new_user)
        user = new_user
    else:
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        
        user.last_login_at = datetime.utcnow()
        await db.commit()
        
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user": user}
