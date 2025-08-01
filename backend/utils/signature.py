from urllib.parse import urlencode
import hmac
import hashlib

def sign_request(params: dict, secret_key: str) -> str:
    query_string = urlencode(params)
    return hmac.new(
        secret_key.encode("utf-8"),
        query_string.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()