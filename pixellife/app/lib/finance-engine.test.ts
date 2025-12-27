/**
 * Testes unitários para lógica financeira
 * 
 * Executar: npm test
 * Com UI: npm run test:ui
 * Com coverage: npm run test:coverage
 */

import { describe, it, expect } from 'vitest';
import {
  calculateIncrementalBalance,
  findLastSavedValue,
  calculateRemainingLimit,
  calculateAccumulatedExpenses,
  isValidFinancialValue,
  formatCurrency,
} from './finance-engine';

describe('Finance Engine', () => {
  describe('calculateIncrementalBalance', () => {
    it('deve calcular saldo incremental corretamente', () => {
      const baseValue = 100;
      const dailyTotals = [10, -20, 30, -15];
      const result = calculateIncrementalBalance(baseValue, dailyTotals);
      expect(result).toBe(105); // 100 + 10 - 20 + 30 - 15
    });

    it('deve retornar valor base se não houver totais diários', () => {
      const baseValue = 50;
      const dailyTotals: number[] = [];
      const result = calculateIncrementalBalance(baseValue, dailyTotals);
      expect(result).toBe(50);
    });

    it('deve lidar com valores negativos corretamente', () => {
      const baseValue = 200;
      const dailyTotals = [-50, -30, -20];
      const result = calculateIncrementalBalance(baseValue, dailyTotals);
      expect(result).toBe(100); // 200 - 50 - 30 - 20
    });

    it('deve lidar com valores zero', () => {
      const baseValue = 100;
      const dailyTotals = [0, 0, 0];
      const result = calculateIncrementalBalance(baseValue, dailyTotals);
      expect(result).toBe(100);
    });
  });

  describe('findLastSavedValue', () => {
    it('deve encontrar o último valor salvo', () => {
      const dateKeys = ['2025-01-01', '2025-01-02', '2025-01-03', '2025-01-04'];
      const savedValues = {
        '2025-01-02': 150,
        '2025-01-04': 200,
      };
      const result = findLastSavedValue(dateKeys, savedValues);
      expect(result).toEqual({ value: 200, dateKey: '2025-01-04' });
    });

    it('deve retornar null se não houver valores salvos', () => {
      const dateKeys = ['2025-01-01', '2025-01-02'];
      const savedValues: Record<string, number> = {};
      const result = findLastSavedValue(dateKeys, savedValues);
      expect(result).toBeNull();
    });

    it('deve buscar do mais recente para o mais antigo', () => {
      const dateKeys = ['2025-01-01', '2025-01-02', '2025-01-03'];
      const savedValues = {
        '2025-01-01': 100,
        '2025-01-03': 300,
      };
      const result = findLastSavedValue(dateKeys, savedValues);
      // Deve retornar o mais recente (01-03), não o mais antigo (01-01)
      expect(result?.dateKey).toBe('2025-01-03');
      expect(result?.value).toBe(300);
    });
  });

  describe('calculateRemainingLimit', () => {
    it('deve calcular limite restante corretamente', () => {
      const monthlyLimit = 1000;
      const accumulatedExpenses = 350;
      const result = calculateRemainingLimit(monthlyLimit, accumulatedExpenses);
      expect(result).toBe(650);
    });

    it('não deve retornar valor negativo', () => {
      const monthlyLimit = 500;
      const accumulatedExpenses = 800;
      const result = calculateRemainingLimit(monthlyLimit, accumulatedExpenses);
      expect(result).toBe(0);
    });

    it('deve retornar o limite completo se não houver gastos', () => {
      const monthlyLimit = 1000;
      const accumulatedExpenses = 0;
      const result = calculateRemainingLimit(monthlyLimit, accumulatedExpenses);
      expect(result).toBe(1000);
    });

    it('deve lidar com limite zero', () => {
      const monthlyLimit = 0;
      const accumulatedExpenses = 100;
      const result = calculateRemainingLimit(monthlyLimit, accumulatedExpenses);
      expect(result).toBe(0);
    });
  });

  describe('calculateAccumulatedExpenses', () => {
    it('deve calcular apenas gastos (valores negativos)', () => {
      const dailyTotals = [100, -50, -30, 200, -20];
      const result = calculateAccumulatedExpenses(dailyTotals);
      expect(result).toBe(100); // 50 + 30 + 20 (apenas negativos, convertidos para positivo)
    });

    it('deve retornar zero se não houver gastos', () => {
      const dailyTotals = [100, 200, 50];
      const result = calculateAccumulatedExpenses(dailyTotals);
      expect(result).toBe(0);
    });

    it('deve lidar com array vazio', () => {
      const dailyTotals: number[] = [];
      const result = calculateAccumulatedExpenses(dailyTotals);
      expect(result).toBe(0);
    });
  });

  describe('isValidFinancialValue', () => {
    it('deve validar números válidos', () => {
      expect(isValidFinancialValue(100)).toBe(true);
      expect(isValidFinancialValue(-50)).toBe(true);
      expect(isValidFinancialValue(0)).toBe(true);
      expect(isValidFinancialValue(123.45)).toBe(true);
    });

    it('deve rejeitar valores inválidos', () => {
      expect(isValidFinancialValue(NaN)).toBe(false);
      expect(isValidFinancialValue(Infinity)).toBe(false);
      expect(isValidFinancialValue(-Infinity)).toBe(false);
      expect(isValidFinancialValue('100')).toBe(false);
      expect(isValidFinancialValue(null)).toBe(false);
      expect(isValidFinancialValue(undefined)).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('deve formatar valores em BRL corretamente', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1.234,56');
      expect(result).toContain('R$');
    });

    it('deve formatar valores negativos', () => {
      const result = formatCurrency(-100);
      expect(result).toContain('-');
    });

    it('deve formatar zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });
  });

  describe('Cenários de integração', () => {
    it('deve calcular saldo completo: base + acumulação', () => {
      // Simula: valor salvo no dia 10 = 500, depois dias 11-13 com totais
      const baseValue = 500;
      const dailyTotals = [-50, 100, -30];
      const balance = calculateIncrementalBalance(baseValue, dailyTotals);
      expect(balance).toBe(520); // 500 - 50 + 100 - 30
    });

    it('deve calcular limite restante completo', () => {
      // Simula: limite 3000, gastos acumulados 1200
      const monthlyLimit = 3000;
      const dailyTotals = [-200, -300, -400, -300]; // gastos
      const accumulatedExpenses = calculateAccumulatedExpenses(dailyTotals);
      const remaining = calculateRemainingLimit(monthlyLimit, accumulatedExpenses);
      expect(accumulatedExpenses).toBe(1200);
      expect(remaining).toBe(1800);
    });
  });
});
