import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { post } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface CreateGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGameCreated: () => void;
}

export function CreateGameDialog({ open, onOpenChange, onGameCreated }: CreateGameDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [gameData, setGameData] = useState({
    name: '',
    description: '',
    htmlContent: '',
    winChance: 50,
    maxMultiplier: 2.0,
    minBet: '1',
    maxBet: '1000'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gameData.name || !gameData.htmlContent) {
      toast({
        title: "Error",
        description: "Game name and HTML content are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await post('/api/admin/games/add', gameData);
      
      // Success - game created
      toast({
        title: "Success",
        description: "Game created successfully!",
      });
      
      setGameData({
        name: '',
        description: '',
        htmlContent: '',
        winChance: 50,
        maxMultiplier: 2.0,
        minBet: '1',
        maxBet: '1000'
      });
      
      if (onGameCreated) {
        onGameCreated();
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating game:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create game",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sampleHtmlContent = `<div class="casino-game-container">
  <h2>🎰 Lucky Dice Casino</h2>
  <p>Your Balance: <span class="casino-balance">Loading...</span></p>
  
  <div style="text-align: center; margin: 30px 0;">
    <div id="diceContainer" style="margin: 20px 0;">
      <div id="dice1" class="dice">🎲</div>
      <div id="dice2" class="dice">🎲</div>
    </div>
    
    <div style="margin: 20px 0;">
      <h4>Choose your bet:</h4>
      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button class="casino-bet-button" onclick="placeBet(25, 'low')">
          Low (2-6) - 25 coins
        </button>
        <button class="casino-bet-button" onclick="placeBet(50, 'seven')">
          Lucky 7 - 50 coins
        </button>
        <button class="casino-bet-button" onclick="placeBet(25, 'high')">
          High (8-12) - 25 coins
        </button>
      </div>
    </div>
    
    <div id="gameStatus" style="margin: 20px 0; font-size: 18px; font-weight: bold;"></div>
    <div id="lastResult" style="margin: 10px 0; color: #666;"></div>
  </div>
</div>

<style>
.dice {
  display: inline-block;
  font-size: 60px;
  margin: 0 10px;
  padding: 20px;
  border: 3px solid #4f46e5;
  border-radius: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  min-width: 80px;
  animation: bounce 0.5s ease-in-out;
}

@keyframes bounce {
  0%, 20%, 60%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  80% { transform: translateY(-5px); }
}

@keyframes roll {
  0% { transform: rotateX(0deg) rotateY(0deg); }
  25% { transform: rotateX(90deg) rotateY(90deg); }
  50% { transform: rotateX(180deg) rotateY(180deg); }
  75% { transform: rotateX(270deg) rotateY(270deg); }
  100% { transform: rotateX(360deg) rotateY(360deg); }
}

.rolling {
  animation: roll 1s ease-in-out;
}

h2 { color: #4f46e5; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
h4 { color: #6366f1; }
</style>

<script>
let isRolling = false;

function placeBet(amount, betType) {
  if (isRolling) return;
  
  isRolling = true;
  const dice1 = document.getElementById('dice1');
  const dice2 = document.getElementById('dice2');
  const status = document.getElementById('gameStatus');
  const lastResult = document.getElementById('lastResult');
  
  // Show rolling animation
  dice1.classList.add('rolling');
  dice2.classList.add('rolling');
  status.innerHTML = '🎲 Rolling dice...';
  status.style.color = '#4f46e5';
  
  setTimeout(() => {
    // Generate random dice values
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;
    
    // Update dice display
    dice1.textContent = getDiceEmoji(die1);
    dice2.textContent = getDiceEmoji(die2);
    dice1.classList.remove('rolling');
    dice2.classList.remove('rolling');
    
    // Determine if bet won
    let won = false;
    let multiplier = 1.0;
    
    switch(betType) {
      case 'low':
        won = total >= 2 && total <= 6;
        multiplier = 1.8;
        break;
      case 'seven':
        won = total === 7;
        multiplier = 4.0;
        break;
      case 'high':
        won = total >= 8 && total <= 12;
        multiplier = 1.8;
        break;
    }
    
    // Show result
    if (won) {
      const winAmount = Math.floor(amount * multiplier);
      status.innerHTML = \`🎉 YOU WON! +\${winAmount} coins\`;
      status.style.color = '#10b981';
    } else {
      status.innerHTML = \`😞 You lost -\${amount} coins\`;
      status.style.color = '#ef4444';
    }
    
    lastResult.innerHTML = \`Rolled: \${die1} + \${die2} = \${total} | Bet: \${betType.toUpperCase()}\`;
    
    // Process bet through Casino API
    if (window.casinoAPI) {
      window.casinoAPI.placeBet(amount, won);
    }
    
    isRolling = false;
  }, 1200);
}

function getDiceEmoji(value) {
  const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  return diceEmojis[value - 1];
}

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('gameStatus').innerHTML = 'Place your bet to start!';
  document.getElementById('gameStatus').style.color = '#6366f1';
});
</script>`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" preventOutsideClose={true}>
        <DialogHeader>
          <DialogTitle>Create New HTML Game</DialogTitle>
          <DialogDescription>
            Create a custom HTML game that integrates with the casino balance system
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Game Name</Label>
              <Input
                id="name"
                value={gameData.name}
                onChange={(e) => setGameData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Lucky Numbers"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={gameData.description}
                onChange={(e) => setGameData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief game description"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="winChance">Win Chance (%)</Label>
              <Input
                id="winChance"
                type="number"
                min="1"
                max="99"
                value={gameData.winChance}
                onChange={(e) => setGameData(prev => ({ ...prev, winChance: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxMultiplier">Max Multiplier</Label>
              <Input
                id="maxMultiplier"
                type="number"
                min="1"
                max="10"
                step="0.1"
                value={gameData.maxMultiplier}
                onChange={(e) => setGameData(prev => ({ ...prev, maxMultiplier: Number(e.target.value) }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minBet">Min Bet</Label>
              <Input
                id="minBet"
                value={gameData.minBet}
                onChange={(e) => setGameData(prev => ({ ...prev, minBet: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxBet">Max Bet</Label>
              <Input
                id="maxBet"
                value={gameData.maxBet}
                onChange={(e) => setGameData(prev => ({ ...prev, maxBet: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="htmlContent">HTML Game Content</Label>
            <Textarea
              id="htmlContent"
              value={gameData.htmlContent}
              onChange={(e) => setGameData(prev => ({ ...prev, htmlContent: e.target.value }))}
              placeholder="Enter your HTML game code here..."
              className="min-h-[300px] font-mono text-sm"
              required
            />
            <div className="text-sm text-muted-foreground">
              <p><strong>Available CSS Classes:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li><code>.casino-balance</code> - Displays current balance</li>
                <li><code>.casino-bet-button</code> - Styled bet button with data-bet-amount attribute</li>
                <li><code>.casino-game-container</code> - Main game container styling</li>
              </ul>
              <p className="mt-2"><strong>Casino API:</strong> Use <code>window.casinoAPI.placeBet(amount, won)</code> to process bets</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setGameData(prev => ({ ...prev, htmlContent: sampleHtmlContent }))}
            >
              Use Sample Game
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Game'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}