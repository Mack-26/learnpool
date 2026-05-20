from fastapi import APIRouter, Depends, HTTPException, status

from auth import create_access_token, verify_password, pwd_context
from database import get_db
from models import LoginRequest, SignupRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db=Depends(get_db)):
    row = await db.fetchrow(
        "SELECT id, email, password_hash, display_name, role FROM users WHERE email = $1",
        body.email,
    )

    if not row or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({
        "sub": str(row["id"]),
        "role": row["role"],
        "email": row["email"],
    })

    return TokenResponse(
        access_token=token,
        user_id=str(row["id"]),
        display_name=row["display_name"],
        role=row["role"],
    )


TUTORIAL_COURSE_ID = '00000000-0000-0000-0000-000000000011'


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest, db=Depends(get_db)):
    existing = await db.fetchrow("SELECT id FROM users WHERE email = $1", body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    password_hash = pwd_context.hash(body.password)
    async with db.transaction():
        row = await db.fetchrow(
            """
            INSERT INTO users (email, password_hash, display_name, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, display_name, role
            """,
            body.email,
            password_hash,
            body.display_name,
            body.role,
        )

        if body.role == 'student':
            course_exists = await db.fetchval(
                "SELECT 1 FROM courses WHERE id = $1", TUTORIAL_COURSE_ID
            )
            if course_exists:
                await db.execute(
                    """INSERT INTO course_enrollments (course_id, student_id)
                       VALUES ($1, $2)
                       ON CONFLICT (course_id, student_id) DO NOTHING""",
                    TUTORIAL_COURSE_ID,
                    str(row["id"]),
                )

    token = create_access_token({
        "sub": str(row["id"]),
        "role": row["role"],
        "email": row["email"],
    })

    return TokenResponse(
        access_token=token,
        user_id=str(row["id"]),
        display_name=row["display_name"],
        role=row["role"],
    )
