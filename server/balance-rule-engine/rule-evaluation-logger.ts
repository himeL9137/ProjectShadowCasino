import { BalanceEvaluationResult, GameRuleResult } from './types.js';

export interface RuleEvaluationLog {
  userId: string;
  gameType: string;
  currencyCode: string;
  balance: string;
  betAmount: string;
  usdThreshold: string;
  localThreshold: string;
  balanceInUsd: string;
  exchangeRate: string;
  ruleMode: string;
  winProbability: number;
  result: boolean;
}

export class RuleEvaluationLogger {
  private supabaseClient: any;
  private enabled: boolean = true;

  constructor(supabaseClient?: any) {
    this.supabaseClient = supabaseClient;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async logEvaluation(
    userId: string,
    gameType: string,
    gameRuleResult: GameRuleResult,
  ): Promise<void> {
    if (!this.enabled || !this.supabaseClient) {
      return;
    }

    try {
      const evaluation = gameRuleResult.context.evaluation;

      const log: RuleEvaluationLog = {
        userId,
        gameType,
        currencyCode: evaluation.currencyCode,
        balance: evaluation.balance,
        betAmount: gameRuleResult.context.betAmount,
        usdThreshold: evaluation.usdThreshold,
        localThreshold: evaluation.localThreshold,
        balanceInUsd: evaluation.balanceInUsd,
        exchangeRate: evaluation.exchangeRate,
        ruleMode: evaluation.ruleMode,
        winProbability: evaluation.winProbability,
        result: gameRuleResult.isWin,
      };

      await this.supabaseClient.from('game_rule_evaluations').insert([log]);
    } catch (error) {
      console.error('Failed to log rule evaluation:', error);
    }
  }

  async getEvaluationHistory(userId: string, limit: number = 100): Promise<RuleEvaluationLog[]> {
    if (!this.supabaseClient) {
      return [];
    }

    try {
      const { data, error } = await this.supabaseClient
        .from('game_rule_evaluations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch rule evaluation history:', error);
      return [];
    }
  }

  async getStatistics(userId: string): Promise<{
    totalRounds: number;
    winCount: number;
    lossCount: number;
    underThresholdRounds: number;
    forcedLossRounds: number;
    winRate: number;
  }> {
    if (!this.supabaseClient) {
      return {
        totalRounds: 0,
        winCount: 0,
        lossCount: 0,
        underThresholdRounds: 0,
        forcedLossRounds: 0,
        winRate: 0,
      };
    }

    try {
      const { data, error } = await this.supabaseClient
        .from('game_rule_evaluations')
        .select('result, rule_mode')
        .eq('user_id', userId);

      if (error) throw error;

      const logs = data || [];
      const totalRounds = logs.length;
      const winCount = logs.filter((log: any) => log.result === true).length;
      const lossCount = logs.filter((log: any) => log.result === false).length;
      const underThresholdRounds = logs.filter(
        (log: any) => log.rule_mode === 'UNDER_THRESHOLD',
      ).length;
      const forcedLossRounds = logs.filter(
        (log: any) => log.rule_mode === 'FORCED_LOSS',
      ).length;

      return {
        totalRounds,
        winCount,
        lossCount,
        underThresholdRounds,
        forcedLossRounds,
        winRate: totalRounds > 0 ? (winCount / totalRounds) * 100 : 0,
      };
    } catch (error) {
      console.error('Failed to calculate statistics:', error);
      return {
        totalRounds: 0,
        winCount: 0,
        lossCount: 0,
        underThresholdRounds: 0,
        forcedLossRounds: 0,
        winRate: 0,
      };
    }
  }
}

export const ruleEvaluationLogger = new RuleEvaluationLogger();
