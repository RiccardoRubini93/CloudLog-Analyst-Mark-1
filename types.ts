export enum Severity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  NOTICE = 'NOTICE',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
  ALERT = 'ALERT',
  EMERGENCY = 'EMERGENCY'
}

export interface LogEntry {
  timestamp: string; // ISO string
  severity: Severity;
  service: string; // e.g., "compute-engine", "cloud-sql"
  message: string;
  traceId?: string;
}

export interface AnalysisSummary {
  overview: string;
  criticalIssues: string[];
  recommendations: string[];
}

export interface LogStats {
  total: number;
  errorCount: number;
  warningCount: number;
  byService: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface CostEntry {
  date: string;
  cost: number;
  currency: string;
}

export interface ServiceCost {
  service: string;
  cost: number;
}

export interface CostReport {
  totalMonthToDate: number;
  projectedEndOfMonth: number;
  dailyTrend: CostEntry[];
  serviceBreakdown: ServiceCost[];
  aiAnalysis: string;
  optimizationTips: string[];
  finOpsScore?: number;
}

export interface SecretsContextType {
  projectId: string;
  accessToken: string;
  setSecrets: (projectId: string, token: string) => void;
  clearSecrets: () => void;
  hasSecrets: boolean;
  isEnvManaged: boolean;
  loadFromEnv: () => boolean;
}