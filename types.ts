export enum BillingCycle {
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly'
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  cycle: BillingCycle;
  startDate: Date;
  endDate?: Date | null; // If null, it's ongoing
  color: string;
  icon?: string;
}

export interface TimelineConfig {
  startMonth: Date;
  endMonth: Date;
  totalMonths: number;
}