
export enum DataMode {
  LIVE = 'LIVE',
  SIMULATED = 'SIMULATED',
  EOD = 'EOD'
}

export enum ViewState {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  PORTFOLIO = 'PORTFOLIO',
  SIGNALS = 'SIGNALS',
  WATCHLIST = 'WATCHLIST',
  BACKTEST = 'BACKTEST',
  MARKETPLACE = 'MARKETPLACE',
  MULTI_ACCOUNT = 'MULTI_ACCOUNT',
  SETTINGS = 'SETTINGS',
  HISTORY = 'HISTORY',
  ANALYTICS = 'ANALYTICS',
  REPORTS = 'REPORTS',
  INVESTOR = 'INVESTOR',
  ADMIN = 'ADMIN',
  PRICING = 'PRICING',
  PITCH = 'PITCH',
  COMPLIANCE = 'COMPLIANCE',
  STOCK_DETAIL = 'STOCK_DETAIL',
  LEGAL = 'LEGAL',
  WAITLIST = 'WAITLIST',
  LANDING = 'LANDING',
  BLOG = 'BLOG',
  BLOG_POST = 'BLOG_POST',
  REFERRALS = 'REFERRALS',
  TENANT_ADMIN = 'TENANT_ADMIN',
  PARTNERSHIP = 'PARTNERSHIP',
  TENANT_REVENUE = 'TENANT_REVENUE',
  FIRM_GOVERNANCE = 'FIRM_GOVERNANCE',
  AUDIT_CENTER = 'AUDIT_CENTER',
  BROKER_KIT = 'BROKER_KIT',
  EXPERIMENT_LAB = 'EXPERIMENT_LAB',
  HEATMAP = 'HEATMAP',
  WHITEPAPER = 'WHITEPAPER',
  CERTIFICATION = 'CERTIFICATION',
  LEGAL_VAULT = 'LEGAL_VAULT',
  MODEL_REGISTRY = 'MODEL_REGISTRY',
  IP_PROTECTION = 'IP_PROTECTION',
  LEGAL_CENTER = 'LEGAL_CENTER',
  INCIDENT_RESPONSE = 'INCIDENT_RESPONSE',
  STRATEGY_LICENSES = 'STRATEGY_LICENSES',
  SECURITY_AUDIT = 'SECURITY_AUDIT',
  COMPLIANCE_MAP = 'COMPLIANCE_MAP',
  TRUST_CENTER = 'TRUST_CENTER',
  LAUNCH_CONTROL = 'LAUNCH_CONTROL',
  SUPPORT_DESK = 'SUPPORT_DESK',
  SANDBOX_HUB = 'SANDBOX_HUB',
  ONBOARDING_INSTITUTIONAL = 'ONBOARDING_INSTITUTIONAL',
  AI_HEALTH_DASHBOARD = 'AI_HEALTH_DASHBOARD',
  INSTITUTIONAL_READINESS = 'INSTITUTIONAL_READINESS',
  OPERATING_DOCUMENT = 'OPERATING_DOCUMENT',
  LINEAGE_FORENSICS = 'LINEAGE_FORENSICS'
}

export enum UserRole { ADMIN = 'ADMIN', TRADER = 'TRADER', VIEWER = 'VIEWER', TENANT_OWNER = 'TENANT_OWNER' }
export enum Plan { FREE = 'FREE', PRO = 'PRO', ELITE = 'ELITE', INSTITUTIONAL = 'INSTITUTIONAL' }
export enum BillingCycle { MONTHLY = 'MONTHLY', YEARLY = 'YEARLY' }

export interface UserProfile { 
  id: string; 
  userId: string; 
  tenantId?: string;
  role: UserRole; 
  plan: Plan; 
  billingCycle?: BillingCycle;
  firstName?: string;
  lastName?: string;
  email: string;
  mobile: string;
  city?: string;
  district?: string;
  state?: string;
  pin?: string;
  password?: string;
  onboardingCompleted: boolean; 
  expiryDate: string; 
  securityAudit: { 
    lastPasswordChange: string; 
    mfaVerified: boolean; 
    identityVerified: boolean; 
  }; 
}

export interface PortfolioItem {
  id: string;
  symbol: string;
  assetClass: AssetClass;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  unrealized?: number;
  trailingSL?: number;
  exchange?: string;
  isin?: string;
  product?: string;
  sector?: string;
}

