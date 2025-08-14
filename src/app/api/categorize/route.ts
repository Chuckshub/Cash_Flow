import { NextRequest, NextResponse } from 'next/server';
import { categorizeTransactions } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { transactions } = await request.json();
    
    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Invalid transactions data' },
        { status: 400 }
      );
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        { categorizedTransactions: [] },
        { status: 200 }
      );
    }

    // Process transactions through OpenAI
    const categorizedTransactions = await categorizeTransactions(transactions);
    
    return NextResponse.json({
      categorizedTransactions,
      message: `Successfully categorized ${categorizedTransactions.length} transactions`
    });
    
  } catch (error) {
    console.error('Error in categorize API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to categorize transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}