"use client";

import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PLLineItemRow } from "@/components/pl";
import { useBatchPLStatement } from "@/hooks";
import type { PLSection } from "@/schema/transaction.schema";
import { cn } from "@/lib/utils";

interface BatchPLBreakdownProps {
  batchId: string;
}

export function BatchPLBreakdown({ batchId }: BatchPLBreakdownProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { statement, isLoading } = useBatchPLStatement(batchId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const hasData =
    statement &&
    (statement.revenue.items.length > 0 ||
      statement.contraRevenue.items.length > 0 ||
      statement.cogs.items.length > 0 ||
      statement.operatingExpenses.items.length > 0);

  const renderSection = (
    title: string,
    section: PLSection | undefined,
    isNegative: boolean = false
  ) => {
    if (!section || section.items.length === 0) return null;

    return (
      <div>
        <h3 className="text-sm font-semibold uppercase text-slate-500 mb-3">
          {title}
        </h3>
        <div className="bg-slate-50 rounded-lg p-4">
          {section.items.map((item) => (
            <PLLineItemRow
              key={item.categoryId}
              item={item}
              isNegative={isNegative}
              transactionBatchId={batchId}
            />
          ))}
          <div className="flex items-center justify-between pt-3 mt-3 border-t-2 border-slate-200">
            <span className="text-sm font-semibold">Total {title}</span>
            <span
              className={cn(
                "text-sm font-mono font-bold",
                isNegative ? "text-red-600" : "text-green-600"
              )}
            >
              {formatCurrency(section.total)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <span>P&L Breakdown</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : !hasData ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No categorized transactions yet. Categorize transactions to see the P&L breakdown.
                </p>
              </div>
            ) : (
              <>
                {/* Revenue */}
                {renderSection("Revenue", statement?.revenue, false)}

                {/* Contra-Revenue */}
                {statement?.contraRevenue && statement.contraRevenue.items.length > 0 &&
                  renderSection("Contra-Revenue", statement.contraRevenue, false)}

                {/* Net Revenue Subtotal */}
                <div className="bg-slate-800 text-white rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">Net Revenue</span>
                    <span
                      className={cn(
                        "text-xl font-mono font-bold",
                        (statement?.netRevenue ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
                      )}
                    >
                      {formatCurrency(statement?.netRevenue ?? 0)}
                    </span>
                  </div>
                </div>

                {/* COGS */}
                {renderSection("Cost of Goods Sold", statement?.cogs, true)}

                {/* Gross Profit Subtotal */}
                <div className="bg-emerald-900 text-white rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">Gross Profit</span>
                    <span
                      className={cn(
                        "text-xl font-mono font-bold",
                        (statement?.grossProfit ?? 0) >= 0 ? "text-emerald-300" : "text-red-400"
                      )}
                    >
                      {formatCurrency(statement?.grossProfit ?? 0)}
                    </span>
                  </div>
                </div>

                {/* Operating Expenses */}
                {renderSection("Operating Expenses", statement?.operatingExpenses, true)}

                {/* Operating Income */}
                <div className="bg-slate-900 text-white rounded-lg p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-semibold">Operating Income</span>
                      <p className="text-xs text-slate-400 mt-1">
                        Margin: {(statement?.operatingMargin ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-2xl font-mono font-bold",
                        (statement?.operatingIncome ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
                      )}
                    >
                      {formatCurrency(statement?.operatingIncome ?? 0)}
                    </span>
                  </div>
                </div>

                {/* Equity note */}
                {statement && statement.equityCount > 0 && (
                  <div className="bg-slate-100 rounded-lg p-4 text-sm text-slate-600">
                    <p className="font-medium">Equity transactions excluded from P&L</p>
                    <p className="text-xs mt-1">
                      {statement.equityCount} transaction{statement.equityCount !== 1 ? "s" : ""} totaling{" "}
                      {formatCurrency(statement.equityAmount)} (Owner contributions/draws)
                    </p>
                  </div>
                )}

                {/* Uncategorized warning */}
                {statement && statement.uncategorizedCount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                    <p className="font-medium">
                      {statement.uncategorizedCount} uncategorized transaction
                      {statement.uncategorizedCount !== 1 ? "s" : ""} (
                      {formatCurrency(Math.abs(statement.uncategorizedAmount))})
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      These transactions are excluded from this breakdown
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
