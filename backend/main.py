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
from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_UPLOAD_SIZE = 2 * 1024 * 1024 * 1024

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
        connection.cursor().execute(
            """
            IF OBJECT_ID('dbo.events', 'U') IS NULL
            CREATE TABLE dbo.events (
                id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                host_user_id UNIQUEIDENTIFIER NOT NULL,
                title NVARCHAR(120) NOT NULL,
                description NVARCHAR(1000) NULL,
                scheduled_at DATETIME2 NOT NULL,
                capacity INT NOT NULL DEFAULT 6,
                poster_path NVARCHAR(500) NULL,
                movie_path NVARCHAR(500) NOT NULL,
                created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                CONSTRAINT FK_events_users FOREIGN KEY (host_user_id) REFERENCES dbo.users(id)
            )
            """
        )
        connection.cursor().execute(
            """
            IF OBJECT_ID('dbo.event_participants', 'U') IS NULL
            CREATE TABLE dbo.event_participants (
                event_id UNIQUEIDENTIFIER NOT NULL,
                user_id UNIQUEIDENTIFIER NOT NULL,
                joined_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                CONSTRAINT PK_event_participants PRIMARY KEY (event_id, user_id),
                CONSTRAINT FK_event_participants_events FOREIGN KEY (event_id) REFERENCES dbo.events(id),
                CONSTRAINT FK_event_participants_users FOREIGN KEY (user_id) REFERENCES dbo.users(id)
            )
            """
        )
        connection.cursor().execute(
            """
            IF OBJECT_ID('dbo.friend_requests', 'U') IS NULL
            CREATE TABLE dbo.friend_requests (
                id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                sender_id UNIQUEIDENTIFIER NOT NULL,
                recipient_id UNIQUEIDENTIFIER NOT NULL,
                status NVARCHAR(20) NOT NULL DEFAULT 'pending',
                created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                responded_at DATETIME2 NULL,
                CONSTRAINT CK_friend_requests_not_self CHECK (sender_id <> recipient_id),
                CONSTRAINT CK_friend_requests_status CHECK (status IN ('pending', 'accepted', 'declined')),
                CONSTRAINT FK_friend_requests_sender FOREIGN KEY (sender_id) REFERENCES dbo.users(id),
                CONSTRAINT FK_friend_requests_recipient FOREIGN KEY (recipient_id) REFERENCES dbo.users(id)
            )
            """
        )
        connection.cursor().execute(
            """
            IF OBJECT_ID('dbo.notifications', 'U') IS NULL
            CREATE TABLE dbo.notifications (
                id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                recipient_id UNIQUEIDENTIFIER NOT NULL,
                actor_id UNIQUEIDENTIFIER NOT NULL,
                type NVARCHAR(40) NOT NULL,
                friend_request_id UNIQUEIDENTIFIER NOT NULL,
                created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                CONSTRAINT FK_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES dbo.users(id),
                CONSTRAINT FK_notifications_actor FOREIGN KEY (actor_id) REFERENCES dbo.users(id),
                CONSTRAINT FK_notifications_friend_request FOREIGN KEY (friend_request_id) REFERENCES dbo.friend_requests(id)
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


async def save_upload(upload: UploadFile, allowed_types: dict[str, str]) -> str:
    extension = allowed_types.get(upload.content_type or "")
    if not extension:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    filename = f"{uuid.uuid4()}{extension}"
    file_path = UPLOAD_DIR / filename
    size = 0
    try:
        with file_path.open("wb") as destination:
            while chunk := await upload.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_UPLOAD_SIZE:
                    raise HTTPException(status_code=413, detail="File exceeds the 2 GB limit")
                destination.write(chunk)
        if size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
    except Exception:
        file_path.unlink(missing_ok=True)
        raise
    return filename


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


class FriendRequestPayload(BaseModel):
    recipient_id: uuid.UUID


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
def dashboard(request: Request, user=Depends(get_current_user)):
    event_query = """
        SELECT e.id, e.title, e.description, e.scheduled_at, e.capacity,
               e.poster_path, e.movie_path, u.full_name,
               1 + (SELECT COUNT(*) FROM dbo.event_participants p
                    WHERE p.event_id = e.id AND p.user_id <> e.host_user_id)
        FROM dbo.events e
        JOIN dbo.users u ON u.id = e.host_user_id
    """
    with database_connection() as connection:
        cursor = connection.cursor()
        my_rows = cursor.execute(
            event_query + """
            WHERE e.host_user_id = ?
              AND NOT EXISTS (
                  SELECT 1 FROM dbo.event_participants p
                  WHERE p.event_id = e.id AND p.user_id = ?
              )
            ORDER BY e.scheduled_at
            """,
            user["id"], user["id"],
        ).fetchall()
        joined_rows = cursor.execute(
            event_query + """
            WHERE EXISTS (
                SELECT 1 FROM dbo.event_participants p
                WHERE p.event_id = e.id AND p.user_id = ?
            )
            ORDER BY e.scheduled_at
            """,
            user["id"],
        ).fetchall()

    def serialize_event(row):
        scheduled_at = row[3]
        if scheduled_at.tzinfo is None:
            scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)
        return {
            "id": str(row[0]),
            "title": row[1],
            "description": row[2] or "",
            "date": scheduled_at.astimezone().strftime("%a, %b %d, %I:%M %p"),
            "participants": f"{row[8]}/{row[4]} Participants",
            "capacity": row[4],
            "status": "Upcoming" if scheduled_at > datetime.now(timezone.utc) else "Completed",
            "host": f"Hosted by {row[7]}",
            "posterUrl": str(request.url_for("uploads", path=row[5])) if row[5] else "",
            "videoUrl": str(request.url_for("uploads", path=row[6])),
        }

    return {
        "user": user,
        "my_events": [serialize_event(row) for row in my_rows],
        "joined_events": [serialize_event(row) for row in joined_rows],
    }


@app.post("/events/{event_id}/join")
def join_event(event_id: uuid.UUID, user=Depends(get_current_user)):
    with database_connection() as connection:
        cursor = connection.cursor()
        event = cursor.execute(
            "SELECT host_user_id, capacity FROM dbo.events WITH (UPDLOCK, HOLDLOCK) WHERE id = ?",
            str(event_id),
        ).fetchone()
        if not event:
            raise HTTPException(status_code=404, detail="Event was not found")

        already_joined = cursor.execute(
            "SELECT 1 FROM dbo.event_participants WHERE event_id = ? AND user_id = ?",
            str(event_id), user["id"],
        ).fetchone()
        if already_joined:
            return {"joined": True, "event_id": str(event_id)}

        host_id, capacity = str(event[0]), event[1]
        if user["id"] != host_id:
            other_participants = cursor.execute(
                "SELECT COUNT(*) FROM dbo.event_participants WHERE event_id = ? AND user_id <> ?",
                str(event_id), host_id,
            ).fetchone()[0]
            if other_participants + 1 >= capacity:
                raise HTTPException(status_code=409, detail="This event is full")

        cursor.execute(
            "INSERT INTO dbo.event_participants (event_id, user_id) VALUES (?, ?)",
            str(event_id), user["id"],
        )
        connection.commit()

    return {"joined": True, "event_id": str(event_id)}


@app.post("/events", status_code=status.HTTP_201_CREATED)
async def create_event(
    request: Request,
    title: str = Form(...),
    scheduled_at: datetime = Form(...),
    movie: UploadFile = File(...),
    description: str = Form(""),
    capacity: int = Form(6, ge=2, le=50),
    poster: UploadFile | None = File(None),
    user=Depends(get_current_user),
):
    title = title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Event name is required")
    if len(title) > 120 or len(description) > 1000:
        raise HTTPException(status_code=400, detail="Event details are too long")

    saved_files = []
    try:
        movie_path = await save_upload(
            movie,
            {
                "video/mp4": ".mp4",
                "video/webm": ".webm",
                "video/quicktime": ".mov",
                "video/x-matroska": ".mkv",
            },
        )
        saved_files.append(movie_path)
        poster_path = None
        if poster and poster.filename:
            poster_path = await save_upload(
                poster,
                {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"},
            )
            saved_files.append(poster_path)

        event_id = uuid.uuid4()
        if scheduled_at.tzinfo is None:
            scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)
        scheduled_at = scheduled_at.astimezone(timezone.utc).replace(tzinfo=None)
        with database_connection() as connection:
            connection.cursor().execute(
                """
                INSERT INTO dbo.events
                    (id, host_user_id, title, description, scheduled_at, capacity, poster_path, movie_path)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                str(event_id), user["id"], title, description.strip(), scheduled_at,
                capacity, poster_path, movie_path,
            )
            connection.commit()
    except Exception:
        for filename in saved_files:
            (UPLOAD_DIR / filename).unlink(missing_ok=True)
        raise

    return {
        "id": str(event_id),
        "title": title,
        "description": description.strip(),
        "date": scheduled_at.replace(tzinfo=timezone.utc).astimezone().strftime("%a, %b %d, %I:%M %p"),
        "participants": f"1/{capacity} Participants",
        "capacity": capacity,
        "status": "Upcoming",
        "host": f"Hosted by {user['full_name']}",
        "posterUrl": str(request.url_for("uploads", path=poster_path)) if poster_path else "",
        "videoUrl": str(request.url_for("uploads", path=movie_path)),
    }


