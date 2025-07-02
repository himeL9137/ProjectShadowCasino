import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Code, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GameCodeViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: {
    id: number;
    name: string;
    htmlContent: string;
    description?: string;
  } | null;
  onSave?: (gameId: number, updatedContent: string) => void;
}

export function GameCodeViewer({ open, onOpenChange, game, onSave }: GameCodeViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const handleStartEdit = () => {
    setEditedContent(game?.htmlContent || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (game && onSave) {
      onSave(game.id, editedContent);
    }
    setIsEditing(false);
    onOpenChange(false);
  };

  const handleCopyCode = () => {
    if (game?.htmlContent) {
      navigator.clipboard.writeText(game.htmlContent);
      toast({
        title: "Code Copied",
        description: "Game HTML code copied to clipboard",
      });
    }
  };

  if (!game) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            {game.name} - Game Code
          </DialogTitle>
          <DialogDescription>
            {game.description || 'View and edit the HTML code for this game'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={handleCopyCode}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Code
            </Button>
            
            {!isEditing ? (
              <Button
                onClick={handleStartEdit}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Code
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveEdit}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Edit HTML Code:</label>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
                placeholder="Enter your HTML game code here..."
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">HTML Code:</label>
              <div className="relative">
                <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-[500px] text-sm">
                  <code>{game.htmlContent}</code>
                </pre>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Casino API Integration
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
              <p><strong>Available Classes:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code>.casino-balance</code> - Auto-displays current balance</li>
                <li><code>.casino-bet-button</code> - Styled bet buttons</li>
                <li><code>.casino-game-container</code> - Main container styling</li>
              </ul>
              <p className="mt-3"><strong>JavaScript API:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code>window.casinoAPI.placeBet(amount, won)</code> - Process bet results</li>
                <li><code>window.casinoAPI.getCurrentBalance()</code> - Get current balance</li>
                <li><code>window.casinoAPI.generateRandomResult()</code> - Random outcome helper</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}