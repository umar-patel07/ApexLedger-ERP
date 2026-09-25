package com.finmate.model;

import java.math.BigDecimal;

public class Supplier {
    private int id;
    private String name;
    private String companyName;
    private String email;
    private String phone;
    private String address;
    private BigDecimal balance;
    private String paymentTerms;
    private String status;

    public Supplier() {
        this.balance = BigDecimal.ZERO;
        this.paymentTerms = "Net 30 Days";
        this.status = "ACTIVE";
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }

    public String getPaymentTerms() { return paymentTerms; }
    public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    @Override
    public String toString() {
        return name + (companyName != null ? " (" + companyName + ")" : "");
    }
}
