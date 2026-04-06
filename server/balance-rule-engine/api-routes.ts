import express, { Router, Request, Response } from 'express';
import { GameIntegration } from './game-integration.js';
import { RuleEvaluationLogger } from './rule-evaluation-logger.js';

export function createBalanceRuleEngineRoutes(
  gameIntegration: GameIntegration,
  ruleLogger?: RuleEvaluationLogger,
): Router {
  const router = express.Router();

  router.post('/api/rule-engine/evaluate', async (req: Request, res: Response) => {
    try {
      const { userId, balance, currencyCode, betAmount, gameType } = req.body;

      if (!userId || !balance || !currencyCode || !betAmount || !gameType) {
        return res.status(400).json({
          error: 'Missing required fields: userId, balance, currencyCode, betAmount, gameType',
        });
      }

      const outcome = gameIntegration.evaluateGameRound(
        userId,
        balance,
        currencyCode,
        betAmount,
        gameType,
      );

      res.json({
        success: true,
        outcome,
      });
    } catch (error) {
      console.error('Rule engine evaluation error:', error);
      res.status(500).json({
        error: 'Failed to evaluate game round',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/api/rule-engine/threshold/:currencyCode', async (req: Request, res: Response) => {
    try {
      const { currencyCode } = req.params;

      if (!currencyCode) {
        return res.status(400).json({
          error: 'Currency code is required',
        });
      }

      const thresholdInfo = gameIntegration.getThresholdInfo(currencyCode);

      res.json({
        success: true,
        threshold: thresholdInfo,
      });
    } catch (error) {
      console.error('Threshold info error:', error);
      res.status(500).json({
        error: 'Failed to get threshold info',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/api/rule-engine/can-win', async (req: Request, res: Response) => {
    try {
      const { balance, currencyCode } = req.query;

      if (!balance || !currencyCode) {
        return res.status(400).json({
          error: 'Missing required query parameters: balance, currencyCode',
        });
      }

      const canWin = gameIntegration.canPlayerWin(balance as string, currencyCode as string);

      res.json({
        success: true,
        canWin,
      });
    } catch (error) {
      console.error('Can win check error:', error);
      res.status(500).json({
        error: 'Failed to check if player can win',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/api/rule-engine/evaluation/:currencyCode', async (req: Request, res: Response) => {
    try {
      const { currencyCode } = req.params;
      const { balance } = req.query;

      if (!currencyCode || !balance) {
        return res.status(400).json({
          error: 'Missing required parameters: currencyCode, balance',
        });
      }

      const evaluation = gameIntegration.getBalanceEvaluation(balance as string, currencyCode);

      res.json({
        success: true,
        evaluation,
      });
    } catch (error) {
      console.error('Evaluation error:', error);
      res.status(500).json({
        error: 'Failed to evaluate balance',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/api/rule-engine/supported-currencies', async (req: Request, res: Response) => {
    try {
      const currencies = gameIntegration.getSupportedCurrencies();

      res.json({
        success: true,
        currencies,
      });
    } catch (error) {
      console.error('Supported currencies error:', error);
      res.status(500).json({
        error: 'Failed to get supported currencies',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  if (ruleLogger) {
    router.get('/api/rule-engine/history', async (req: Request, res: Response) => {
      try {
        const { userId } = req.query;
        const limit = parseInt(req.query.limit as string) || 100;

        if (!userId) {
          return res.status(400).json({
            error: 'User ID is required',
          });
        }

        const history = await ruleLogger.getEvaluationHistory(userId as string, limit);

        res.json({
          success: true,
          history,
        });
      } catch (error) {
        console.error('History error:', error);
        res.status(500).json({
          error: 'Failed to get evaluation history',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    router.get('/api/rule-engine/statistics', async (req: Request, res: Response) => {
      try {
        const { userId } = req.query;

        if (!userId) {
          return res.status(400).json({
            error: 'User ID is required',
          });
        }

        const stats = await ruleLogger.getStatistics(userId as string);

        res.json({
          success: true,
          statistics: stats,
        });
      } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({
          error: 'Failed to get statistics',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  return router;
}
