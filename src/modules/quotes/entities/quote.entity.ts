import { Currency } from '../interfaces/currency.enum';

export class QuoteEntity {
  id: number;
  from: Currency;
  to: Currency;
  amount: number;
  rate: number;
  convertedAmount: number;
  timestamp: Date;
  expiresAt: Date;
  userId: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<QuoteEntity>) {
    Object.assign(this, partial);
  }
}
