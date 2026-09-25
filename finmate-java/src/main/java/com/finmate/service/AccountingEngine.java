package com.finmate.service;

import com.finmate.dao.AccountingDAO;
import com.finmate.model.ChartOfAccount;

import java.math.BigDecimal;
import java.util.List;

/**
 * Double-Entry GAAP & IFRS Engine for FINMATE Accounting System
 */
public class AccountingEngine {
    private final AccountingDAO accountingDAO;

    public AccountingEngine() {
        this.accountingDAO = new AccountingDAO();
    }

    public static class TrialBalanceResult {
        public BigDecimal totalDebit = BigDecimal.ZERO;
        public BigDecimal totalCredit = BigDecimal.ZERO;
        public boolean isBalanced = false;
        public List<ChartOfAccount> accounts;
    }

    public TrialBalanceResult generateTrialBalance() {
        TrialBalanceResult result = new TrialBalanceResult();
        result.accounts = accountingDAO.getChartOfAccounts();

        for (ChartOfAccount acc : result.accounts) {
            if (acc.getNormalBalance() == ChartOfAccount.NormalBalance.DEBIT) {
                result.totalDebit = result.totalDebit.add(acc.getBalance());
            } else {
                result.totalCredit = result.totalCredit.add(acc.getBalance());
            }
        }

        result.isBalanced = result.totalDebit.compareTo(result.totalCredit) == 0;
        return result;
    }

    public static class IncomeStatementResult {
        public BigDecimal totalRevenue = BigDecimal.ZERO;
        public BigDecimal totalCOGS = BigDecimal.ZERO;
        public BigDecimal grossProfit = BigDecimal.ZERO;
        public BigDecimal totalExpenses = BigDecimal.ZERO;
        public BigDecimal netIncome = BigDecimal.ZERO;
    }

    public IncomeStatementResult generateIncomeStatement() {
        IncomeStatementResult pnl = new IncomeStatementResult();
        List<ChartOfAccount> accounts = accountingDAO.getChartOfAccounts();

        for (ChartOfAccount acc : accounts) {
            if (acc.getAccountType() == ChartOfAccount.AccountType.REVENUE) {
                pnl.totalRevenue = pnl.totalRevenue.add(acc.getBalance());
            } else if (acc.getAccountType() == ChartOfAccount.AccountType.EXPENSE) {
                if (acc.getAccountCode().startsWith("5")) {
                    pnl.totalCOGS = pnl.totalCOGS.add(acc.getBalance());
                } else {
                    pnl.totalExpenses = pnl.totalExpenses.add(acc.getBalance());
                }
            }
        }

        pnl.grossProfit = pnl.totalRevenue.subtract(pnl.totalCOGS);
        pnl.netIncome = pnl.grossProfit.subtract(pnl.totalExpenses);
        return pnl;
    }
}
