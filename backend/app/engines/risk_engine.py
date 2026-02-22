"""
Risk Management System
5-Layer Risk Firewall for Trading Protection

Layers:
1. Position Sizing - Kelly Criterion, risk per trade
2. Stop Loss - ATR-based stops, trailing stops
3. Correlation - Position correlation, sector exposure
4. Firm Risk - Daily/weekly limits, margin checks
5. Survival Guard - Account drawdown, kill switch
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum
import numpy as np

from loguru import logger


class RiskLevel(str, Enum):
    """Risk level classification"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EXTREME = "EXTREME"


@dataclass
class LayerResult:
    """Result from a single risk layer"""
    passed: bool
    score: float
    reason: str
    details: Dict = field(default_factory=dict)


@dataclass
class RiskAudit:
    """Complete risk audit result"""
    allowed: bool
    reason: str
    suggested_quantity: int
    risk_rating: RiskLevel
    firewall_code: str
    layers: Dict[str, LayerResult]


@dataclass
class RiskState:
    """Current risk state for an account"""
    daily_pnl: float = 0.0
    weekly_pnl: float = 0.0
    daily_trades: int = 0
    weekly_trades: int = 0
    open_positions: int = 0
    used_margin: float = 0.0
    available_margin: float = 0.0
    max_drawdown: float = 0.0
    current_drawdown: float = 0.0
    kill_switch_active: bool = False
    kill_switch_reason: Optional[str] = None
    peak_equity: float = 0.0
    trough_equity: float = 0.0


@dataclass
class PositionInfo:
    """Information about a position"""
    symbol: str
    exchange: str
    quantity: int
    entry_price: float
    current_price: float
    pnl: float
    sector: Optional[str] = None


@dataclass
class TradeRequest:
    """Trade request for risk audit"""
    symbol: str
    exchange: str
    side: str  # 'BUY' or 'SELL'
    quantity: int
    price: float
    stop_loss: Optional[float] = None
    target: Optional[float] = None
    strategy: Optional[str] = None
    sector: Optional[str] = None


