package com.finmate.model;

import java.math.BigDecimal;

public class Product {
    private int id;
    private String code;
    private String name;
    private Integer categoryId;
    private BigDecimal costPrice;
    private BigDecimal sellingPrice;
    private int currentStock;
    private int minStockAlert;
    private String unit;
    private String status;

    public Product() {
        this.costPrice = BigDecimal.ZERO;
        this.sellingPrice = BigDecimal.ZERO;
        this.unit = "Units";
        this.status = "ACTIVE";
    }

    public Product(int id, String code, String name, BigDecimal costPrice, BigDecimal sellingPrice, int currentStock) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.costPrice = costPrice;
        this.sellingPrice = sellingPrice;
        this.currentStock = currentStock;
        this.minStockAlert = 5;
        this.unit = "Units";
        this.status = "ACTIVE";
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }

    public BigDecimal getCostPrice() { return costPrice; }
    public void setCostPrice(BigDecimal costPrice) { this.costPrice = costPrice; }

    public BigDecimal getSellingPrice() { return sellingPrice; }
    public void setSellingPrice(BigDecimal sellingPrice) { this.sellingPrice = sellingPrice; }

    public int getCurrentStock() { return currentStock; }
    public void setCurrentStock(int currentStock) { this.currentStock = currentStock; }

    public int getMinStockAlert() { return minStockAlert; }
    public void setMinStockAlert(int minStockAlert) { this.minStockAlert = minStockAlert; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isLowStock() {
        return currentStock <= minStockAlert;
    }

    public BigDecimal getGrossMargin() {
        if (sellingPrice == null || sellingPrice.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;
        return sellingPrice.subtract(costPrice);
    }
}