export interface PortfolioSummary {
  totalprofitandloss: number;
  totalinvvalue: number;
  totalholdingvalue: number;
  totalpnlpercentage: number;
}

export interface MarketTick {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  volume: number;
  assetClass?: AssetClass;
  dataMode?: DataMode;
}

export enum AssetClass {
  EQUITY = 'EQUITY',
  DERIVATIVES = 'DERIVATIVES',
  COMMODITIES = 'COMMODITIES',
  CURRENCY = 'CURRENCY'
}

export enum DecisionState { 
  DATA_INGESTED = 'DATA_INGESTED', 
  FEATURES_EXTRACTED = 'FEATURES_EXTRACTED', 
  MATH_PROBABILITY_SYNCED = 'MATH_PROBABILITY_SYNCED', 
  AGENTIC_AUDIT_COMPLETE = 'AGENTIC_AUDIT_COMPLETE', 
  RISK_GATED = 'RISK_GATED', 
  DISPATCH_READY = 'DISPATCH_READY', 
  REJECTED = 'REJECTED' 
}

export interface AISignal { 
  id: string; 
  traceId?: string;
  symbol: string; 
  assetClass?: AssetClass;
  action: 'BUY' | 'SELL' | 'HOLD'; 
  probability: number; 
  confidence?: number; 
  timestamp: string; 
  reasoning: string; 
  strategy: string; 
  targets: { entry: number; sl: number; t1: number; t2: number }; 
  allocation?: number; 
  decisionState: DecisionState; 
  trapDetected?: string;
  smartMoneyFlow?: 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL';
  insight?: InsightShard;
  clusters?: EvidenceCluster[];
  runMode?: string;
  institutionalGuard?: InstitutionalTelemetry;
  conflictPenalty?: number;
  quality?: {
    probability: number;
    confidenceBand: string;
    qualityBadge: string;
  };
}

export interface EvidenceCluster {
  type: EvidenceType;
  avgStrength?: number;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  harmonyScore?: number;
  volatility?: number;
}

export type EvidenceType = "MOMENTUM" | "TREND" | "SMART_MONEY" | "STRUCTURE" | "GENERAL" | "RISK" | "VOLUME";

