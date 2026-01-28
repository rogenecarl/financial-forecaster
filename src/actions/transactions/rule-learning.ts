"use server";

import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import type { ActionResponse } from "@/types/api";
import { revalidatePath } from "next/cache";

// ============================================
// TYPES
// ============================================

export interface PatternSuggestion {
  pattern: string;
  matchType: "contains" | "startsWith";
  confidence: number;
  sampleMatches: number;
  reasoning: string;
}

export interface RuleSuggestion {
  transactionId: string;
  description: string;
  categoryId: string;
  categoryName: string;
  patterns: PatternSuggestion[];
}

// ============================================
// PATTERN EXTRACTION
// ============================================

function extractPatterns(description: string): PatternSuggestion[] {
  const patterns: PatternSuggestion[] = [];
  const desc = description.trim();

  // Known vendor patterns (common in bank statements)
  const vendorPatterns = [
    { regex: /^(AMAZON\.COM\s+SERVICES)/i, name: "Amazon Services" },
    { regex: /^(AMAZON\s+EDI\s+PAYMENTS)/i, name: "Amazon EDI" },
    { regex: /^(ADP\s+WAGE\s+PAY)/i, name: "ADP Wages" },
    { regex: /^(ADP\s+Tax)/i, name: "ADP Tax" },
    { regex: /^(ADP\s+PAYROLL\s+FEES)/i, name: "ADP Fees" },
    { regex: /^(AMAZON\s+INSURANCE)/i, name: "Amazon Insurance" },
    { regex: /^(Wise\s+Inc)/i, name: "Wise (Workers Comp)" },
    { regex: /^(OPENPHONE)/i, name: "OpenPhone" },
    { regex: /^(NAME-CHEAP|NAMECHEAP)/i, name: "Namecheap" },
    { regex: /^(Monday\.com)/i, name: "Monday.com" },
    { regex: /^(INDEED)/i, name: "Indeed" },
    { regex: /^(MARATHON)/i, name: "Marathon Gas" },
    { regex: /^(KWIK\s+TRIP)/i, name: "Kwik Trip" },
    { regex: /^(BP#)/i, name: "BP Gas" },
    { regex: /^(SHELL\s+OIL)/i, name: "Shell Gas" },
    { regex: /^(HOLIDAY\s+STATIONS)/i, name: "Holiday Stations" },
    { regex: /^(EXXON)/i, name: "Exxon Gas" },
    { regex: /^(O'REILLY)/i, name: "O'Reilly Auto Parts" },
  ];

  // Check known patterns first
  for (const { regex, name } of vendorPatterns) {
    const match = desc.match(regex);
    if (match) {
      patterns.push({
        pattern: match[1],
        matchType: "startsWith",
        confidence: 0.95,
        sampleMatches: 0, // Will be filled later
        reasoning: `Known vendor pattern: ${name}`,
      });
    }
  }

  // If no known pattern matched, try to extract a meaningful pattern
  if (patterns.length === 0) {
    // Strategy 1: Use first N words before numbers or special chars
    const words = desc.split(/\s+/);
    const meaningfulWords: string[] = [];

    for (const word of words) {
      // Stop at numbers (like store #, reference numbers)
      if (/^\d/.test(word) || /^#\d/.test(word)) break;
      // Skip very short words unless they're all caps (likely acronyms)
      if (word.length < 3 && !/^[A-Z]+$/.test(word)) continue;
      meaningfulWords.push(word);
      // Stop after 3-4 meaningful words
      if (meaningfulWords.length >= 4) break;
    }

    if (meaningfulWords.length >= 2) {
      const pattern = meaningfulWords.join(" ");
      patterns.push({
        pattern,
        matchType: "contains",
        confidence: 0.7,
        sampleMatches: 0,
        reasoning: `First ${meaningfulWords.length} words of description`,
      });
    }

    // Strategy 2: Look for common prefixes like "ACH DEBIT", "DEBIT CARD", etc.
    const prefixMatch = desc.match(/^(ACH\s+(?:DEBIT|CREDIT)|DEBIT\s+CARD|WIRE\s+TRANSFER|CHECK)\s+(.+)/i);
    if (prefixMatch && prefixMatch[2]) {
      const afterPrefix = prefixMatch[2].trim();
      const firstWord = afterPrefix.split(/\s+/)[0];
      if (firstWord && firstWord.length > 3) {
        patterns.push({
          pattern: firstWord,
          matchType: "contains",
          confidence: 0.6,
          sampleMatches: 0,
          reasoning: "First significant word after transaction type",
        });
      }
    }
  }

  return patterns;
}

// ============================================
// SUGGEST PATTERNS
// ============================================

export async function suggestPatterns(
  transactionId: string
): Promise<ActionResponse<RuleSuggestion | null>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Get the transaction
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: { category: true },
    });

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    if (!transaction.categoryId || !transaction.category) {
      return { success: false, error: "Transaction must be categorized first" };
    }

    // Check if there's already an active rule that matches this description
    const existingRules = await prisma.categoryRule.findMany({
      where: {
        userId,
        categoryId: transaction.categoryId,
        isActive: true,
      },
    });

    for (const rule of existingRules) {
      const desc = transaction.description.toLowerCase();
      const pattern = rule.pattern.toLowerCase();

      if (
        (rule.matchType === "contains" && desc.includes(pattern)) ||
        (rule.matchType === "startsWith" && desc.startsWith(pattern)) ||
        (rule.matchType === "endsWith" && desc.endsWith(pattern))
      ) {
        // Already have a matching rule
        return { success: true, data: null };
      }
    }

    // Extract potential patterns
    const patterns = extractPatterns(transaction.description);

    if (patterns.length === 0) {
      return { success: true, data: null };
    }

    // For each pattern, count how many uncategorized transactions would match
    for (const pattern of patterns) {
      const matchCount = await prisma.transaction.count({
        where: {
          userId,
          categoryId: null,
          description: {
            contains: pattern.pattern,
            mode: "insensitive",
          },
        },
      });
      pattern.sampleMatches = matchCount;

      // Adjust confidence based on matches
      if (matchCount > 5) {
        pattern.confidence = Math.min(pattern.confidence + 0.1, 0.99);
        pattern.reasoning += ` (would match ${matchCount} uncategorized transactions)`;
      } else if (matchCount > 0) {
        pattern.reasoning += ` (would match ${matchCount} uncategorized transaction${matchCount > 1 ? "s" : ""})`;
      }
    }

    // Sort by confidence
    patterns.sort((a, b) => b.confidence - a.confidence);

    return {
      success: true,
      data: {
        transactionId: transaction.id,
        description: transaction.description,
        categoryId: transaction.categoryId,
        categoryName: transaction.category.name,
        patterns: patterns.slice(0, 3), // Return top 3 suggestions
      },
    };
  } catch (error) {
    console.error("Failed to suggest patterns:", error);
    return { success: false, error: "Failed to suggest patterns" };
  }
}

// ============================================
// CREATE RULE FROM SUGGESTION
// ============================================

export async function createRuleFromSuggestion(
  categoryId: string,
  pattern: string,
  matchType: "contains" | "startsWith" | "endsWith" = "contains"
): Promise<ActionResponse<{ ruleId: string; appliedCount: number }>> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    // Check for duplicate rule
    const existingRule = await prisma.categoryRule.findFirst({
      where: {
        userId,
        categoryId,
        pattern,
        matchType,
      },
    });

    if (existingRule) {
      return { success: false, error: "A similar rule already exists" };
    }

    // Create the rule
    const rule = await prisma.categoryRule.create({
      data: {
        userId,
        categoryId,
        pattern,
        matchType,
        field: "description",
        priority: 50, // Medium priority for user-created rules
        isActive: true,
        hitCount: 0,
      },
    });

    // Apply rule to matching uncategorized transactions
    const matchingTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId: null,
        description: matchType === "contains"
          ? { contains: pattern, mode: "insensitive" }
          : matchType === "startsWith"
          ? { startsWith: pattern, mode: "insensitive" }
          : { endsWith: pattern, mode: "insensitive" },
      },
      select: { id: true },
    });

    if (matchingTransactions.length > 0) {
      await prisma.transaction.updateMany({
        where: {
          id: { in: matchingTransactions.map((t) => t.id) },
        },
        data: {
          categoryId,
          aiCategorized: false,
          manualOverride: false,
          reviewStatus: "REVIEWED",
        },
      });

      // Update rule hit count
      await prisma.categoryRule.update({
        where: { id: rule.id },
        data: { hitCount: matchingTransactions.length },
      });
    }

    revalidatePath("/transactions");
    revalidatePath("/settings");

    return {
      success: true,
      data: {
        ruleId: rule.id,
        appliedCount: matchingTransactions.length,
      },
    };
  } catch (error) {
    console.error("Failed to create rule from suggestion:", error);
    return { success: false, error: "Failed to create rule" };
  }
}