@app.get("/users/search")
def search_users(
    q: str = Query(min_length=2, max_length=80),
    user=Depends(get_current_user),
):
    search_term = f"%{q.strip()}%"
    with database_connection() as connection:
        rows = connection.cursor().execute(
            """
            SELECT TOP 20 u.id, u.full_name, u.email, u.gender,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM dbo.friend_requests fr
                        WHERE fr.status = 'accepted' AND
                            ((fr.sender_id = ? AND fr.recipient_id = u.id) OR
                             (fr.sender_id = u.id AND fr.recipient_id = ?))
                    ) THEN 'friend'
                    WHEN EXISTS (
                        SELECT 1 FROM dbo.friend_requests fr
                        WHERE fr.status = 'pending' AND fr.sender_id = ? AND fr.recipient_id = u.id
                    ) THEN 'sent'
                    WHEN EXISTS (
                        SELECT 1 FROM dbo.friend_requests fr
                        WHERE fr.status = 'pending' AND fr.sender_id = u.id AND fr.recipient_id = ?
                    ) THEN 'received'
                    ELSE 'none'
                END AS relationship
            FROM dbo.users u
            WHERE u.id <> ? AND (u.full_name LIKE ? OR u.email LIKE ?)
            ORDER BY u.full_name
            """,
            user["id"], user["id"], user["id"], user["id"], user["id"], search_term, search_term,
        ).fetchall()

    return {
        "users": [
            {
                "id": str(row[0]),
                "name": row[1],
                "email": row[2],
                "gender": row[3] or "Not specified",
                "initials": "".join(part[0] for part in row[1].split()[:2]).upper(),
                "relationship": row[4],
            }
            for row in rows
        ]
    }


