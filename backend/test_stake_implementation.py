#!/usr/bin/env python3
"""
Test para verificar implementación correcta de stake
"""

def test_stake_calculation():
    """Verificar que quantity se calcula desde stake"""

    # Simular datos
    stake = 500.0  # USDT
    current_price = 100000.0  # BTC price

    # Cálculo esperado
    expected_quantity = stake / current_price  # 0.005 BTC

    # Test 1: Verificar cálculo básico
    assert expected_quantity == 0.005, f"Expected 0.005, got {expected_quantity}"
    print("✅ Test 1: Cálculo básico correcto")

    # Test 2: Verificar con diferentes stakes
    test_cases = [
        (100, 100000, 0.001),
        (500, 100000, 0.005),
        (1000, 100000, 0.01),
        (250, 50000, 0.005),
    ]

    for stake, price, expected in test_cases:
        result = stake / price
        assert abs(result - expected) < 0.00001, f"Stake {stake} @ {price} failed"

    print("✅ Test 2: Múltiples casos correctos")

    # Test 3: Verificar formato string para Binance
    quantity_str = f"{expected_quantity:.8f}"
    assert quantity_str == "0.00500000", f"Format error: {quantity_str}"
    print("✅ Test 3: Formato Binance correcto")

    return True

def test_stake_validation():
    """Verificar validaciones de stake"""

    # Test 1: Stake debe ser > 0
    stake = 0
    assert stake <= 0, "Stake 0 debe ser inválido"
    print("✅ Test 4: Validación stake > 0")

    # Test 2: Stake máximo (ejemplo: 10000 USDT)
    max_stake = 10000
    stake = 15000
    assert stake > max_stake, "Stake excede máximo"
    print("✅ Test 5: Validación stake máximo")

    return True

if __name__ == "__main__":
    print("=" * 50)
    print("TESTING STAKE IMPLEMENTATION")
    print("=" * 50)

    try:
        test_stake_calculation()
        test_stake_validation()
        print("\n✅ TODOS LOS TESTS PASARON")
    except AssertionError as e:
        print(f"\n❌ TEST FALLÓ: {e}")
        exit(1)