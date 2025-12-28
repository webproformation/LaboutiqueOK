'use client';

import { useDailyConnectionBonus } from '@/hooks/use-daily-connection-bonus';

export default function DailyConnectionReward() {
  useDailyConnectionBonus();
  return null;
}