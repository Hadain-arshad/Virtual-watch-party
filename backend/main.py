import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timezone
from pathlib import Path

import jwt
import pyodbc
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

DB_SERVER = os.getenv("DB_SERVER", r"DESKTOP-DUJ43DM\SQLEXPRESS")
DB_NAME = os.getenv("DB_NAME", "VirtualWatchPartyDB")
DB_DRIVER = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-development-secret")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app = FastAPI(title="Virtual Watch Party API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
security = HTTPBearer(auto_error=False)


def master_connection():
    connection_string = (
        f"DRIVER={{{DB_DRIVER}}};SERVER={DB_SERVER};"
        "DATABASE=master;Trusted_Connection=yes;TrustServerCertificate=yes;"
    )
    return pyodbc.connect(connection_string, autocommit=True, timeout=5)


def database_connection():
    connection_string = (
        f"DRIVER={{{DB_DRIVER}}};SERVER={DB_SERVER};DATABASE={DB_NAME};"
        "Trusted_Connection=yes;TrustServerCertificate=yes;"
    )
    return pyodbc.connect(connection_string, timeout=5)


def initialise_database():
    with master_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            f"IF DB_ID(?) IS NULL EXEC('CREATE DATABASE [{DB_NAME}]')", DB_NAME
        )

    with database_connection() as connection:
        connection.cursor().execute(
            """
            IF OBJECT_ID('dbo.users', 'U') IS NULL
            CREATE TABLE dbo.users (
                id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                full_name NVARCHAR(120) NOT NULL,
                email NVARCHAR(255) NOT NULL UNIQUE,
                gender NVARCHAR(30) NULL,
                password_hash NVARCHAR(255) NOT NULL,
                profile_picture NVARCHAR(500) NULL,
                created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
            )
            """
        )
        connection.commit()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 210_000)
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    salt_hex, digest_hex = stored_hash.split("$", 1)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt_hex), 210_000
    )
    return hmac.compare_digest(digest.hex(), digest_hex)


def create_token(user_id: str) -> str:
    return jwt.encode({"sub": user_id}, JWT_SECRET, algorithm="HS256")


def user_response(row):
    return {
        "id": str(row[0]),
        "full_name": row[1],
        "email": row[2],
        "gender": row[3],
        "profile_picture": row[4],
        "created_at": row[5].replace(tzinfo=timezone.utc).isoformat() if row[5] else None,
    }


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="You are not signed in")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        user_id = payload["sub"]
    except (jwt.InvalidTokenError, KeyError):
        raise HTTPException(status_code=401, detail="Your session is invalid")

    with database_connection() as connection:
        row = connection.cursor().execute(
            "SELECT id, full_name, email, gender, profile_picture, created_at FROM dbo.users WHERE id = ?",
            user_id,
        ).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="User was not found")
    return user_response(row)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@app.on_event("startup")
def startup():
    try:
        initialise_database()
        print(f"SQL Server ready: {DB_SERVER}/{DB_NAME}")
    except Exception as error:
        print(f"SQL Server is unavailable. Start SQL Server and retry: {error}")


@app.get("/")
def root():
    return {"service": "Virtual Watch Party API", "status": "running"}


@app.get("/health")
def health():
    try:
        with database_connection() as connection:
            connection.cursor().execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception:
        raise HTTPException(status_code=503, detail="Database is unavailable")


@app.post("/auth/signup", status_code=status.HTTP_201_CREATED)
async def signup(
    full_name: str = Form(...),
    email: EmailStr = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
    gender: str | None = Form(None),
    profile_picture: UploadFile | None = File(None),
):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    picture_path = None
    if profile_picture and profile_picture.filename:
        allowed_types = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
        extension = allowed_types.get(profile_picture.content_type)
        if not extension:
            raise HTTPException(status_code=400, detail="Profile picture must be JPG, PNG, or WebP")
        picture_path = f"{uuid.uuid4()}{extension}"
        (UPLOAD_DIR / picture_path).write_bytes(await profile_picture.read())

    user_id = uuid.uuid4()
    try:
        with database_connection() as connection:
            connection.cursor().execute(
                "INSERT INTO dbo.users (id, full_name, email, gender, password_hash, profile_picture) VALUES (?, ?, ?, ?, ?, ?)",
                str(user_id), full_name.strip(), str(email).lower(), gender, hash_password(password), picture_path,
            )
            connection.commit()
            row = connection.cursor().execute(
                "SELECT id, full_name, email, gender, profile_picture, created_at FROM dbo.users WHERE id = ?",
                str(user_id),
            ).fetchone()
    except pyodbc.IntegrityError:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    return {"token": create_token(str(user_id)), "user": user_response(row)}


@app.post("/auth/login")
def login(credentials: LoginRequest):
    with database_connection() as connection:
        row = connection.cursor().execute(
            "SELECT id, full_name, email, gender, password_hash, profile_picture, created_at FROM dbo.users WHERE email = ?",
            str(credentials.email).lower(),
        ).fetchone()
    if not row or not verify_password(credentials.password, row[4]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    return {
        "token": create_token(str(row[0])),
        "user": user_response((row[0], row[1], row[2], row[3], row[5], row[6])),
    }


@app.get("/auth/me")
def me(user=Depends(get_current_user)):
    return {"user": user}


@app.get("/dashboard")
def dashboard(user=Depends(get_current_user)):
    return {
        "user": user,
        "my_events": [
            {
                "id": "evt-1",
                "title": "Inception",
                "host": "Hosted by You",
                "date": "Today, 08:00 PM",
                "participants": "4/6 Participants",
                "status": "Upcoming",
                "poster_class": "poster-inception",
            },
            {
                "id": "evt-2",
                "title": "Interstellar",
                "host": "Hosted by You",
                "date": "Friday, 09:30 PM",
                "participants": "3/5 Participants",
                "status": "Soon",
                "poster_class": "poster-interstellar",
            },
        ],
        "joined_events": [
            {
                "id": "join-1",
                "title": "The Batman",
                "host": "Hosted by Ahmed Raza",
                "date": "Tomorrow, 07:00 PM",
                "participants": "3/5 Participants",
                "status": "Upcoming",
                "poster_class": "poster-batman",
            },
            {
                "id": "join-2",
                "title": "Dune",
                "host": "Hosted by Sarah Khan",
                "date": "28 Apr, 09:30 PM",
                "participants": "5/6 Participants",
                "status": "Upcoming",
                "poster_class": "poster-dune",
            },
        ],
    }