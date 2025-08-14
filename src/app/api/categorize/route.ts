import { NextRequest, NextResponse } from 'next/server';
import { categorizeTransactions } from '@/lib/openai';

export async function POST(request: NextRequest) {
  console.log('🚀 [DEBUG] API route called');
  
  try {
    const body = await request.json();
    console.log('🚀 [DEBUG] Request body received:', { transactionCount: body.transactions?.length });
    
    const { transactions } = body;
    
    if (!transactions || !Array.isArray(transactions)) {
      console.log('🚀 [DEBUG] Invalid transactions data');
      return NextResponse.json(
        { error: 'Invalid transactions data' },
        { status: 400 }
      );
    }

    if (transactions.length === 0) {
      console.log('🚀 [DEBUG] Empty transactions array');
      return NextResponse.json(
        { categorizedTransactions: [] },
        { status: 200 }
      );
    }

    console.log('🚀 [DEBUG] About to call categorizeTransactions with', transactions.length, 'transactions');
    
    // Process transactions through OpenAI
    const categorizedTransactions = await categorizeTransactions(transactions);
    
    console.log('🚀 [DEBUG] Categorization complete, returning', categorizedTransactions.length, 'categorized transactions');
    
    return NextResponse.json({
      categorizedTransactions,
      message: `Successfully categorized ${categorizedTransactions.length} transactions`
    });
    
  } catch (error) {
    console.error('🚀 [DEBUG] Error in categorize API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to categorize transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}