export interface Evidence {
  type: EvidenceType;
  description: string;
  strength: number;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface TradeThesis {
  symbol: string;
  direction: 'BUY' | 'SELL';
  headline: string;
  supportingEvidence: Evidence[];
  invalidationEvidence: Evidence[];
  thesisStrength: number;
  invalidationPoint: number;
}

export interface TradeThesisContract {
  symbol: string;
  direction: 'BUY' | 'SELL';
  headline: string;
  thesisStrength: number;
  supportingFactors: { label: string; strength: number }[];
  riskFactors: { label: string; severity: string }[];
  invalidationPoint: number;
}

export interface InstitutionalTelemetry {
  regimeConfidence: number;
  horizonAlignment: number;
  liquidityBuffer: number;
  survivalIndex: number;
  gates: GateStatus[];
}

export interface GateStatus {
  id: string;
  label: string;
  passed: boolean;
  score: number;
  reason: string;
}

export interface InsightShard {
  verdict: 'CONFIRMED' | 'CAUTION' | 'REJECTED';
  narrative: string;
  keyFactors: string[];
  counterArguments: string[];
  institutionalBias: string;
}

export interface SymbolAnalysis {
  symbol: string;
  regime: string;
  smartMoneyFlow: string;
  trapRisk: string;
  probability: number;
  targets: { entry: number; sl: number; t1: number; t2: number };
  explanation: string;
  reasoning_points: string[];
  indicators_flagged: string[];
  timestamp: string;
  forecast?: ForecastPoint[];
  marketDepth?: MarketDepth;
  footprint?: FootprintBar[];
}

export interface ForecastPoint {
  candle: number;
  up: number;
  down: number;
  range: number;
}

export interface MarketDepth {
  bids: MarketDepthItem[];
  asks: MarketDepthItem[];
  imbalance: number;
  spoofingDetected: boolean;
  absorptionDetected: boolean;
}

export interface MarketDepthItem {
  price: number;
  qty: number;
  orders?: number;
}

export interface FootprintBar {
  price: number;
  buyVol: number;
  sellVol: number;
  delta: number;
}

export interface BacktestAnalysis {
  riskScore: number;
  verdict: string;
  pros: string[];
  cons: string[];
  summary: string;
}

export interface BacktestResult {
  stats: any;
  trades: any[];
  equity_curve: any[];
}

export interface BrokerConfig {
  brokerName: string;
  apiKey: string;
  clientId: string;
  password?: string;
  totpSecret?: string;
  isConnected: boolean;
}

export interface StrategyStatus {
  name: string;
  winRate: number;
  netPnL: number;
  expectancy: number;
  profitFactor: number;
  status: 'ACTIVE' | 'DISABLED' | 'RETIRED' | 'DORMANT';
  weight: number;
  reason?: string;
  decayScore?: number;
}

export interface ChartDataPoint {
  date: string;
  equity: number;
  time?: string;
}

export interface EquitySnapshot {
  curve: ChartDataPoint[];
  maxDrawdown: number;
  peakEquity: number;
  currentEquity: number;
}

export type SecurityHandshake = 'IDLE' | 'CHALLENGE_SENT' | 'VERIFYING' | 'SUCCESS';
export type VerificationAction = 'PWD_CHANGE' | 'EMAIL' | 'MOBILE' | 'LOCATION';

export interface StrategyDNA {
  id: string;
  name: string;
  indicators: string[];
  thresholds: Record<string, number>;
  riskMultiplier: number;
  evolutionGeneration: number;
  fitness: number;
}

export interface BrokerOrder {
  orderid: string;
  tradingsymbol: string;
  status: string;
  transactiontype: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  averageprice?: number;
  filledshares?: string;
  clientorderid?: string;
}

export interface BrokerTrade {
  tradeid: string;
  orderid: string;
  tradingsymbol: string;
  transactiontype: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  tradeTime: string;
}

export interface PnLSnapshot {
  realized: number;
  unrealized: number;
  net: number;
  timestamp: string;
}

export interface OrderUpdate {
  orderid: string;
  tradingsymbol: string;
  status: string;
  transactiontype: 'BUY' | 'SELL';
  filledqty: number;
  avgprice: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  strategy: string;
  entryTime: string;
  exitTime?: string;
  status: 'OPEN' | 'CLOSED';
}

export interface TradeAnalytics {
  totalTrades: number;
  winRate: number;
  netPnL: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  profitFactor: number;
  maxDrawdown: number;
}

export interface RiskConfig {
  maxCapitalPerTrade: number;
  maxDailyLoss: number;
  maxOpenPositions: number;
  stopLossDefault: number;
  trailingSLEnabled: boolean;
  killSwitchActive: boolean;
}

export interface AllocationResult {
  symbol: string;
  amount: number;
  risk: number;
  reason: string;
  accounts: AccountAllocation[];
}

export interface AccountAllocation {
  accountId: string;
  amount: number;
  risk: number;
}

export interface DailyReport {
  date: string;
  totalTrades: number;
  netPnL: number;
  maxDrawdown: number;
  winRate: number;
  riskBreaches: string[];
  bestStrategy: string;
  sharpeRatio: number;
}

export interface LatencyReport {
  tickReceivedToFeatures: number;
  featuresToDecision: number;
  decisionToAlert: number;
  alertToExecution: number;
  totalMs: number;
}

export interface EthicsStatus {
  isAllowed: boolean;
  reason: string;
  overfitRisk: number;
  confidenceAdjustment: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  metadata: string;
  createdAt: string;
}

export interface MLInferenceResult {
  symbol: string;
  xgbProb: number;
  lstmRegime: string;
  confidence: number;
  factors: string[];
}

export interface StrategyMetrics {
  id: string;
  name: string;
  winRate: number;
  expectancy: number;
  drawdown: number;
  score: number;
  status: 'ACTIVE' | 'DORMANT';
}

export interface AccountNode {
  id: string;
  name: string;
  broker: string;
  balance: number;
  allocationPct: number;
  status: 'CONNECTED' | 'DISCONNECTED';
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  payload: any;
  timestamp: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
}

export interface LicenseInfo {
  userId: string;
  plan: Plan;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRED';
  deviceBindingId: string;
}

export interface PortfolioHealth {
  correlationIndex: number;
  sectorExposure: SectorExposure[];
  hedgeHints: HedgeHint[];
  portfolioBeta: number;
}

export interface SectorExposure {
  sector: string;
  value: number;
  percentage: number;
  riskStatus: 'SAFE' | 'WARNING' | 'CRITICAL';
}

export interface HedgeHint {
  instrument: string;
  action: 'BUY' | 'SELL';
  reason: string;
  impactOnBeta: number;
  active: boolean;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
}

export interface ReferralInfo {
  referrerId: string;
  refereeCount: number;
  totalEarnings: number;
  referralLink: string;
  unlockedPlan: Plan;
}

export interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logoUrl: string;
  theme: {
    primary: string;
    accent: string;
    bg: string;
  };
  allowedBrokers: string[];
  subscriptionModel: 'SAAS' | 'COMMISSION';
  active: boolean;
}

