import enum


class UserRole(str, enum.Enum):
    READER = "READER"
    AUTHOR = "AUTHOR"
    ADMIN = "ADMIN"


class AvailabilityType(str, enum.Enum):
    PUBLIC_DOMAIN = "PUBLIC_DOMAIN"
    EXTERNAL_LEGAL = "EXTERNAL_LEGAL"
    MARKETPLACE = "MARKETPLACE"


class BookStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class ShelfType(str, enum.Enum):
    WANT_TO_READ = "WANT_TO_READ"
    READING = "READING"
    FINISHED = "FINISHED"
    FAVORITES = "FAVORITES"
    PURCHASED = "PURCHASED"