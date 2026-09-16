import os
import zipfile
from decimal import Decimal
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.core.config import settings
from app.models import User, AuthorProfile, Book, UserRole, AvailabilityType, BookStatus


def generate_minimal_epub(file_path: str, title: str, author: str, body_text: str):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with zipfile.ZipFile(file_path, "w", zipfile.ZIP_DEFLATED) as ep:
        ep.writestr("mimetype", "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        ep.writestr("META-INF/container.xml", """<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>""")
        ep.writestr("OEBPS/content.opf", f"""<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>{title}</dc:title>
    <dc:creator>{author}</dc:creator>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="toc" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>
  <spine toc="toc">
    <itemref idref="chapter1"/>
  </spine>
</package>""")
        ep.writestr("OEBPS/toc.ncx", f"""<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <navMap>
    <navPoint id="np-1" playOrder="1">
      <navLabel><text>{title}</text></navLabel>
      <content src="chapter1.xhtml"/>
    </navPoint>
  </navMap>
</ncx>""")
        ep.writestr("OEBPS/chapter1.xhtml", f"""<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>{title}</title></head>
  <body style="font-family: serif; padding: 20px; line-height: 1.6;">
    <h2>{title}</h2>
    <h4>by {author}</h4>
    <hr/>
    <p>{body_text}</p>
  </body>
</html>""")


def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Author Account
        author_user = db.query(User).filter(User.email == "author@example.com").first()
        if not author_user:
            author_user = User(
                email="author@example.com",
                hashed_password=get_password_hash("AuthorPass123!"),
                role=UserRole.AUTHOR
            )
            db.add(author_user)
            db.flush()

            profile = AuthorProfile(
                user_id=author_user.id,
                display_name="Elena Vance",
                bio="Independent writer of speculative fiction and avant-garde literature."
            )
            db.add(profile)
            db.flush()

        # 2. Reader Account
        reader_user = db.query(User).filter(User.email == "reader@example.com").first()
        if not reader_user:
            reader_user = User(
                email="reader@example.com",
                hashed_password=get_password_hash("ReaderPass123!"),
                role=UserRole.READER
            )
            db.add(reader_user)
            db.flush()

        # 3. Seed Public Domain Book with Real Valid EPUB
        epub_filename = f"seed-yellow-wallpaper.epub"
        epub_rel_path = os.path.join("manuscripts", epub_filename)
        epub_abs_path = os.path.join(settings.LOCAL_STORAGE_DIR, epub_rel_path)

        generate_minimal_epub(
            file_path=epub_abs_path,
            title="The Yellow Wallpaper",
            author="Charlotte Perkins Gilman",
            body_text="It is very seldom that mere ordinary people like John and myself secure ancestral halls for the summer. A colonial mansion, a hereditary estate, I would say a haunted house, and reach the height of romantic felicity—but that would be asking too much of fate!"
        )

        book_pd = db.query(Book).filter(Book.title == "The Yellow Wallpaper").first()
        if not book_pd:
            book_pd = Book(
                title="The Yellow Wallpaper",
                author_name="Charlotte Perkins Gilman",
                description="A landmark work of early feminist psychological literature focusing on confinement and autonomy.",
                genre="Gothic / Psychological",
                language="en",
                publication_year=1892,
                availability_type=AvailabilityType.PUBLIC_DOMAIN,
                status=BookStatus.PUBLISHED,
                price=Decimal("0.00"),
                file_path=epub_rel_path,
                file_format="EPUB"
            )
            db.add(book_pd)

        # 4. Seed External Legal Book
        book_ext = db.query(Book).filter(Book.title == "The Passion of New Eve").first()
        if not book_ext:
            book_ext = Book(
                title="The Passion of New Eve",
                author_name="Angela Carter",
                description="A speculative, feminist, postmodern exploration of identity and mythology across an apocalyptic landscape.",
                genre="Speculative Fiction",
                language="en",
                publication_year=1977,
                availability_type=AvailabilityType.EXTERNAL_LEGAL,
                status=BookStatus.PUBLISHED,
                price=Decimal("0.00"),
                external_url="https://www.penguin.co.uk/books/18797/the-passion-of-new-eve-by-carter-angela/9780099598282"
            )
            db.add(book_ext)

        # 5. Seed Author Marketplace Book
        book_market = db.query(Book).filter(Book.title == "Architectures of Silence").first()
        if not book_market:
            market_epub_rel = os.path.join("manuscripts", "seed-architectures.epub")
            generate_minimal_epub(
                file_path=os.path.join(settings.LOCAL_STORAGE_DIR, market_epub_rel),
                title="Architectures of Silence",
                author="Elena Vance",
                body_text="In the liminal spaces between cities and memories, the walls retain what the occupants forgot to utter."
            )
            book_market = Book(
                title="Architectures of Silence",
                author_name="Elena Vance",
                author_profile_id=author_user.author_profile.id,
                description="A self-published independent novella examining memory and vacant urban structures.",
                genre="Fiction / Niche",
                language="en",
                publication_year=2024,
                availability_type=AvailabilityType.MARKETPLACE,
                status=BookStatus.PUBLISHED,
                price=Decimal("4.99"),
                file_path=market_epub_rel,
                file_format="EPUB"
            )
            db.add(book_market)

        db.commit()
        print("Database seeded successfully with sample users and books.")
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