export interface LiveOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  type: 'MARKET' | 'LIMIT';
  price: number;
  status: 'PENDING' | 'EXECUTED' | 'REJECTED';
  broker: string;
  timestamp: string;
  confidence: number;
}

export interface TenantRevenueStats {
  totalRevenue: number;
  mrr: number;
  subscriptions: number;
  arpu: number;
  churn: number;
  growth: number;
  ltv: number;
}

export interface FirmGovernance {
  maxFirmDrawdown: number;
  correlationLimit: number;
  strategyExposureCap: number;
  realtimeVaR: number;
  instantKillSwitch: boolean;
  aiEthicsPolicy: {
    humanInControl: boolean;
    martingaleBlocked: boolean;
    revengeTradingFilter: boolean;
    explainabilityThreshold: number;
  };
}

export interface TraderPod {
  id: string;
  name: string;
  assignedTraders: string[];
  maxCapital: number;
  maxDrawdown: number;
  allowedStrategies: string[];
  leverageLimit: number;
  currentEquity: number;
  pnl: number;
  status: 'ACTIVE' | 'WARNED' | 'HALTED';
}

export interface StrategyFeatures {
  momentumScore: number;
  trendScore: number;
  structureScore: number;
  smartMoneyScore: number;
  volumeScore: number;
}

export interface ProbabilityResult {
  finalProbability: number;
  components: ProbabilityComponents;
  approved: boolean;
}

export interface ProbabilityComponents {
  technical: number;
  volume: number;
  orderBook: number;
  marketRegime: number;
  mlConfidence: number;
  correlationPenalty: number;
}

export interface ConfirmationCheck {
  name: string;
  passed: boolean;
  weight: number;
}

export interface ConfirmationResult {
  confirmationsPassed: number;
  totalWeight: number;
  approved: boolean;
  reasons: string[];
}

export interface ExecutionPlan {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryType: 'MARKET' | 'LIMIT';
  stopLoss: number;
  target: number;
}

export interface SymbolMemory {
  symbol: string;
  winRate: number;
  totalTrades: number;
  lastOutcome: 'WIN' | 'LOSS';
  regimeBias: Record<string, number>;
  trapFrequency: number;
}

export interface ShadowPerformance {
  strategyName: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  eligibleForCore: boolean;
}

export interface EngineStage<TInput, TOutput> {
  name: string;
  execute: (input: TInput, ctx: EngineContext) => Promise<TOutput>;
}

export interface EngineContext {
  symbol: string;
  mode: 'LIVE' | 'PAPER' | 'BACKTEST';
}

export interface ShadowStrategyStats {
  strategy: string;
  accuracy: number;
  trades: number;
  winRate: number;
  eligibleForPromotion: boolean;
  regimeBias: Record<string, number>;
}

export interface RiskAudit {
  allowed: boolean;
  reason: string;
  suggestedQty: number;
  riskRating: 'LOW' | 'MEDIUM' | 'CRITICAL';
  firewallCode: string;
}

export interface PositionSizeParams {
  capital: number;
  probability: number;
  price: number;
  stopLossPrice: number;
  regime?: string;
}

export interface FeatureImpact {
  feature: string;
  impact: number;
  consistency: number;
}

export interface InstitutionalReport {
  strategyName: string;
  period: string;
  metrics: TradeAnalytics;
  equityCurve: ChartDataPoint[];
  riskNotes: string[];
  disclaimer: string;
}

export interface HeatmapNode {
  symbol: string;
  sector: string;
  value: number;
  pnl: number;
  weight: number;
}

export interface RebalanceAction {
  symbol: string;
  currentWeight: number;
  targetWeight: number;
  drift: number;
  action: 'BUY' | 'SELL';
  quantity: number;
}

