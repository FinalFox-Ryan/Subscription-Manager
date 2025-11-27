import { Subscription, BillingCycle } from './types';
import { subMonths, addMonths } from 'date-fns';

const now = new Date();

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: '1',
    name: 'Netflix Premium',
    amount: 17000,
    currency: 'KRW',
    cycle: BillingCycle.MONTHLY,
    startDate: subMonths(now, 5),
    endDate: null, // Ongoing
    color: '#E50914'
  },
  {
    id: '2',
    name: 'Spotify Duo',
    amount: 12000,
    currency: 'KRW',
    cycle: BillingCycle.MONTHLY,
    startDate: subMonths(now, 10),
    endDate: addMonths(now, 2), // Ends soon
    color: '#1DB954'
  },
  {
    id: '3',
    name: 'Adobe Creative Cloud',
    amount: 78000,
    currency: 'KRW',
    cycle: BillingCycle.MONTHLY,
    startDate: subMonths(now, 2),
    endDate: null,
    color: '#31004a'
  },
  {
    id: '4',
    name: 'Amazon Prime',
    amount: 4900,
    currency: 'KRW',
    cycle: BillingCycle.MONTHLY,
    startDate: subMonths(now, 12),
    endDate: null,
    color: '#00A8E1'
  },
  {
    id: '5',
    name: 'JetBrains All Products',
    amount: 299000,
    currency: 'KRW',
    cycle: BillingCycle.YEARLY,
    startDate: subMonths(now, 1),
    endDate: addMonths(now, 11),
    color: '#FC801D'
  },
  {
    id: '6',
    name: 'Gym Membership',
    amount: 50000,
    currency: 'KRW',
    cycle: BillingCycle.MONTHLY,
    startDate: subMonths(now, 3),
    endDate: addMonths(now, 3),
    color: '#F59E0B'
  }
];