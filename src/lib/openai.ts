import OpenAI from 'openai';

// Import Transaction type from components
interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'inflow' | 'outflow';
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key',
});

export interface CategorizedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'inflow' | 'outflow';
  category: string;
  subcategory?: string;
  confidence: number;
}

export interface CategoryBucket {
  name: string;
  total: number;
  count: number;
  percentage: number;
  transactions: CategorizedTransaction[];
}

export const EXPENSE_CATEGORIES = [
  'Payroll & Benefits',
  'Office & Operations',
  'Technology & Software',
  'Marketing & Advertising',
  'Professional Services',
  'Travel & Entertainment',
  'Utilities & Rent',
  'Insurance',
  'Taxes & Fees',
  'Other Business Expenses'
];

export const INCOME_CATEGORIES = [
  'Revenue',
  'Investment Income',
  'Loans & Financing',
  'Refunds & Returns',
  'Other Income'
];

export async function categorizeTransactions(transactions: Transaction[]): Promise<CategorizedTransaction[]> {
  console.log('🧠 [DEBUG] categorizeTransactions called with', transactions.length, 'transactions');
  
  try {
    console.log('🧠 [DEBUG] Building prompt for OpenAI');
    const prompt = `
You are a financial analyst AI. Analyze these business transactions and categorize them into appropriate buckets.

For EXPENSES, use these categories:
${EXPENSE_CATEGORIES.map(cat => `- ${cat}`).join('\n')}

For INCOME, use these categories:
${INCOME_CATEGORIES.map(cat => `- ${cat}`).join('\n')}

Transactions to analyze:
${JSON.stringify(transactions.slice(0, 50), null, 2)}

Return a JSON array where each transaction has:
{
  "date": "original date",
  "description": "original description",
  "amount": original_amount_number,
  "type": "inflow" or "outflow",
  "category": "one of the categories above",
  "subcategory": "optional specific subcategory",
  "confidence": confidence_score_0_to_1
}

Rules:
- Payroll includes salaries, contractor payments, benefits
- Technology includes software subscriptions, cloud services, tools
- Professional Services includes legal, accounting, consulting
- Office includes rent, utilities, supplies, equipment
- Marketing includes advertising, events, promotional materials
- Be specific with subcategories when possible
- Confidence should reflect how certain you are about the categorization

Respond with ONLY the JSON array, no other text.`;

    console.log('🧠 [DEBUG] Calling OpenAI API with prompt length:', prompt.length);
    console.log('🧠 [DEBUG] API Key present:', !!process.env.OPENAI_API_KEY);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a financial categorization expert. Return only valid JSON arrays.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    });

    console.log('🧠 [DEBUG] OpenAI response received:', {
      choices: response.choices?.length,
      usage: response.usage
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.log('🧠 [DEBUG] No content in OpenAI response');
      throw new Error('No response from OpenAI');
    }

    console.log('🧠 [DEBUG] OpenAI content length:', content.length);
    console.log('🧠 [DEBUG] OpenAI content preview:', content.substring(0, 200));

    // Parse the JSON response
    const categorizedTransactions = JSON.parse(content);
    console.log('🧠 [DEBUG] Successfully parsed', categorizedTransactions.length, 'categorized transactions');
    return categorizedTransactions;

  } catch (error) {
    console.error('🧠 [DEBUG] Error categorizing transactions:', error);
    console.log('🧠 [DEBUG] Falling back to basic categorization');
    
    // Fallback: return transactions with basic categorization
    const fallbackTransactions = transactions.map(transaction => ({
      ...transaction,
      category: transaction.type === 'inflow' ? 'Revenue' : 'Other Business Expenses',
      confidence: 0.5
    }));
    
    console.log('🧠 [DEBUG] Returning', fallbackTransactions.length, 'fallback transactions');
    return fallbackTransactions;
  }
}

export function groupTransactionsByCategory(transactions: CategorizedTransaction[]): CategoryBucket[] {
  const categoryMap = new Map<string, CategorizedTransaction[]>();
  
  // Group transactions by category
  transactions.forEach(transaction => {
    const category = transaction.category;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(transaction);
  });

  // Calculate totals and create buckets
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  
  const buckets: CategoryBucket[] = Array.from(categoryMap.entries()).map(([category, categoryTransactions]) => {
    const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    return {
      name: category,
      total,
      count: categoryTransactions.length,
      percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0,
      transactions: categoryTransactions
    };
  });

  // Sort by total amount (descending)
  return buckets.sort((a, b) => b.total - a.total);
}

export default openai;