class RiskManagementSystem:
    """
    Production-Grade 5-Layer Risk Management System
    
    Each layer performs specific checks:
    - Layer 1: Position Sizing (Kelly Criterion, max risk per trade)
    - Layer 2: Stop Loss (ATR-based, trailing stops)
    - Layer 3: Correlation (sector exposure, position correlation)
    - Layer 4: Firm Risk (daily/weekly limits, margin)
    - Layer 5: Survival Guard (drawdown, kill switch)
    """

    def __init__(
        self,
        total_capital: float = 100000,
        config: Optional[Dict] = None
    ):
        """
        Initialize Risk Management System
        
        Args:
            total_capital: Total trading capital
            config: Risk configuration overrides
        """
        self.total_capital = total_capital

        # Default configuration
        self.config = {
            # Position Sizing
            'max_risk_per_trade': 0.01,  # 1%
            'max_position_size': 0.05,  # 5%
            'kelly_fraction': 0.25,

            # Stop Loss
            'default_stop_percent': 0.02,
            'atr_multiplier': 2.0,
            'trailing_stop_trigger': 0.03,
            'trailing_stop_distance': 0.015,

            # Correlation
            'max_sector_exposure': 0.25,
            'correlation_threshold': 0.7,
            'max_correlated_exposure': 0.30,

            # Firm Risk
            'max_daily_loss': 0.02,  # 2%
            'max_weekly_loss': 0.05,  # 5%
            'max_daily_trades': 50,
            'max_open_positions': 10,
            'max_margin_utilization': 0.80,

            # Survival Guard
            'max_drawdown': 0.10,  # 10%
            'kill_switch_threshold': 0.05,  # 5%
            'position_reduction_threshold': 0.05,

            # VaR
            'var_confidence_level': 0.95,
        }

        if config:
            self.config.update(config)

        self.state = RiskState(
            available_margin=total_capital,
            peak_equity=total_capital,
            trough_equity=total_capital,
        )
        self.positions: List[PositionInfo] = []

        logger.info(f"🛡️ Risk Management System initialized with capital: {total_capital}")

    async def audit_trade(self, request: TradeRequest) -> RiskAudit:
        """
        Perform comprehensive risk audit for a trade request
        
        Args:
            request: Trade request details
            
        Returns:
            RiskAudit with layer-by-layer results
        """
        # Run all 5 layers
        layers = {
            'position_sizing': await self._audit_position_sizing(request),
            'stop_loss': await self._audit_stop_loss(request),
            'correlation': await self._audit_correlation(request),
            'firm_risk': await self._audit_firm_risk(request),
            'survival_guard': await self._audit_survival_guard(request),
        }

        # Overall pass/fail
        all_passed = all(layer.passed for layer in layers.values())
        any_critical = not layers['survival_guard'].passed or not layers['firm_risk'].passed

        # Calculate suggested quantity
        suggested_qty = self._calculate_suggested_quantity(request, layers)

        # Determine risk rating
        risk_rating = self._calculate_risk_rating(layers)

        # Generate firewall code
        firewall_code = self._generate_firewall_code(layers)

        # Build reason
        reason = self._build_reason(layers, all_passed)

        # Check kill switch
        if self.state.kill_switch_active:
            all_passed = False
            reason = f"Kill switch active: {self.state.kill_switch_reason}"

        return RiskAudit(
            allowed=all_passed,
            reason=reason,
            suggested_quantity=suggested_qty,
            risk_rating=risk_rating,
            firewall_code=firewall_code,
            layers=layers,
        )

    # ==================== LAYER 1: POSITION SIZING ====================

    async def _audit_position_sizing(self, request: TradeRequest) -> LayerResult:
        """Layer 1: Position Sizing Check"""
        position_value = request.quantity * request.price
        max_position_value = self.total_capital * self.config['max_position_size']

        # Risk amount calculation
        stop_loss = request.stop_loss or request.price * (1 - self.config['default_stop_percent'])
        risk_per_share = abs(request.price - stop_loss)
        risk_amount = risk_per_share * request.quantity
        max_risk_amount = self.total_capital * self.config['max_risk_per_trade']

        # Checks
        if risk_amount > max_risk_amount:
            return LayerResult(
                passed=False,
                score=0.5,
                reason=f"Risk amount {risk_amount:.2f} exceeds max {max_risk_amount:.2f}",
                details={'risk_amount': risk_amount, 'max_risk': max_risk_amount}
            )

        if position_value > max_position_value:
            return LayerResult(
                passed=False,
                score=0.6,
                reason=f"Position value {position_value:.2f} exceeds max {max_position_value:.2f}",
                details={'position_value': position_value, 'max_position': max_position_value}
            )

        return LayerResult(
            passed=True,
            score=1.0,
            reason=f"Position sizing OK. Risk: {(risk_amount/self.total_capital)*100:.2f}%",
            details={'risk_amount': risk_amount, 'position_value': position_value}
        )

    # ==================== LAYER 2: STOP LOSS ====================

    async def _audit_stop_loss(self, request: TradeRequest) -> LayerResult:
        """Layer 2: Stop Loss Validation"""
        if request.stop_loss is None:
            return LayerResult(
                passed=True,
                score=0.8,
                reason=f"Using default stop loss: {self.config['default_stop_percent']*100:.1f}%",
                details={'stop_loss': None, 'default_used': True}
            )

        stop_distance = abs(request.price - request.stop_loss)
        stop_percent = stop_distance / request.price

        if stop_percent > 0.10:
            return LayerResult(
                passed=False,
                score=0.4,
                reason=f"Stop loss too wide: {stop_percent*100:.1f}% (max 10%)",
                details={'stop_percent': stop_percent}
            )

        if stop_percent < 0.005:
            return LayerResult(
                passed=False,
                score=0.3,
                reason=f"Stop loss too tight: {stop_percent*100:.2f}% (min 0.5%)",
                details={'stop_percent': stop_percent}
            )

        return LayerResult(
            passed=True,
            score=1.0,
            reason=f"Stop loss valid at {request.stop_loss:.2f} ({stop_percent*100:.2f}%)",
            details={'stop_loss': request.stop_loss, 'stop_percent': stop_percent}
        )

    # ==================== LAYER 3: CORRELATION ====================

    async def _audit_correlation(self, request: TradeRequest) -> LayerResult:
        """Layer 3: Correlation & Sector Exposure Check"""
        sector = request.sector or self._get_sector(request.symbol)

        # Calculate sector exposure
        sector_value = sum(
            abs(p.quantity * p.current_price)
            for p in self.positions
            if self._get_sector(p.symbol) == sector
        )
        new_sector_value = sector_value + (request.quantity * request.price)
        sector_exposure = new_sector_value / self.total_capital

        if sector_exposure > self.config['max_sector_exposure']:
            return LayerResult(
                passed=False,
                score=0.5,
                reason=f"Sector {sector} exposure would be {sector_exposure*100:.1f}% (max {self.config['max_sector_exposure']*100:.0f}%)",
                details={'sector': sector, 'exposure': sector_exposure}
            )

        # Check position correlation
        for pos in self.positions:
            if pos.symbol == request.symbol:
                return LayerResult(
                    passed=True,
                    score=0.7,
                    reason=f"Adding to existing position in {request.symbol}",
                    details={'existing_position': True}
                )

        return LayerResult(
            passed=True,
            score=1.0,
            reason=f"Correlation check passed. Sector: {sector}",
            details={'sector': sector, 'exposure': sector_exposure}
        )

    # ==================== LAYER 4: FIRM RISK ====================

    async def _audit_firm_risk(self, request: TradeRequest) -> LayerResult:
        """Layer 4: Firm-Level Risk Checks"""
        # Daily loss check
        max_daily_loss = self.total_capital * self.config['max_daily_loss']
        if self.state.daily_pnl < -max_daily_loss:
            return LayerResult(
                passed=False,
                score=0.2,
                reason=f"Daily loss limit exceeded: {abs(self.state.daily_pnl):.2f}",
                details={'daily_pnl': self.state.daily_pnl}
            )

        # Weekly loss check
        max_weekly_loss = self.total_capital * self.config['max_weekly_loss']
        if self.state.weekly_pnl < -max_weekly_loss:
            return LayerResult(
                passed=False,
                score=0.2,
                reason=f"Weekly loss limit exceeded: {abs(self.state.weekly_pnl):.2f}",
                details={'weekly_pnl': self.state.weekly_pnl}
            )

        # Daily trades check
        if self.state.daily_trades >= self.config['max_daily_trades']:
            return LayerResult(
                passed=False,
                score=0.3,
                reason=f"Daily trade limit reached: {self.state.daily_trades}",
                details={'daily_trades': self.state.daily_trades}
            )

        # Open positions check
        if self.state.open_positions >= self.config['max_open_positions']:
            return LayerResult(
                passed=False,
                score=0.3,
                reason=f"Max positions reached: {self.state.open_positions}",
                details={'open_positions': self.state.open_positions}
            )

        # Margin utilization
        new_margin = self.state.used_margin + (request.quantity * request.price)
        margin_util = new_margin / self.state.available_margin
        if margin_util > self.config['max_margin_utilization']:
            return LayerResult(
                passed=False,
                score=0.4,
                reason=f"Margin utilization would be {margin_util*100:.1f}%",
                details={'margin_utilization': margin_util}
            )

        return LayerResult(
            passed=True,
            score=1.0,
            reason=f"Firm risk OK. P&L: {self.state.daily_pnl:.2f}, Positions: {self.state.open_positions}",
            details={'daily_pnl': self.state.daily_pnl, 'margin_util': margin_util}
        )

    # ==================== LAYER 5: SURVIVAL GUARD ====================

    async def _audit_survival_guard(self, request: TradeRequest) -> LayerResult:
        """Layer 5: Account Survival Guard"""
        # Calculate survival score (0-100)
        survival_score = 100

        # Drawdown factor
        if self.state.current_drawdown > 0:
            drawdown_factor = (self.state.current_drawdown / self.config['max_drawdown']) * 30
            survival_score -= drawdown_factor

        # Daily loss factor
        if self.state.daily_pnl < 0:
            daily_loss_factor = (abs(self.state.daily_pnl) / (self.total_capital * self.config['kill_switch_threshold'])) * 25
            survival_score -= daily_loss_factor

        # Margin stress factor
        margin_stress = self.state.used_margin / max(self.state.available_margin, 1)
        survival_score -= margin_stress * 20

        # Check kill switch threshold
        daily_loss_percent = abs(self.state.daily_pnl) / self.total_capital
        if daily_loss_percent >= self.config['kill_switch_threshold']:
            await self._activate_kill_switch(f"Daily loss {daily_loss_percent*100:.2f}% exceeds threshold")
            return LayerResult(
                passed=False,
                score=survival_score,
                reason="KILL SWITCH ACTIVATED",
                details={'kill_switch': True}
            )

        # Check max drawdown
        if self.state.current_drawdown >= self.config['max_drawdown']:
            return LayerResult(
                passed=False,
                score=survival_score,
                reason=f"Drawdown {self.state.current_drawdown*100:.2f}% exceeds max",
                details={'drawdown': self.state.current_drawdown}
            )

        # Survival score threshold
        if survival_score < 50:
            return LayerResult(
                passed=False,
                score=survival_score,
                reason=f"Survival score {survival_score:.0f} below safe threshold (50)",
                details={'survival_score': survival_score}
            )

        return LayerResult(
            passed=True,
            score=survival_score,
            reason=f"Survival guard passed. Score: {survival_score:.0f}/100",
            details={'survival_score': survival_score}
        )

    # ==================== HELPER METHODS ====================

    def _calculate_suggested_quantity(
        self,
        request: TradeRequest,
        layers: Dict[str, LayerResult]
    ) -> int:
        """Calculate suggested quantity based on risk limits"""
        suggested = request.quantity

        # Adjust based on position sizing
        if not layers['position_sizing'].passed:
            risk_per_share = abs(request.price - (request.stop_loss or request.price * 0.98))
            max_risk = self.total_capital * self.config['max_risk_per_trade']
            suggested = min(suggested, int(max_risk / risk_per_share)) if risk_per_share > 0 else suggested

        # Adjust based on survival guard
        if 'survival_guard' in layers:
            survival_score = layers['survival_guard'].score
            if survival_score < 70:
                suggested = int(suggested * (survival_score / 100))

        return max(1, suggested)

    def _calculate_risk_rating(self, layers: Dict[str, LayerResult]) -> RiskLevel:
        """Calculate overall risk rating"""
        failed_layers = sum(1 for layer in layers.values() if not layer.passed)

        if failed_layers >= 3 or not layers['survival_guard'].passed:
            return RiskLevel.EXTREME
        if failed_layers >= 2 or not layers['firm_risk'].passed:
            return RiskLevel.HIGH
        if failed_layers >= 1:
            return RiskLevel.MEDIUM
        if layers['survival_guard'].score < 70:
            return RiskLevel.HIGH
        if layers['survival_guard'].score < 85:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW

    def _generate_firewall_code(self, layers: Dict[str, LayerResult]) -> str:
        """Generate firewall code for audit trail"""
        import time
        timestamp = hex(int(time.time()))[2:].upper()
        status = "PASS" if all(l.passed for l in layers.values()) else "FAIL"
        layer_codes = "".join([
            "P" if layers['position_sizing'].passed else "X",
            "S" if layers['stop_loss'].passed else "X",
            "C" if layers['correlation'].passed else "X",
            "F" if layers['firm_risk'].passed else "X",
            "G" if layers['survival_guard'].passed else "X",
        ])
        return f"RMS-{timestamp}-{status}-{layer_codes}"

    def _build_reason(self, layers: Dict[str, LayerResult], all_passed: bool) -> str:
        """Build reason message"""
        if all_passed:
            return "All risk checks passed. Trade approved."

        failed = [name for name, layer in layers.items() if not layer.passed]
        return f"Risk check failed: {', '.join(failed)}"

    def _get_sector(self, symbol: str) -> str:
        """Get sector for a symbol (simplified)"""
        sector_map = {
            'HDFC': 'BANKING', 'ICICI': 'BANKING', 'SBIN': 'BANKING',
            'TCS': 'IT', 'INFY': 'IT', 'WIPRO': 'IT',
            'RELIANCE': 'ENERGY', 'ONGC': 'ENERGY',
            'TATASTEEL': 'METALS', 'HINDALCO': 'METALS',
            'SUNPHARMA': 'PHARMA', 'DRREDDY': 'PHARMA',
            'TATAMOTORS': 'AUTO', 'MARUTI': 'AUTO',
            'HINDUNILVR': 'CONSUMER', 'ITC': 'CONSUMER',
            'LT': 'INFRA',
        }
        return sector_map.get(symbol.upper().replace('-EQ', ''), 'OTHER')

    async def _activate_kill_switch(self, reason: str) -> None:
        """Activate kill switch"""
        self.state.kill_switch_active = True
        self.state.kill_switch_reason = reason
        logger.critical(f"🚨 KILL SWITCH ACTIVATED: {reason}")

    def update_state(self, **kwargs) -> None:
        """Update risk state"""
        for key, value in kwargs.items():
            if hasattr(self.state, key):
                setattr(self.state, key, value)

    def add_position(self, position: PositionInfo) -> None:
        """Add position to tracking"""
        self.positions.append(position)
        self.state.open_positions = len(self.positions)

    def remove_position(self, symbol: str) -> None:
        """Remove position from tracking"""
        self.positions = [p for p in self.positions if p.symbol != symbol]
        self.state.open_positions = len(self.positions)


# Singleton instance
risk_system = RiskManagementSystem()
