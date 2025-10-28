"""Utility script to create or activate an administrator account."""

from __future__ import annotations

import argparse
import getpass
import sys

from sqlalchemy import select

from app.db.session import session_scope
from app.models import AdminAccount
from app.services import get_password_hash


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create an administrator account.")
    parser.add_argument("email", help="Administrator email address (will be stored in lowercase).")
    parser.add_argument(
        "--password",
        help="Administrator password. If omitted, you will be prompted securely.",
    )
    parser.add_argument(
        "--reactivate",
        action="store_true",
        help="Reactivate the admin account if it already exists but is inactive.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    email = args.email.strip().lower()
    if "@" not in email:
        print("[error] invalid email format", file=sys.stderr)
        return 1

    password = args.password or getpass.getpass("Password: ")
    if not password or len(password) < 8:
        print("[error] password must be at least 8 characters", file=sys.stderr)
        return 1

    hashed_password = get_password_hash(password)

    with session_scope() as session:
        existing = session.execute(
            select(AdminAccount).where(AdminAccount.email == email)
        ).scalar_one_or_none()

        if existing:
            if not args.reactivate:
                print("[info] account already exists; use --reactivate to update password or re-enable.")
                return 0

            existing.hashed_password = hashed_password
            existing.is_active = True
            session.add(existing)
            print(f"[ok] admin account '{email}' has been updated and reactivated.")
            return 0

        admin = AdminAccount(email=email, hashed_password=hashed_password, is_active=True)
        session.add(admin)
        print(f"[ok] admin account '{email}' created successfully.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
