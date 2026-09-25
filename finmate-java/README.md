# FINMATE – Smart Accounting and Business Management System
## Java 21 LTS + JavaFX 21 + MySQL 8.0 Enterprise Desktop Application

Welcome to the **FINMATE** Java desktop application source repository!

### Project Architecture & Folder Structure
```
finmate-java/
├── pom.xml                                    # Apache Maven build descriptor
├── schema.sql                                 # MySQL 8.0+ complete relational schema
├── README.md                                  # Setup & execution instructions
└── src/
    └── main/
        ├── java/com/finmate/
        │   ├── Main.java                      # Standard Java entry point
        │   ├── FinmateApp.java                # JavaFX GUI Application entry point
        │   ├── config/
        │   │   └── DatabaseConfig.java        # HikariCP JDBC connection pool
        │   ├── model/
        │   │   ├── User.java                  # User profile & RBAC role entity
        │   │   ├── Product.java               # Inventory product entity
        │   │   ├── Customer.java              # Accounts receivable debtor entity
        │   │   ├── Supplier.java              # Accounts payable vendor entity
        │   │   ├── Invoice.java               # Sales invoice document
        │   │   ├── InvoiceItem.java           # Sales invoice line item
        │   │   ├── Purchase.java              # Stock purchase order
        │   │   ├── Expense.java               # Expense voucher
        │   │   ├── ChartOfAccount.java        # General ledger master account
        │   │   ├── JournalEntry.java          # Double-entry general journal header
        │   │   └── JournalLine.java           # Balanced debit/credit line
        │   ├── dao/
        │   │   ├── UserDAO.java               # User authentication & RBAC query layer
        │   │   ├── ProductDAO.java            # Product catalog & stock updater
        │   │   ├── CustomerDAO.java           # Customer credit & balance queries
        │   │   ├── InvoiceDAO.java            # Invoices & items transaction management
        │   │   └── AccountingDAO.java         # Journal entries & trial balance calculation
        │   ├── service/
        │   │   ├── AccountingEngine.java      # Double-entry balance validator & P&L builder
        │   │   └── FinancialHealthService.java# Health score, liquidity & runway calculator
        │   └── ui/
        │       ├── LoginDialog.java           # Authentication dialog
        │       ├── DashboardView.java         # Financial executive KPI dashboard
        │       ├── SalesView.java             # Invoicing & customer ledger UI
        │       └── AccountingView.java        # Trial balance, Balance Sheet & Journal entries UI
        └── resources/
            ├── application.properties         # Database credentials and configuration
            └── schema.sql                     # Packaged copy of DDL schema
```

---

### Prerequisites
1. **Java Development Kit (JDK) 21 LTS**:
   - Download from Eclipse Temurin, Amazon Corretto, or Oracle JDK 21.
   - Verify in terminal: `java -version` and `javac -version`.
2. **Apache Maven 3.9+**:
   - Verify in terminal: `mvn -version`.
3. **MySQL Server 8.0+**:
   - Running locally on default port `3306`.

---

### Database Setup
1. Log into your MySQL console:
   ```bash
   mysql -u root -p
   ```
2. Run the provided schema script:
   ```bash
   SOURCE finmate-java/schema.sql;
   ```
3. Update `src/main/resources/application.properties` (or `DatabaseConfig.java`) with your MySQL root password:
   ```properties
   db.url=jdbc:mysql://localhost:3306/finmate_accounting_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   db.username=root
   db.password=YOUR_MYSQL_PASSWORD_HERE
   ```

---

### Running the Application

#### Option A: Using Maven Command Line
Navigate into this folder:
```bash
cd finmate-java
mvn clean compile
mvn javafx:run
```

#### Option B: In IntelliJ IDEA
1. Open IntelliJ IDEA -> **File** -> **Open** -> select `finmate-java/pom.xml`.
2. Select **Open as Project**.
3. Maven will automatically resolve all JavaFX and MySQL dependencies.
4. Run `com.finmate.Main` or run the `javafx:run` Maven goal.

#### Option C: In Eclipse
1. Open Eclipse -> **File** -> **Import** -> **Existing Maven Projects**.
2. Select `finmate-java` directory.
3. Right click `pom.xml` -> **Run As** -> **Maven build...** with goal `javafx:run`.

---

### Default Test Login Credentials
- **Admin**: `admin` / `admin123` (Full system configuration, reversals, and audit logs)
- **Accountant**: `accountant` / `accountant123` (Invoices, purchases, expenses, journal entries)
- **Viewer**: `viewer` / `viewer123` (Read-only financial statements and reports)
