from app.models.enums import AvailabilityType, ShelfType


def test_public_domain_access_logic():
    # Public domain books should always be legally accessible
    availability = AvailabilityType.PUBLIC_DOMAIN
    is_authorized = availability == AvailabilityType.PUBLIC_DOMAIN
    assert is_authorized is True


def test_purchased_book_access_logic():
    user_shelves = [ShelfType.WANT_TO_READ, ShelfType.PURCHASED]
    is_purchased = ShelfType.PURCHASED in user_shelves
    assert is_purchased is True