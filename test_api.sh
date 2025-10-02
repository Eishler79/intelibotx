#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0IiwiZW1haWwiOiJlZHVhcmQuZWlzaGxlckBpY2xvdWQuY29tIiwiZXhwIjoxNzU5MjM5OTA2LCJpYXQiOjE3NTkxNTM1MDYsInR5cGUiOiJhY2Nlc3MifQ.TLC48U2LAtxVCdnCbP-WoOYHQ18TU4w9GYadP-ISlsE"

echo "=== Testing POST /api/bots ==="
curl -X POST 'http://localhost:8000/api/bots' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test Bot API",
    "symbol": "BTCUSDT",
    "exchange_id": 2,
    "strategy": "Smart Scalper",
    "interval": "5m",
    "stake": 50,
    "take_profit": 1.5,
    "stop_loss": 0.5,
    "base_currency": "USDT",
    "quote_currency": "BTC"
  }'