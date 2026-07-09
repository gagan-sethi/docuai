export type FinancialInsightPriority = "high" | "medium" | "low";

export type FinancialInsightCategory =
  | "expense"
  | "supplier"
  | "anomaly"
  | "invoice"
  | "cash_flow";

export interface FinancialInsightMetric {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "warning" | "danger";
}

export interface FinancialInsight {
  id: string;
  title: string;
  description: string;
  priority: FinancialInsightPriority;
  category: FinancialInsightCategory;
  generatedAt: string;
  metrics: FinancialInsightMetric[];
  sourceDocumentIds?: string[];
}
