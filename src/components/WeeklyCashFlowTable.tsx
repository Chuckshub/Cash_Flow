"use client";

import { useMemo, useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@heroui/react';
import { Plus, Edit, TrendingUp, TrendingDown, Calendar, DollarSign, Target, AlertCircle } from 'lucide-react';
import { Transaction } from './CSVUpload';

interface WeekData {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  actualInflows: number;
  actualOutflows: number;
  predictedInflows: number;
  predictedOutflows: number;
  totalInflows: number;
  totalOutflows: number;
  netFlow: number;
  runningBalance: number;
  hasActualData: boolean;
  transactionCount: number;
}

interface PredictionEntry {
  weekNumber: number;
  inflows: number;
  outflows: number;
  description?: string;
}

interface WeeklyCashFlowTableProps {
  transactions: Transaction[];
  initialBalance?: number;
}

export default function WeeklyCashFlowTable({ transactions, initialBalance = 0 }: WeeklyCashFlowTableProps) {
  const [predictions, setPredictions] = useState<PredictionEntry[]>([]);
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [tempInflows, setTempInflows] = useState('');
  const [tempOutflows, setTempOutflows] = useState('');
  const [tempDescription, setTempDescription] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Get the start of the current week (Sunday)
  const getCurrentWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  // Generate 13 weeks of data starting from current week
  const weeklyData = useMemo(() => {
    const currentWeekStart = getCurrentWeekStart();
    const weeks: WeekData[] = [];
    
    // Group actual transactions by week
    const transactionsByWeek = new Map<string, Transaction[]>();
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const weekStart = new Date(transactionDate);
      weekStart.setDate(transactionDate.getDate() - transactionDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!transactionsByWeek.has(weekKey)) {
        transactionsByWeek.set(weekKey, []);
      }
      transactionsByWeek.get(weekKey)!.push(transaction);
    });

    let runningBalance = initialBalance;

    for (let i = 0; i < 13; i++) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() + (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekKey = weekStart.toISOString().split('T')[0];
      const weekTransactions = transactionsByWeek.get(weekKey) || [];
      
      // Calculate actual flows from transactions
      const actualInflows = weekTransactions
        .filter(t => t.type === 'inflow')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const actualOutflows = weekTransactions
        .filter(t => t.type === 'outflow')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Get predictions for this week
      const prediction = predictions.find(p => p.weekNumber === i + 1);
      const predictedInflows = prediction?.inflows || 0;
      const predictedOutflows = prediction?.outflows || 0;
      
      // Calculate totals
      const totalInflows = actualInflows + predictedInflows;
      const totalOutflows = actualOutflows + predictedOutflows;
      const netFlow = totalInflows - totalOutflows;
      
      runningBalance += netFlow;
      
      const hasActualData = weekTransactions.length > 0;
      
      weeks.push({
        weekNumber: i + 1,
        weekStart,
        weekEnd,
        weekLabel: `Week ${i + 1}`,
        actualInflows,
        actualOutflows,
        predictedInflows,
        predictedOutflows,
        totalInflows,
        totalOutflows,
        netFlow,
        runningBalance,
        hasActualData,
        transactionCount: weekTransactions.length
      });
    }
    
    return weeks;
  }, [transactions, predictions, initialBalance]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDateRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const handleEditPrediction = (weekNumber: number) => {
    const existing = predictions.find(p => p.weekNumber === weekNumber);
    setEditingWeek(weekNumber);
    setTempInflows(existing?.inflows.toString() || '');
    setTempOutflows(existing?.outflows.toString() || '');
    setTempDescription(existing?.description || '');
    onOpen();
  };

  const handleSavePrediction = () => {
    if (editingWeek === null) return;
    
    const inflows = parseFloat(tempInflows) || 0;
    const outflows = parseFloat(tempOutflows) || 0;
    
    setPredictions(prev => {
      const filtered = prev.filter(p => p.weekNumber !== editingWeek);
      if (inflows > 0 || outflows > 0) {
        filtered.push({
          weekNumber: editingWeek,
          inflows,
          outflows,
          description: tempDescription
        });
      }
      return filtered.sort((a, b) => a.weekNumber - b.weekNumber);
    });
    
    onClose();
    setEditingWeek(null);
    setTempInflows('');
    setTempOutflows('');
    setTempDescription('');
  };

  const totalActualInflows = weeklyData.reduce((sum, week) => sum + week.actualInflows, 0);
  const totalActualOutflows = weeklyData.reduce((sum, week) => sum + week.actualOutflows, 0);
  const totalPredictedInflows = weeklyData.reduce((sum, week) => sum + week.predictedInflows, 0);
  const totalPredictedOutflows = weeklyData.reduce((sum, week) => sum + week.predictedOutflows, 0);
  const totalNetFlow = weeklyData.reduce((sum, week) => sum + week.netFlow, 0);
  const finalBalance = weeklyData[weeklyData.length - 1]?.runningBalance || initialBalance;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Total Inflows</p>
                <p className="text-xl font-bold text-green-800">
                  {formatCurrency(totalActualInflows + totalPredictedInflows)}
                </p>
                <div className="text-xs text-green-600 mt-1">
                  Actual: {formatCurrency(totalActualInflows)} | Predicted: {formatCurrency(totalPredictedInflows)}
                </div>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-white border border-red-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">Total Outflows</p>
                <p className="text-xl font-bold text-red-800">
                  {formatCurrency(totalActualOutflows + totalPredictedOutflows)}
                </p>
                <div className="text-xs text-red-600 mt-1">
                  Actual: {formatCurrency(totalActualOutflows)} | Predicted: {formatCurrency(totalPredictedOutflows)}
                </div>
              </div>
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </CardBody>
        </Card>
        
        <Card className={`bg-white border shadow-sm hover:shadow-md transition-shadow ${totalNetFlow >= 0 ? 'border-green-200' : 'border-red-200'}`}>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Net Cash Flow</p>
                <p className={`text-xl font-bold ${totalNetFlow >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {formatCurrency(totalNetFlow)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-gray-600" />
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-white border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Final Balance</p>
                <p className={`text-xl font-bold ${finalBalance >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                  {formatCurrency(finalBalance)}
                </p>
              </div>
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Action Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">13-Week Cash Flow Forecast</h3>
                <p className="text-gray-600">Plan ahead with predictive analytics and scenario modeling</p>
              </div>
            </div>
            <Button
              color="primary"
              variant="solid"
              size="lg"
              startContent={<Plus className="h-5 w-5" />}
              onClick={() => handleEditPrediction(1)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Add Predictions
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* 13-Week Cash Flow Table */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100 p-6">
          <div className="flex flex-row items-center justify-between w-full">
            <div>
              <h3 className="text-xl font-bold text-gray-900">13-Week Rolling Forecast</h3>
              <p className="text-gray-600 mt-1">Actual data from uploads + predicted cash flows</p>
            </div>
            <Chip 
              color="secondary" 
              variant="flat"
              className="bg-purple-100 text-purple-800 font-medium"
            >
              Interactive Planning
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table 
            aria-label="13-week cash flow table"
            classNames={{
              wrapper: "bg-white rounded-none",
              th: "bg-gray-50 text-gray-700 font-semibold border-b border-gray-200",
              td: "text-gray-900 border-b border-gray-100"
            }}
          >
            <TableHeader>
              <TableColumn>WEEK</TableColumn>
              <TableColumn>ACTUAL INFLOWS</TableColumn>
              <TableColumn>PREDICTED INFLOWS</TableColumn>
              <TableColumn>ACTUAL OUTFLOWS</TableColumn>
              <TableColumn>PREDICTED OUTFLOWS</TableColumn>
              <TableColumn>NET FLOW</TableColumn>
              <TableColumn>RUNNING BALANCE</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {weeklyData.map((week) => (
                <TableRow key={week.weekNumber} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <div>
                      <p className="font-semibold text-gray-900">{week.weekLabel}</p>
                      <p className="text-sm text-gray-600">
                        {formatDateRange(week.weekStart, week.weekEnd)}
                      </p>
                      {week.hasActualData && (
                        <Chip size="sm" color="success" variant="flat" className="mt-1 bg-green-100 text-green-800">
                          {week.transactionCount} transactions
                        </Chip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${
                      week.actualInflows > 0 ? 'text-green-700' : 'text-gray-400'
                    }`}>
                      {formatCurrency(week.actualInflows)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${
                      week.predictedInflows > 0 ? 'text-blue-700' : 'text-gray-400'
                    }`}>
                      {formatCurrency(week.predictedInflows)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${
                      week.actualOutflows > 0 ? 'text-red-700' : 'text-gray-400'
                    }`}>
                      {formatCurrency(week.actualOutflows)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${
                      week.predictedOutflows > 0 ? 'text-orange-700' : 'text-gray-400'
                    }`}>
                      {formatCurrency(week.predictedOutflows)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={week.netFlow >= 0 ? 'success' : 'danger'}
                      variant="flat"
                      size="sm"
                      className={week.netFlow >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    >
                      {formatCurrency(week.netFlow)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        week.runningBalance >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatCurrency(week.runningBalance)}
                      </span>
                      {week.runningBalance < 0 && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      startContent={<Edit className="h-3 w-3" />}
                      onClick={() => handleEditPrediction(week.weekNumber)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium"
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Edit Prediction Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md" className="bg-white">
        <ModalContent>
          <ModalHeader className="border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Edit Predictions for Week {editingWeek}</h3>
          </ModalHeader>
          <ModalBody className="p-6">
            <div className="space-y-4">
              <Input
                label="Predicted Inflows"
                placeholder="0.00"
                value={tempInflows}
                onChange={(e) => setTempInflows(e.target.value)}
                startContent={<DollarSign className="h-4 w-4 text-gray-400" />}
                type="number"
                step="0.01"
                classNames={{
                  input: "text-gray-900",
                  label: "text-gray-700 font-medium"
                }}
              />
              <Input
                label="Predicted Outflows"
                placeholder="0.00"
                value={tempOutflows}
                onChange={(e) => setTempOutflows(e.target.value)}
                startContent={<DollarSign className="h-4 w-4 text-gray-400" />}
                type="number"
                step="0.01"
                classNames={{
                  input: "text-gray-900",
                  label: "text-gray-700 font-medium"
                }}
              />
              <Input
                label="Description (Optional)"
                placeholder="e.g., Expected payroll, vendor payment"
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                classNames={{
                  input: "text-gray-900",
                  label: "text-gray-700 font-medium"
                }}
              />
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-200">
            <Button 
              variant="light" 
              onPress={onClose}
              className="text-gray-600 hover:text-gray-800"
            >
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handleSavePrediction}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Save Prediction
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}