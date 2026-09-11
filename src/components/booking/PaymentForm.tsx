'use client';

import { PAYMENT_METHODS, TICKET_PRICE } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface PaymentFormProps {
  selectedMethod?: string;
  onSelectMethod: (method: string) => void;
}

export function PaymentForm({ selectedMethod, onSelectMethod }: PaymentFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border">
        <div>
          <span className="text-xs text-slate-500 uppercase font-semibold">Total Fare</span>
          <h4 className="text-2xl font-extrabold text-[#1E3A5F]">৳{TICKET_PRICE} BDT</h4>
        </div>
        <Badge className="bg-[#10B981] text-white">Flat Rate</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PAYMENT_METHODS.map((method) => {
          const selected = selectedMethod === method.id;
          return (
            <Card
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className={`cursor-pointer transition-all duration-200 border-2 ${
                selected ? 'border-[#F37021] bg-orange-50/20 shadow-sm' : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{method.icon}</span>
                  <div>
                    <h5 className="font-semibold text-sm text-slate-800">{method.name}</h5>
                    <p className="text-xs text-slate-500">{method.description}</p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    selected ? 'bg-[#F37021] border-[#F37021] text-white' : 'border-slate-300'
                  }`}
                >
                  {selected && <Check size={12} />}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