// ============================================
// ANALYZE RULE EFFECTIVENESS
// ============================================

export async function analyzeRuleEffectiveness(): Promise<
  ActionResponse<{
    totalRules: number;
    activeRules: number;
    topRules: {
      id: string;
      pattern: string;
      categoryName: string;
      hitCount: number;
    }[];
    unusedRules: {
      id: string;
      pattern: string;
      categoryName: string;
      createdAt: Date;
    }[];
  }>
> {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    // Get all rules with category info
    const rules = await prisma.categoryRule.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { hitCount: "desc" },
    });

    const totalRules = rules.length;
    const activeRules = rules.filter((r) => r.isActive).length;

    // Top performing rules
    const topRules = rules
      .filter((r) => r.hitCount > 0)
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        pattern: r.pattern,
        categoryName: r.category.name,
        hitCount: r.hitCount,
      }));

    // Rules that have never been used (created more than 7 days ago)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const unusedRules = rules
      .filter((r) => r.hitCount === 0 && r.createdAt < weekAgo)
      .map((r) => ({
        id: r.id,
        pattern: r.pattern,
        categoryName: r.category.name,
        createdAt: r.createdAt,
      }));

    return {
      success: true,
      data: {
        totalRules,
        activeRules,
        topRules,
        unusedRules,
      },
    };
  } catch (error) {
    console.error("Failed to analyze rule effectiveness:", error);
    return { success: false, error: "Failed to analyze rules" };
  }
}
