package com.finmate.dao;

import com.finmate.config.DatabaseConfig;
import com.finmate.model.ChartOfAccount;
import com.finmate.model.JournalEntry;
import com.finmate.model.JournalLine;

import java.math.BigDecimal;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AccountingDAO {

    public List<ChartOfAccount> getChartOfAccounts() {
        List<ChartOfAccount> list = new ArrayList<>();
        String sql = "SELECT account_code, account_name, account_type, normal_balance, balance, description, is_system " +
                     "FROM chart_of_accounts ORDER BY account_code ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                ChartOfAccount coa = new ChartOfAccount();
                coa.setAccountCode(rs.getString("account_code"));
                coa.setAccountName(rs.getString("account_name"));
                coa.setAccountType(ChartOfAccount.AccountType.valueOf(rs.getString("account_type")));
                coa.setNormalBalance(ChartOfAccount.NormalBalance.valueOf(rs.getString("normal_balance")));
                coa.setBalance(rs.getBigDecimal("balance"));
                coa.setDescription(rs.getString("description"));
                coa.setSystem(rs.getBoolean("is_system"));
                list.add(coa);
            }
        } catch (SQLException e) {
            System.err.println("Failed to fetch chart of accounts: " + e.getMessage());
        }
        return list;
    }

    public boolean recordJournalEntry(JournalEntry entry) {
        if (!entry.isBalanced()) {
            throw new IllegalArgumentException("Accounting Violation: Journal entry is not balanced. Debits must equal Credits.");
        }

        String insertEntry = "INSERT INTO journal_entries (entry_number, entry_date, description, reference_type, reference_id, created_by) " +
                            "VALUES (?, ?, ?, ?, ?, ?)";
        String insertLine = "INSERT INTO journal_entry_lines (journal_entry_id, account_code, debit, credit, description) " +
                           "VALUES (?, ?, ?, ?, ?)";
        String updateDebit = "UPDATE chart_of_accounts SET balance = balance + ? WHERE account_code = ?";
        String updateCredit = "UPDATE chart_of_accounts SET balance = balance + ? WHERE account_code = ?";

        Connection conn = null;
        try {
            conn = DatabaseConfig.getConnection();
            conn.setAutoCommit(false); // Begin ACID Transaction

            int entryId = 0;
            try (PreparedStatement ps = conn.prepareStatement(insertEntry, Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, entry.getEntryNumber());
                ps.setDate(2, Date.valueOf(entry.getEntryDate()));
                ps.setString(3, entry.getDescription());
                ps.setString(4, entry.getReferenceType());
                if (entry.getReferenceId() != null) ps.setInt(5, entry.getReferenceId());
                else ps.setNull(5, Types.INTEGER);
                ps.setString(6, entry.getCreatedBy());
                ps.executeUpdate();

                try (ResultSet generatedKeys = ps.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        entryId = generatedKeys.getInt(1);
                    }
                }
            }

            for (JournalLine line : entry.getLines()) {
                try (PreparedStatement psLine = conn.prepareStatement(insertLine)) {
                    psLine.setInt(1, entryId);
                    psLine.setString(2, line.getAccountCode());
                    psLine.setBigDecimal(3, line.getDebit());
                    psLine.setBigDecimal(4, line.getCredit());
                    psLine.setString(5, line.getDescription());
                    psLine.executeUpdate();
                }

                // Update ledger balances depending on normal balance
                if (line.getDebit().compareTo(BigDecimal.ZERO) > 0) {
                    try (PreparedStatement psUpdate = conn.prepareStatement(updateDebit)) {
                        psUpdate.setBigDecimal(1, line.getDebit());
                        psUpdate.setString(2, line.getAccountCode());
                        psUpdate.executeUpdate();
                    }
                }
                if (line.getCredit().compareTo(BigDecimal.ZERO) > 0) {
                    try (PreparedStatement psUpdate = conn.prepareStatement(updateCredit)) {
                        psUpdate.setBigDecimal(1, line.getCredit());
                        psUpdate.setString(2, line.getAccountCode());
                        psUpdate.executeUpdate();
                    }
                }
            }

            conn.commit(); // Commit ACID Transaction
            return true;
        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ignored) {}
            }
            System.err.println("Journal entry transaction failed: " + e.getMessage());
            return false;
        } finally {
            if (conn != null) {
                try { conn.setAutoCommit(true); conn.close(); } catch (SQLException ignored) {}
            }
        }
    }
}
