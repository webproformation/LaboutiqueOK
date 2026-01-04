"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Sparkles } from 'lucide-react';
import { useWalletBalance } from '@/hooks/use-wallet-balance';
import { useAuth } from '@/context/AuthContext';

interface WalletSelectorProps {
  cartTotal: number;
  onWalletAmountChange: (amount: number) => void;
  currentWalletAmount?: number;
}

export default function WalletSelector({ cartTotal, onWalletAmountChange, currentWalletAmount = 0 }: WalletSelectorProps) {
  const { user } = useAuth();
  const { balance, loading } = useWalletBalance();
  const [useWallet, setUseWallet] = useState(false);
  const [walletAmount, setWalletAmount] = useState(currentWalletAmount);

  useEffect(() => {
    if (currentWalletAmount > 0) {
      setUseWallet(true);
      setWalletAmount(currentWalletAmount);
    }
  }, [currentWalletAmount]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Card className="border-[#b8933d]">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-[#b8933d] animate-pulse" />
            <span className="text-sm text-gray-600">Chargement de votre cagnotte...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (balance === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                Cagnotte : <span className="font-semibold">0,00 €</span>
              </span>
            </div>
            <span className="text-xs text-gray-500">Pas encore de solde disponible</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxUsableAmount = Math.min(balance, cartTotal);

  const handleToggleWallet = () => {
    if (!useWallet) {
      setUseWallet(true);
      setWalletAmount(0);
    } else {
      setUseWallet(false);
      setWalletAmount(0);
      onWalletAmountChange(0);
    }
  };

  const handleUseFull = () => {
    const amount = maxUsableAmount;
    setWalletAmount(amount);
    onWalletAmountChange(amount);
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    const clampedValue = Math.min(Math.max(0, numValue), maxUsableAmount);
    setWalletAmount(clampedValue);
    onWalletAmountChange(clampedValue);
  };

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
              <Label htmlFor="wallet-amount" className="text-sm">
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
                  placeholder="0,00"
                  className="flex-1"
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
              <div className="bg-white/60 p-2 rounded-md">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold text-[#b8933d]">{walletAmount.toFixed(2)} €</span> sera déduit de votre cagnotte
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Nouveau solde : <span className="font-semibold">{(balance - walletAmount).toFixed(2)} €</span>
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