@app.get("/friends")
def list_friends(user=Depends(get_current_user)):
    with database_connection() as connection:
        rows = connection.cursor().execute(
            """
            SELECT DISTINCT u.id, u.full_name, u.email, u.gender, u.profile_picture, u.created_at
            FROM dbo.friend_requests fr
            JOIN dbo.users u ON u.id = CASE WHEN fr.sender_id = ? THEN fr.recipient_id ELSE fr.sender_id END
            WHERE (fr.sender_id = ? OR fr.recipient_id = ?) AND fr.status = 'accepted'
            ORDER BY u.full_name
            """,
            user["id"], user["id"], user["id"],
        ).fetchall()

    return {
        "friends": [
            {
                "id": str(row[0]),
                "name": row[1],
                "email": row[2],
                "gender": row[3] or "Not specified",
                "initials": "".join(part[0] for part in row[1].split()[:2]).upper(),
                "joined": row[5].replace(tzinfo=timezone.utc).strftime("%b %Y") if row[5] else "",
                "status": "Friend",
            }
            for row in rows
        ]
    }


@app.post("/friends/requests", status_code=status.HTTP_201_CREATED)
def send_friend_request(payload: FriendRequestPayload, user=Depends(get_current_user)):
    recipient_id = str(payload.recipient_id)
    if recipient_id == user["id"]:
        raise HTTPException(status_code=400, detail="You cannot add yourself as a friend")

    request_id = uuid.uuid4()
    notification_id = uuid.uuid4()
    with database_connection() as connection:
        cursor = connection.cursor()
        recipient = cursor.execute(
            "SELECT id FROM dbo.users WHERE id = ?", recipient_id
        ).fetchone()
        if not recipient:
            raise HTTPException(status_code=404, detail="User was not found")

        existing = cursor.execute(
            """
            SELECT TOP 1 status, sender_id
            FROM dbo.friend_requests WITH (UPDLOCK, HOLDLOCK)
            WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
            ORDER BY CASE status WHEN 'accepted' THEN 0 ELSE 1 END, created_at DESC
            """,
            user["id"], recipient_id, recipient_id, user["id"],
        ).fetchone()
        if existing and existing[0] == "accepted":
            raise HTTPException(status_code=409, detail="You are already friends")
        if existing and existing[0] == "pending":
            detail = "This user has already sent you a request" if str(existing[1]) != user["id"] else "Friend request already sent"
            raise HTTPException(status_code=409, detail=detail)

        cursor.execute(
            "INSERT INTO dbo.friend_requests (id, sender_id, recipient_id) VALUES (?, ?, ?)",
            str(request_id), user["id"], recipient_id,
        )
        cursor.execute(
            "INSERT INTO dbo.notifications (id, recipient_id, actor_id, type, friend_request_id) VALUES (?, ?, ?, ?, ?)",
            str(notification_id), recipient_id, user["id"], "friend_request", str(request_id),
        )
        connection.commit()

    return {"request_id": str(request_id), "status": "pending"}


