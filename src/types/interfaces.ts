/**
 * Object interface
 */
export interface ObjectLiteral {
  [key: string]: any;
}

/**
 * Interface for parsed candidates
 */
export interface Candidate {
  foundation: string;
  component: string;
  protocol: string;
  priority: number;
  ip: string;
  port: number;
  type: string;
  relatedAddress?: string;
  relatedPort?: number;
  tcpType?: string;
}

/**
 * Interface for a standard logger
 */
export interface Logger {
  log (...args: any[]): void;
  info (...args: any[]): void;
  warn (...args: any[]): void;
  error (...args: any[]): void;
}

/**
 * Interface for test results
 */
export interface TestResult {
  status: string;
  name: string;
  message?: string;
  details?: string;
  results?: string[];
}
