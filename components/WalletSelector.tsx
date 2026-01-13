"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Sparkles, Loader2 } from 'lucide-react';
import { useWalletBalance } from '@/hooks/use-wallet-balance';
import { useAuth } from '@/context/AuthContext';

interface WalletSelectorProps {
  cartTotal: number;
  onWalletAmountChange: (amount: number) => void;
  currentWalletAmount: number;
}

export function WalletSelector({ cartTotal, onWalletAmountChange, currentWalletAmount }: WalletSelectorProps) {
  const { user } = useAuth();
  const { balance, loading } = useWalletBalance();
  const [useWallet, setUseWallet] = useState(false);
  const [walletAmount, setWalletAmount] = useState(0);

  const maxUsableAmount = Math.min(balance, cartTotal);

  useEffect(() => {
    if (currentWalletAmount > 0) {
      setUseWallet(true);
      setWalletAmount(currentWalletAmount);
    }
  }, [currentWalletAmount]);

  useEffect(() => {
    if (!useWallet) {
      setWalletAmount(0);
      onWalletAmountChange(0);
    }
  }, [useWallet, onWalletAmountChange]);

  const handleToggleWallet = () => {
    if (!useWallet && balance > 0) {
      setUseWallet(true);
      const defaultAmount = Math.min(balance, cartTotal);
      setWalletAmount(defaultAmount);
      onWalletAmountChange(defaultAmount);
    } else {
      setUseWallet(false);
      setWalletAmount(0);
      onWalletAmountChange(0);
    }
  };

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    const validAmount = Math.min(Math.max(0, amount), maxUsableAmount);
    setWalletAmount(validAmount);
    onWalletAmountChange(validAmount);
  };

  const handleUseFull = () => {
    const fullAmount = maxUsableAmount;
    setWalletAmount(fullAmount);
    onWalletAmountChange(fullAmount);
  };

  if (!user || loading) {
    return null;
  }

  if (balance <= 0) {
    return null;
  }

  return (
    <Card className="border-[#b8933d] bg-gradient-to-br from-[#b8933d]/5 to-transparent">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-[#b8933d]" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Ma Cagnotte</p>
              <p className="text-xs text-gray-600">
                Solde disponible : <span className="font-bold text-[#b8933d]">{balance.toFixed(2)} €</span>
              </p>
            </div>
          </div>
          <Button
            variant={useWallet ? "default" : "outline"}
            size="sm"
            onClick={handleToggleWallet}
            className={useWallet ? "bg-[#b8933d] hover:bg-[#a07c2f]" : ""}
          >
            {useWallet ? "Activée" : "Utiliser"}
          </Button>
        </div>

        {useWallet && (
          <div className="space-y-3 pt-2 border-t border-[#b8933d]/20">
            <div>
              <Label htmlFor="wallet-amount" className="text-sm text-gray-700">
                Montant à utiliser (max. {maxUsableAmount.toFixed(2)} €)
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="wallet-amount"
                  type="number"
                  min="0"
                  max={maxUsableAmount}
                  step="0.01"
                  value={walletAmount || ''}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="flex-1"
                  placeholder="0.00"
                />
                <Button
                  onClick={handleUseFull}
                  size="sm"
                  className="bg-gradient-to-r from-[#b8933d] to-[#d4a853] hover:from-[#a07c2f] hover:to-[#b8933d] text-white whitespace-nowrap"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Je me fais plaisir !
                </Button>
              </div>
            </div>

            {walletAmount > 0 && (
              <div className="bg-white/60 p-3 rounded-md border border-[#b8933d]/20">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-gray-700">Montant déduit</p>
                  <p className="text-sm font-semibold text-[#b8933d]">-{walletAmount.toFixed(2)} €</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-600">Nouveau solde</p>
                  <p className="text-xs font-semibold text-gray-900">{(balance - walletAmount).toFixed(2)} €</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
