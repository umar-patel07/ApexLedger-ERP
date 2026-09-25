package com.finmate.model;

import java.math.BigDecimal;

public class ChartOfAccount {
    private String accountCode;
    private String accountName;
    private AccountType accountType;
    private NormalBalance normalBalance;
    private BigDecimal balance;
    private String description;
    private boolean isSystem;

    public enum AccountType {
        ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    }

    public enum NormalBalance {
        DEBIT, CREDIT
    }

    public ChartOfAccount() {
        this.balance = BigDecimal.ZERO;
    }

    public ChartOfAccount(String accountCode, String accountName, AccountType accountType, NormalBalance normalBalance, BigDecimal balance) {
        this.accountCode = accountCode;
        this.accountName = accountName;
        this.accountType = accountType;
        this.normalBalance = normalBalance;
        this.balance = balance;
    }

    public String getAccountCode() { return accountCode; }
    public void setAccountCode(String accountCode) { this.accountCode = accountCode; }

    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }

    public AccountType getAccountType() { return accountType; }
    public void setAccountType(AccountType accountType) { this.accountType = accountType; }

    public NormalBalance getNormalBalance() { return normalBalance; }
    public void setNormalBalance(NormalBalance normalBalance) { this.normalBalance = normalBalance; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isSystem() { return isSystem; }
    public void setSystem(boolean isSystem) { this.isSystem = isSystem; }

    @Override
    public String toString() {
        return accountCode + " - " + accountName + " (" + accountType + ")";
    }
}
