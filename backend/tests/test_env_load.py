# test_env_load.py

from config import settings

print("USE_TESTNET:", settings.USE_TESTNET)
print("API KEY:", settings.BINANCE_TESTNET_API_KEY)
print("API SECRET:", settings.BINANCE_TESTNET_API_SECRET)
print("SPOT URL:", settings.BINANCE_TESTNET_SPOT_BASE_URL if settings.USE_TESTNET else settings.BINANCE_SPOT_BASE_URL)