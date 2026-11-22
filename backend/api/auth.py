"""
AEGIS Enterprise Identity & Role-Based Access Control (RBAC) Module.
Enforces 4 enterprise personas:
- viewer: Read-only visibility into posture, topology, findings, and reports.
- analyst: Investigation execution, scan triggers, Bedrock AI queries.
- approver: Cryptographic approval of Mode 2 remediation change plans.
- admin: Full platform administration, API key management, policy configuration.
"""

import os
import hmac
import hashlib
import time
import json
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, Security, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

security_scheme = HTTPBearer(auto_error=False)

JWT_SECRET_KEY = os.getenv("AEGIS_JWT_SECRET", "aegis-enterprise-hmac-sha256-internal-key-2026")
API_KEY_SALT = os.getenv("AEGIS_API_SALT", "aegis-salt-042")

ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "viewer": [
        "overview:read",
        "topology:read",
        "findings:read",
        "attack_paths:read",
        "reports:read",
    ],
    "analyst": [
        "overview:read",
        "topology:read",
        "findings:read",
        "attack_paths:read",
        "reports:read",
        "scans:execute",
        "agent:query",
        "forensics:investigate",
        "remediation:stage",
    ],
    "approver": [
        "overview:read",
        "topology:read",
        "findings:read",
        "attack_paths:read",
        "reports:read",
        "scans:execute",
        "agent:query",
        "forensics:investigate",
        "remediation:stage",
        "remediation:approve",
        "remediation:execute",
    ],
    "admin": [
        "overview:read",
        "topology:read",
        "findings:read",
        "attack_paths:read",
        "reports:read",
        "scans:execute",
        "agent:query",
        "forensics:investigate",
        "remediation:stage",
        "remediation:approve",
        "remediation:execute",
        "remediation:autonomous_optin",
        "keys:manage",
        "users:manage",
        "governance:configure",
    ],
}


class UserSession(BaseModel):
    user_id: str
    email: str
    role: str
    tenant_id: str = "default-account"
    permissions: List[str] = Field(default_factory=list)
    issued_at: float = Field(default_factory=time.time)
    expires_at: float = Field(default_factory=lambda: time.time() + 86400)


def create_access_token(user_id: str, email: str, role: str, tenant_id: str = "default-account") -> str:
    """Creates a signed HMAC-SHA256 JWT-compatible bearer token."""
    if role not in ROLE_PERMISSIONS:
        raise ValueError(f"Invalid role '{role}'. Must be one of: {list(ROLE_PERMISSIONS.keys())}")
    
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "tenant_id": tenant_id,
        "permissions": ROLE_PERMISSIONS[role],
        "iat": int(time.time()),
        "exp": int(time.time() + 86400),
    }
    
    header = {"alg": "HS256", "typ": "JWT"}
    import base64
    def b64url(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

    h_str = b64url(json.dumps(header).encode("utf-8"))
    p_str = b64url(json.dumps(payload).encode("utf-8"))
    sig = hmac.new(JWT_SECRET_KEY.encode("utf-8"), f"{h_str}.{p_str}".encode("utf-8"), hashlib.sha256).digest()
    s_str = b64url(sig)
    
    return f"{h_str}.{p_str}.{s_str}"


def decode_token(token: str) -> UserSession:
    """Decodes and cryptographically verifies an AEGIS or mock Cognito token."""
    # Allow mock development token bypass if header starts with dev-
    if token.startswith("dev-"):
        role = token.replace("dev-", "").strip().lower()
        if role not in ROLE_PERMISSIONS:
            role = "admin"
        return UserSession(
            user_id="dev-engineer",
            email="developer@internal.company",
            role=role,
            permissions=ROLE_PERMISSIONS[role],
        )

    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bearer token structure.")
    
    h_str, p_str, s_str = parts
    import base64
    def b64url_dec(s: str) -> bytes:
        rem = len(s) % 4
        if rem > 0:
            s += "=" * (4 - rem)
        return base64.urlsafe_b64decode(s)

    # Verify signature
    expected_sig = hmac.new(JWT_SECRET_KEY.encode("utf-8"), f"{h_str}.{p_str}".encode("utf-8"), hashlib.sha256).digest()
    actual_sig = b64url_dec(s_str)
    if not hmac.compare_digest(expected_sig, actual_sig):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Signature verification failed.")

    payload = json.loads(b64url_dec(p_str).decode("utf-8"))
    if time.time() > payload.get("exp", 0):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired.")

    return UserSession(
        user_id=payload.get("sub", "unknown"),
        email=payload.get("email", ""),
        role=payload.get("role", "viewer"),
        tenant_id=payload.get("tenant_id", "default-account"),
        permissions=payload.get("permissions", []),
        issued_at=payload.get("iat", 0),
        expires_at=payload.get("exp", 0),
    )


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme)) -> UserSession:
    """Extracts and verifies the current authenticated user session."""
    if not credentials or not credentials.credentials:
        # Default local session for unauthenticated developer testing
        return UserSession(
            user_id="anonymous-admin",
            email="admin@aegis.internal",
            role="admin",
            permissions=ROLE_PERMISSIONS["admin"],
        )
    return decode_token(credentials.credentials)


def require_role(required_role: str):
    """FastAPI route dependency enforcing minimum role requirements."""
    role_hierarchy = ["viewer", "analyst", "approver", "admin"]
    
    def role_checker(user: UserSession = Depends(get_current_user)):
        user_level = role_hierarchy.index(user.role) if user.role in role_hierarchy else -1
        required_level = role_hierarchy.index(required_role) if required_role in role_hierarchy else 999
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: User '{user.user_id}' has role '{user.role}', but '{required_role}' is required."
            )
        return user
    return role_checker


def hash_api_key(key: str) -> str:
    """Hashes a machine-to-machine API key using SHA-256 with platform salt."""
    return hashlib.sha256(f"{key}:{API_KEY_SALT}".encode("utf-8")).hexdigest()
