"use client";

import { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@heroui/react';
import { Plus, Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { WeeklyForecast, ForecastInput as ForecastInputType } from '@/types/forecast';

interface ForecastInputProps {
  weeks: WeeklyForecast[];
  onAddForecast: (forecast: ForecastInputType) => void;
}

export default function ForecastInput({ weeks, onAddForecast }: ForecastInputProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [inflows, setInflows] = useState<string>('');
  const [outflows, setOutflows] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = () => {
    setError('');
    
    const inflowAmount = parseFloat(inflows) || 0;
    const outflowAmount = parseFloat(outflows) || 0;
    
    if (inflowAmount < 0 || outflowAmount < 0) {
      setError('Amounts cannot be negative');
      return;
    }
    
    if (inflowAmount === 0 && outflowAmount === 0) {
      setError('Please enter at least one amount');
      return;
    }
    
    const forecast: ForecastInputType = {
      weekNumber: selectedWeek,
      inflows: inflowAmount,
      outflows: outflowAmount,
      notes: notes.trim() || undefined
    };
    
    onAddForecast(forecast);
    
    // Reset form
    setInflows('');
    setOutflows('');
    setNotes('');
    setSelectedWeek(1);
    onOpenChange();
  };

  const selectedWeekData = weeks.find(w => w.weekNumber === selectedWeek);

  return (
    <>
      <Button
        color="primary"
        startContent={<Plus className="h-4 w-4" />}
        onPress={onOpen}
        className="font-medium"
      >
        Add Forecast
      </Button>

      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        size="lg"
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-xl font-semibold">Add Weekly Forecast</h3>
                <p className="text-sm text-default-500 font-normal">
                  Enter predicted cash flows for a specific week
                </p>
              </ModalHeader>
              
              <ModalBody className="space-y-6">
                {/* Week Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-default-700">
                    Select Week
                  </label>
                  <Select
                    placeholder="Choose a week"
                    selectedKeys={[selectedWeek.toString()]}
                    onSelectionChange={(keys) => {
                      const weekNum = parseInt(Array.from(keys)[0] as string);
                      setSelectedWeek(weekNum);
                    }}
                    startContent={<Calendar className="h-4 w-4" />}
                  >
                    {weeks.map((week) => (
                      <SelectItem key={week.weekNumber.toString()}>
                        Week {week.weekNumber}: {week.weekLabel}
                      </SelectItem>
                    ))}
                  </Select>
                  
                  {selectedWeekData && (
                    <div className="p-3 bg-default-50 rounded-lg">
                      <p className="text-sm text-default-600">
                        <strong>{selectedWeekData.weekLabel}</strong>
                      </p>
                      <p className="text-xs text-default-500">
                        {new Date(selectedWeekData.weekStart).toLocaleDateString()} - {new Date(selectedWeekData.weekEnd).toLocaleDateString()}
                      </p>
                      {selectedWeekData.hasActualData && (
                        <div className="mt-2 text-xs">
                          <span className="text-success-600">Actual Inflows: ${selectedWeekData.actualInflows.toFixed(2)}</span>
                          <span className="mx-2">•</span>
                          <span className="text-danger-600">Actual Outflows: ${selectedWeekData.actualOutflows.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Forecast Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Predicted Inflows"
                    placeholder="0.00"
                    value={inflows}
                    onChange={(e) => setInflows(e.target.value)}
                    startContent={<TrendingUp className="h-4 w-4 text-success-500" />}
                    endContent={<DollarSign className="h-4 w-4 text-default-400" />}
                    type="number"
                    min="0"
                    step="0.01"
                    variant="bordered"
                  />
                  
                  <Input
                    label="Predicted Outflows"
                    placeholder="0.00"
                    value={outflows}
                    onChange={(e) => setOutflows(e.target.value)}
                    startContent={<TrendingDown className="h-4 w-4 text-danger-500" />}
                    endContent={<DollarSign className="h-4 w-4 text-default-400" />}
                    type="number"
                    min="0"
                    step="0.01"
                    variant="bordered"
                  />
                </div>

                {/* Net Forecast Preview */}
                {(parseFloat(inflows) > 0 || parseFloat(outflows) > 0) && (
                  <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-primary-700">Net Forecast:</span>
                      <span className={`text-lg font-bold ${
                        (parseFloat(inflows) || 0) - (parseFloat(outflows) || 0) >= 0 
                          ? 'text-success-600' 
                          : 'text-danger-600'
                      }`}>
                        ${((parseFloat(inflows) || 0) - (parseFloat(outflows) || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <Textarea
                  label="Notes (Optional)"
                  placeholder="Add any notes about this forecast..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  variant="bordered"
                  minRows={2}
                  maxRows={4}
                />

                {error && (
                  <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                    <p className="text-danger-600 text-sm">{error}</p>
                  </div>
                )}
              </ModalBody>
              
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleSubmit}
                  isDisabled={!inflows && !outflows}
                >
                  Add Forecast
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}