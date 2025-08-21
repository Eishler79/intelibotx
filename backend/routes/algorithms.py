#!/usr/bin/env python3
"""
🧠 Algorithms API Routes - DL-001 COMPLIANT
SPEC_REF: DL-001 compliance + DL-002 policy + institutional algorithms only
"""

from fastapi import APIRouter, Depends
from services.auth_service import get_current_user_safe
from models.user import User
from services.institutional_algorithms import InstitutionalAlgorithmsService

router = APIRouter()

@router.get("/api/algorithms/{strategy}")
async def get_strategy_algorithms(
    strategy: str, 
    user: User = Depends(get_current_user_safe)
):
    """
    DL-001 COMPLIANT: Algoritmos institucionales dinámicos desde services
    
    Returns institutional algorithms for specified strategy:
    - Smart Scalper: Wyckoff, Order Blocks, Liquidity Grabs, Smart Money Flow
    - Manipulation Detector: Stop Hunt, Order Flow, Composite Man
    - Trend Hunter: SMC + Market Profile + VSA
    - News Sentiment: Central Bank + Options Flow
    - Volatility Master: VSA + Market Profile adaptive
    
    Args:
        strategy: Strategy name (Smart Scalper, Manipulation Detector, etc.)
        user: Authenticated user (DL-008 compliance)
        
    Returns:
        List of institutional algorithms for the strategy
    """
    try:
        service = InstitutionalAlgorithmsService()
        algorithms = service.get_strategy_algorithms(strategy)
        
        return {
            "success": True,
            "strategy": strategy,
            "algorithms": algorithms,
            "algorithm_type": "institutional",
            "compliance": "DL-001 + DL-002"
        }
        
    except Exception as e:
        return {
            "success": False,
            "strategy": strategy,
            "algorithms": [],
            "error": str(e),
            "fallback": f"Error loading {strategy} algorithms"
        }

@router.get("/api/algorithms")
async def get_all_strategies(user: User = Depends(get_current_user_safe)):
    """
    DL-001 COMPLIANT: All available institutional strategies
    
    Returns:
        Dictionary with all strategies and their institutional algorithms
    """
    try:
        service = InstitutionalAlgorithmsService()
        all_strategies = service.get_all_strategies()
        
        return {
            "success": True,
            "strategies": all_strategies,
            "algorithm_type": "institutional_only",
            "compliance": "DL-001 + DL-002"
        }
        
    except Exception as e:
        return {
            "success": False,
            "strategies": {},
            "error": str(e)
        }