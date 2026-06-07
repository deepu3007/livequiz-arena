import random
import string


def generate_room_code(length: int = 6) -> str:
    characters = string.ascii_uppercase + string.digits
    return "".join(random.choice(characters) for _ in range(length))