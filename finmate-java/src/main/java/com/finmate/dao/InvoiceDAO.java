package com.finmate.dao;

import com.finmate.config.DatabaseConfig;
import com.finmate.model.Invoice;
import com.finmate.model.InvoiceItem;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class InvoiceDAO {

    public List<Invoice> getAllInvoices() {
        List<Invoice> list = new ArrayList<>();
        String sql = "SELECT i.id, i.invoice_number, i.customer_id, c.name as customer_name, i.invoice_date, i.due_date, " +
                     "i.subtotal, i.tax_rate, i.tax_amount, i.discount, i.total_amount, i.paid_amount, i.balance_due, " +
                     "i.payment_status, i.status " +
                     "FROM invoices i " +
                     "LEFT JOIN customers c ON i.customer_id = c.id " +
                     "ORDER BY i.id DESC";
        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                Invoice inv = new Invoice();
                inv.setId(rs.getInt("id"));
                inv.setInvoiceNumber(rs.getString("invoice_number"));
                inv.setCustomerId(rs.getInt("customer_id"));
                inv.setCustomerName(rs.getString("customer_name"));
                inv.setInvoiceDate(rs.getDate("invoice_date").toLocalDate());
                inv.setDueDate(rs.getDate("due_date").toLocalDate());
                inv.setSubtotal(rs.getBigDecimal("subtotal"));
                inv.setTaxRate(rs.getBigDecimal("tax_rate"));
                inv.setTaxAmount(rs.getBigDecimal("tax_amount"));
                inv.setDiscount(rs.getBigDecimal("discount"));
                inv.setTotalAmount(rs.getBigDecimal("total_amount"));
                inv.setPaidAmount(rs.getBigDecimal("paid_amount"));
                inv.setBalanceDue(rs.getBigDecimal("balance_due"));
                inv.setPaymentStatus(rs.getString("payment_status"));
                inv.setStatus(rs.getString("status"));
                list.add(inv);
            }
        } catch (SQLException e) {
            System.err.println("Failed to fetch invoices: " + e.getMessage());
        }
        return list;
    }
}
