package com.finmate.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public class Expense {
    private int id;
    private String expenseNumber;
    private String category;
    private String description;
    private BigDecimal amount;
    private String paymentMethod;
    private String paymentAccountCode;
    private LocalDate expenseDate;
    private String status;

    public Expense() {
        this.expenseDate = LocalDate.now();
        this.amount = BigDecimal.ZERO;
        this.paymentMethod = "BANK";
        this.status = "ACTIVE";
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getExpenseNumber() { return expenseNumber; }
    public void setExpenseNumber(String expenseNumber) { this.expenseNumber = expenseNumber; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentAccountCode() { return paymentAccountCode; }
    public void setPaymentAccountCode(String paymentAccountCode) { this.paymentAccountCode = paymentAccountCode; }

    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