@app.post("/friends/requests/{request_id}/accept")
def accept_friend_request(request_id: uuid.UUID, user=Depends(get_current_user)):
    with database_connection() as connection:
        cursor = connection.cursor()
        friend_request = cursor.execute(
            """
            SELECT sender_id, status FROM dbo.friend_requests WITH (UPDLOCK, HOLDLOCK)
            WHERE id = ? AND recipient_id = ?
            """,
            str(request_id), user["id"],
        ).fetchone()
        if not friend_request:
            raise HTTPException(status_code=404, detail="Friend request was not found")
        if friend_request[1] != "pending":
            raise HTTPException(status_code=409, detail="This friend request has already been handled")

        sender_id = str(friend_request[0])
        cursor.execute(
            "UPDATE dbo.friend_requests SET status = 'accepted', responded_at = SYSUTCDATETIME() WHERE id = ?",
            str(request_id),
        )
        cursor.execute(
            "INSERT INTO dbo.notifications (id, recipient_id, actor_id, type, friend_request_id) VALUES (?, ?, ?, ?, ?)",
            str(uuid.uuid4()), sender_id, user["id"], "friend_request_accepted", str(request_id),
        )
        connection.commit()

    return {"request_id": str(request_id), "status": "accepted"}


@app.post("/friends/requests/{request_id}/decline")
def decline_friend_request(request_id: uuid.UUID, user=Depends(get_current_user)):
    with database_connection() as connection:
        cursor = connection.cursor()
        friend_request = cursor.execute(
            """
            SELECT status FROM dbo.friend_requests WITH (UPDLOCK, HOLDLOCK)
            WHERE id = ? AND recipient_id = ?
            """,
            str(request_id), user["id"],
        ).fetchone()
        if not friend_request:
            raise HTTPException(status_code=404, detail="Friend request was not found")
        if friend_request[0] != "pending":
            raise HTTPException(status_code=409, detail="This friend request has already been handled")

        cursor.execute(
            "UPDATE dbo.friend_requests SET status = 'declined', responded_at = SYSUTCDATETIME() WHERE id = ?",
            str(request_id),
        )
        connection.commit()

    return {"request_id": str(request_id), "status": "declined"}


@app.get("/notifications")
def list_notifications(user=Depends(get_current_user)):
    with database_connection() as connection:
        rows = connection.cursor().execute(
            """
            SELECT n.id, n.type, n.created_at, actor.id, actor.full_name,
                   fr.id, fr.status
            FROM dbo.notifications n
            JOIN dbo.users actor ON actor.id = n.actor_id
            JOIN dbo.friend_requests fr ON fr.id = n.friend_request_id
            WHERE n.recipient_id = ?
            ORDER BY n.created_at DESC
            """,
            user["id"],
        ).fetchall()

    return {
        "notifications": [
            {
                "id": str(row[0]),
                "type": "Social",
                "kind": row[1],
                "created_at": row[2].replace(tzinfo=timezone.utc).isoformat(),
                "actor_id": str(row[3]),
                "name": row[4],
                "initials": "".join(part[0] for part in row[4].split()[:2]).upper(),
                "request_id": str(row[5]),
                "request_status": row[6],
                "message": "sent you a friend request" if row[1] == "friend_request" else "accepted your friend request",
            }
            for row in rows
        ]
    }