import re
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.book import Book
from app.models.annotation import Annotation

router = APIRouter()


@router.get("/{book_id}/export/markdown")
def export_book_annotations_markdown(
    book_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    annotations = db.query(Annotation).filter(
        Annotation.book_id == book_id,
        Annotation.user_id == current_user.id
    ).order_by(Annotation.created_at.asc()).all()

    if not annotations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No highlights or notes recorded for this title."
        )

    # Clean title for filename
    safe_title = re.sub(r'[^\w\s-]', '', book.title).strip().replace(" ", "_")
    filename = f"{safe_title}_annotations.md"

    # Generate Structured Markdown
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    lines = [
        f"# Reading Notes & Highlights",
        f"",
        f"**Title:** {book.title}  ",
        f"**Author:** {book.author_name}  ",
        f"**Exported On:** {now_str}  ",
        f"**Total Highlights:** {len(annotations)}  ",
        f"",
        f"---",
        f""
    ]

    for idx, item in enumerate(annotations, start=1):
        color_label = item.color.upper() if item.color else "YELLOW"
        created_date = item.created_at.strftime("%Y-%m-%d")
        lines.append(f"### {idx}. Highlight ({color_label}) — *{created_date}*")
        lines.append(f"> \"{item.highlighted_text}\"")
        lines.append(f"")
        if item.note:
            lines.append(f"**Personal Note:**")
            lines.append(f"{item.note}")
            lines.append(f"")
        lines.append(f"---")
        lines.append(f"")

    markdown_content = "\n".join(lines)

    return Response(
        content=markdown_content,
        media_type="text/markdown; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
