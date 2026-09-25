package com.finmate.dao;

import com.finmate.config.DatabaseConfig;
import com.finmate.model.Product;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ProductDAO {

    public List<Product> getAllProducts() {
        List<Product> list = new ArrayList<>();
        String sql = "SELECT id, code, name, cost_price, selling_price, current_stock, min_stock_alert, unit, status FROM products ORDER BY id ASC";
        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                Product p = new Product();
                p.setId(rs.getInt("id"));
                p.setCode(rs.getString("code"));
                p.setName(rs.getString("name"));
                p.setCostPrice(rs.getBigDecimal("cost_price"));
                p.setSellingPrice(rs.getBigDecimal("selling_price"));
                p.setCurrentStock(rs.getInt("current_stock"));
                p.setMinStockAlert(rs.getInt("min_stock_alert"));
                p.setUnit(rs.getString("unit"));
                p.setStatus(rs.getString("status"));
                list.add(p);
            }
        } catch (SQLException e) {
            System.err.println("Failed to fetch products: " + e.getMessage());
        }
        return list;
    }

    public boolean adjustStock(int productId, int quantityChange, Connection conn) throws SQLException {
        String sql = "UPDATE products SET current_stock = current_stock + ? WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, quantityChange);
            ps.setInt(2, productId);
            return ps.executeUpdate() > 0;
        }
    }
}
