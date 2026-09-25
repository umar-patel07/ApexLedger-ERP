package com.finmate.dao;

import com.finmate.config.DatabaseConfig;
import com.finmate.model.Customer;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CustomerDAO {

    public List<Customer> getAllCustomers() {
        List<Customer> list = new ArrayList<>();
        String sql = "SELECT id, name, company_name, email, phone, address, credit_limit, balance, risk_level, status FROM customers ORDER BY name ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                Customer c = new Customer();
                c.setId(rs.getInt("id"));
                c.setName(rs.getString("name"));
                c.setCompanyName(rs.getString("company_name"));
                c.setEmail(rs.getString("email"));
                c.setPhone(rs.getString("phone"));
                c.setAddress(rs.getString("address"));
                c.setCreditLimit(rs.getBigDecimal("credit_limit"));
                c.setBalance(rs.getBigDecimal("balance"));
                c.setRiskLevel(rs.getString("risk_level"));
                c.setStatus(rs.getString("status"));
                list.add(c);
            }
        } catch (SQLException e) {
            System.err.println("Failed to fetch customers: " + e.getMessage());
        }
        return list;
    }
}
