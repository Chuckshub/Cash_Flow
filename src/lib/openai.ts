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

export const BUSINESS_CATEGORIES = [
  'Reimbursements',
  'Payroll', 
  'Vendor Payments',
  'Equity or Funding Proceeds',
  'Customer Receipts',
  'Other / Misc'
];

export async function categorizeTransactions(transactions: Transaction[]): Promise<CategorizedTransaction[]> {
  console.log('🧠 [DEBUG] categorizeTransactions called with', transactions.length, 'transactions');
  
  try {
    console.log('🧠 [DEBUG] Building prompt for OpenAI');
    const prompt = `
You are a financial analyst AI. Analyze these business transactions and categorize them using the following EXACT rules.

## Categorization Rules (apply in this priority order; case-insensitive substring checks):

1) If Description contains "rmpr" ⇒ Category = "Reimbursements"
2) If Description contains "people center" OR "payroll" ⇒ Category = "Payroll"
3) If Description contains "ramp" ⇒ Category = "Vendor Payments"
4) If Description contains "oracle" OR "inv" OR "paying bill" ⇒ Category = "Vendor Payments"
5) If Description contains "carta" ⇒ Category = "Equity or Funding Proceeds"
6) If Transaction Type contains "ACH credit" OR "Incoming wire transfer" AND Amount > 0 ⇒ Category = "Customer Receipts"
7) Otherwise ⇒ Category = "Other / Misc"

## Available Categories (use EXACTLY these names):
${BUSINESS_CATEGORIES.map(cat => `- ${cat}`).join('\n')}

Transactions to analyze:
${JSON.stringify(transactions.slice(0, 50), null, 2)}

Return a JSON array where each transaction has:
{
  "date": "original date",
  "description": "original description",
  "amount": original_amount_number,
  "type": "inflow" or "outflow",
  "category": "one of the exact categories above",
  "subcategory": "optional specific detail",
  "confidence": confidence_score_0_to_1
}

IMPORTANT:
- Follow the rules in EXACT order (1-7)
- Use case-insensitive substring matching
- Use ONLY the category names listed above
- Set confidence to 0.9+ for rule-based matches, 0.7+ for clear matches, 0.5+ for uncertain
- Apply rules to the Description field and Transaction Type field

Respond with ONLY the JSON array, no other text.`;

    console.log('🧠 [DEBUG] Calling OpenAI API with prompt length:', prompt.length);
    console.log('🧠 [DEBUG] API Key present:', !!process.env.OPENAI_API_KEY);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a financial categorization expert. Follow the rules exactly as specified. Return only valid JSON arrays with no additional text.'
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
    
    // Fallback: return transactions with basic categorization using business rules
    const fallbackTransactions = transactions.map(transaction => {
      const desc = transaction.description.toLowerCase();
      let category = 'Other / Misc';
      let confidence = 0.5;
      
      // Apply the same rules as fallback
      if (desc.includes('rmpr')) {
        category = 'Reimbursements';
        confidence = 0.9;
      } else if (desc.includes('people center') || desc.includes('payroll')) {
        category = 'Payroll';
        confidence = 0.9;
      } else if (desc.includes('ramp')) {
        category = 'Vendor Payments';
        confidence = 0.9;
      } else if (desc.includes('oracle') || desc.includes('inv') || desc.includes('paying bill')) {
        category = 'Vendor Payments';
        confidence = 0.8;
      } else if (desc.includes('carta')) {
        category = 'Equity or Funding Proceeds';
        confidence = 0.9;
      } else if (transaction.type === 'inflow' && transaction.amount > 0) {
        category = 'Customer Receipts';
        confidence = 0.7;
      }
      
      return {
        ...transaction,
        category,
        confidence
      };
    });
    
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