export interface PitchMetrics {
  cagr: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  recoveryFactor: number;
  calmarRatio: number;
  processScore: number;
}

export interface StrategyCertification {
  strategyId: string;
  status: 'CERTIFIED' | 'REJECTED';
  scorecard: {
    quantStability: number;
    riskFidelity: number;
    regimeResilience: number;
    latencyBuffer: number;
  };
  certifiedRegimes: string[];
  maxAUMAllocation: number;
  expiryDate: string;
}

export interface GovernancePolicy {
  hitlRequired: boolean;
  martingaleBlocked: boolean;
  minExplainability: number;
  maxDailyDDBreach: number;
  leverageCap: number;
}

export interface RegionalNode {
  id: string;
  region: string;
  status: 'OPTIMAL' | 'DEGRADED';
  latency: number;
  activeNodes: number;
}

export interface ModelMetadata {
  id: string;
  version: string;
  architecture: string;
  trainedOn: string;
  featureHash: string;
  status: 'PRODUCTION' | 'CANARY';
  lastValidated: string;
}

export interface SandboxStatus {
  isActive: boolean;
  forcedMode: 'SIMULATION' | 'PAPER';
  auditHashChain: string;
  regulatorBypass: boolean;
}

export interface IncidentLog {
  id: string;
  type: string;
  status: 'RESOLVED' | 'CONTAINED';
  severity: 'HIGH' | 'CRITICAL';
  timestamp: string;
  details: string;
  actionItems: string[];
}

export interface StrategyLicense {
  id: string;
  strategyId: string;
  type: 'PROFESSIONAL' | 'INSTITUTIONAL';
  expiry: string;
  capitalCap: number;
  revenueSplit: number;
  status: 'ACTIVE' | 'EXPIRED';
}

export interface PentestVulnerability {
  id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'FIXED' | 'IN_REMEDIATION';
}

export interface ComplianceRegion {
  name: string;
  code: string;
  status: 'COMPLIANT' | 'WARNING';
  notes: string[];
}

export interface LaunchStep {
  id: string;
  category: string;
  label: string;
  status: 'VERIFIED' | 'PENDING';
  description: string;
}

export interface SupportTicket {
  id: string;
  user: string;
  subject: string;
  level: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  timestamp: string;
}

export interface PilotScorecard {
  disciplineScore: number;
  vetoEfficiency: number;
  regimeResilience: number;
  explainabilityAudit: 'PASSED' | 'FAILED';
  survivalRating: 'ELITE' | 'STANDARD';
}

export interface AIMetrics {
  signalsGenerated: number;
  signalsRejected: number;
  noTradeDecisions: number;
  avgProbability: number;
  lossClusterEvents: number;
  rejectionReasons: Record<string, number>;
}

export interface DecisionAudit {
  decisionId: string;
  symbol: string;
  timestamp: string;
  decision: 'ALERT' | 'NO_TRADE';
  probability: {
    raw: number;
    afterDecay: number;
    threshold: number;
  };
  regime: {
    type: string;
    confidence: number;
  };
  guards: {
    liquidity: 'PASS' | 'FAIL';
    multiHorizon: 'PASS' | 'FAIL';
    probability: 'PASS' | 'FAIL';
    risk: 'PASS' | 'FAIL';
    lossCluster: 'PASS' | 'FAIL';
  };
  riskState: {
    capitalUsedPct: number;
    drawdownPct: number;
    lossClusterActive: boolean;
    killSwitch: boolean;
  };
  model: {
    version: string;
    certified: boolean;
  };
  auditHash: string;
}

export interface OrderIntent {
  intentId: string;
  traceId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price?: number;
  strategy: string;
  timestamp: number;
  status: 'PENDING' | 'DISPATCHED' | 'FAILED' | 'RECONCILED';
}

export interface LineageShard {
  traceId: string;
  eventType: 'TICK' | 'SIGNAL' | 'INTENT' | 'BROKER_ACK' | 'FILL' | 'P_AND_L';
  symbol: string;
  payload: any;
  timestamp: number;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  sector: string;
}

export interface AuditRecord {
  id: string;
  type: string;
  summary: string;
  timestamp: string;
  hash: string;
  userAccepted: boolean;
  details: any;
}

/**
 * 🧱 INSTITUTIONAL TYPES
 */
export type CorrelationMatrix = Record<string, Record<string, number>>;
