import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getServerSession } from "@/lib/auth-server";
import { categorizeTransactionsBatch, type CategoryInfo } from "@/lib/ai";
import { importTransactionRowSchema } from "@/schema/transaction.schema";

const requestSchema = z.object({
  transactions: z.array(
    z.object({
      rowIndex: z.number(),
      transaction: importTransactionRowSchema,
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { transactions } = requestSchema.parse(body);

    if (transactions.length === 0) {
      return NextResponse.json({ results: [], tokensUsed: 0 });
    }

    // Get user's AI settings
    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Check if AI categorization is enabled
    if (settings && !settings.aiCategorizationEnabled) {
      return NextResponse.json({
        results: transactions.map(({ rowIndex }) => ({
          rowIndex,
          categoryId: null,
          categoryName: null,
          confidence: 0,
          reasoning: "AI categorization is disabled",
        })),
        tokensUsed: 0,
      });
    }

    // Get all categories for the prompt
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    });

    const categoryInfos: CategoryInfo[] = categories.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type as CategoryInfo["type"],
    }));

    // Run AI categorization
    const result = await categorizeTransactionsBatch(
      transactions.map(t => ({
        rowIndex: t.rowIndex,
        transaction: {
          ...t.transaction,
          postingDate: new Date(t.transaction.postingDate),
        },
      })),
      categoryInfos
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI categorization API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
