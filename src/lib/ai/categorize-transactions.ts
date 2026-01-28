import { genAI, MODEL_NAME } from "@/lib/gemini";
import type { ImportTransactionRow } from "@/schema/transaction.schema";

// ============================================
// TYPES
// ============================================

export interface CategoryInfo {
  id: string;
  name: string;
  type: "REVENUE" | "EXPENSE" | "TRANSFER" | "UNKNOWN";
  description: string | null;
}

export interface CategorizationResult {
  rowIndex: number;
  categoryId: string | null;
  categoryName: string | null;
  confidence: number;
  reasoning: string;
}

export interface BatchCategorizationResult {
  results: CategorizationResult[];
  tokensUsed: number;
}

// ============================================
// PROMPT GENERATION
// ============================================

function buildCategorizationPrompt(
  transactions: { rowIndex: number; transaction: ImportTransactionRow }[],
  categories: CategoryInfo[]
): string {
  const categoryList = categories
    .map(c => `- "${c.name}" (ID: ${c.id}, Type: ${c.type})${c.description ? `: ${c.description}` : ""}`)
    .join("\n");

  const transactionList = transactions
    .map(({ rowIndex, transaction: t }) =>
      `${rowIndex}. Date: ${t.postingDate.toISOString().split("T")[0]}, ` +
      `Description: "${t.description}", ` +
      `Amount: $${t.amount.toFixed(2)}, ` +
      `Type: ${t.type}`
    )
    .join("\n");

  return `You are a financial categorization assistant for a trucking company (Peak Transport LLC).
Your task is to categorize bank transactions into the appropriate categories.

Available Categories:
${categoryList}

Transactions to categorize:
${transactionList}

For each transaction, analyze the description and amount to determine the most appropriate category.

Key patterns to recognize:
- "AMAZON.COM SERVICES" or "AMAZON EDI PAYMENTS" → Amazon Payout (revenue from Amazon)
- "ADP WAGE PAY" → Driver Wages
- "ADP Tax" → Payroll Taxes
- "ADP PAYROLL FEES" → Admin/Overhead
- "AMAZON INSURANCE" → Insurance
- "Wise Inc" → Workers Comp
- Gas stations (MARATHON, KWIK TRIP, BP, SHELL, EXXON, HOLIDAY) → Fuel
- Auto parts stores (O'REILLY, AUTOZONE, NAPA) → Maintenance
- "OPENPHONE", "NAMECHEAP", "Monday.com", "INDEED" → Admin/Overhead
- "MONTHLY SERVICE FEE", "COUNTER CHECK" → Bank Fees
- Transfers between accounts → Cash Transfer
- Personal expenses → Personal/Excluded

Respond in JSON format only. Return an array of objects with this structure:
[
  {
    "rowIndex": <number>,
    "categoryId": "<uuid or null if uncertain>",
    "categoryName": "<category name or null>",
    "confidence": <0.0 to 1.0>,
    "reasoning": "<brief explanation>"
  }
]

Important:
- Set confidence to 0.9+ for clear matches (exact pattern match)
- Set confidence to 0.7-0.9 for likely matches (partial match or common pattern)
- Set confidence to 0.5-0.7 for uncertain matches (best guess)
- Set confidence below 0.5 and categoryId to null if you cannot determine the category
- Credits (positive amounts) are typically revenue
- Debits (negative amounts) are typically expenses or transfers`;
}

// ============================================
// CATEGORIZATION
// ============================================

export async function categorizeTransactions(
  transactions: { rowIndex: number; transaction: ImportTransactionRow }[],
  categories: CategoryInfo[]
): Promise<BatchCategorizationResult> {
  if (transactions.length === 0) {
    return { results: [], tokensUsed: 0 };
  }

  // Filter out categories that shouldn't be auto-assigned
  const validCategories = categories.filter(
    c => c.name !== "Uncategorized" && c.type !== "UNKNOWN"
  );

  const prompt = buildCategorizationPrompt(transactions, validCategories);

  try {
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.1, // Low temperature for consistent categorization
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "";

    // Parse JSON response
    let results: CategorizationResult[];
    try {
      // Handle potential markdown code blocks
      let jsonText = text;
      if (text.includes("```json")) {
        jsonText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (text.includes("```")) {
        jsonText = text.replace(/```\n?/g, "");
      }

      results = JSON.parse(jsonText.trim());
    } catch {
      console.error("Failed to parse AI response:", text);
      // Return empty results with low confidence
      results = transactions.map(({ rowIndex }) => ({
        rowIndex,
        categoryId: null,
        categoryName: null,
        confidence: 0,
        reasoning: "Failed to parse AI response",
      }));
    }

    // Validate and normalize results
    const normalizedResults = results.map(r => ({
      rowIndex: r.rowIndex,
      categoryId: r.categoryId || null,
      categoryName: r.categoryName || null,
      confidence: Math.max(0, Math.min(1, r.confidence || 0)),
      reasoning: r.reasoning || "",
    }));

    // Estimate tokens used (rough approximation)
    const tokensUsed = Math.ceil((prompt.length + text.length) / 4);

    return {
      results: normalizedResults,
      tokensUsed,
    };
  } catch (error) {
    console.error("AI categorization error:", error);

    // Return fallback results
    return {
      results: transactions.map(({ rowIndex }) => ({
        rowIndex,
        categoryId: null,
        categoryName: null,
        confidence: 0,
        reasoning: error instanceof Error ? error.message : "AI service error",
      })),
      tokensUsed: 0,
    };
  }
}

// ============================================
// BATCH PROCESSING
// ============================================

const BATCH_SIZE = 20; // Process 20 transactions at a time to avoid token limits

export async function categorizeTransactionsBatch(
  transactions: { rowIndex: number; transaction: ImportTransactionRow }[],
  categories: CategoryInfo[]
): Promise<BatchCategorizationResult> {
  const allResults: CategorizationResult[] = [];
  let totalTokens = 0;

  // Process in batches
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    const { results, tokensUsed } = await categorizeTransactions(batch, categories);
    allResults.push(...results);
    totalTokens += tokensUsed;

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < transactions.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return {
    results: allResults,
    tokensUsed: totalTokens,
  };
}
