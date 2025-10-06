🏛 Database Schema: Chapel + Coffee/F&B System
🧱 1️⃣ Chapel Rooms Table

Stores all chapel room information.

CREATE TABLE sg.LQ_chapel_rooms (
    chapelID INT IDENTITY(1,1) PRIMARY KEY,
    chapelName NVARCHAR(100) NOT NULL,
    status NVARCHAR(20) DEFAULT 'Available', -- Available, Occupied, Maintenance
    description NVARCHAR(255),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

🧍 2️⃣ Client Information Table

Stores client details (linked to chapel and package).

CREATE TABLE sg.LQ_client_info (
    clientID INT IDENTITY(1,1) PRIMARY KEY,
    deceasedName NVARCHAR(100) NOT NULL,
    registeredBy NVARCHAR(100) NOT NULL,
    mobileNo NVARCHAR(20) NOT NULL,
    email NVARCHAR(100),
    address NVARCHAR(255),
    schedule_from DATETIME NOT NULL,
    schedule_to DATETIME NOT NULL,
    chapelID INT NOT NULL,
    packageNo INT,
    pin NVARCHAR(10) NOT NULL, -- user or system-generated
    packageBalance DECIMAL(10,2) DEFAULT 0,
    additionalBalance DECIMAL(10,2) DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'Active', -- Active, Completed
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (chapelID) REFERENCES sg.LQ_chapel_rooms(chapelID)
);

💰 3️⃣ Packages Table

Each package defines a set of food/beverage items and pricing.

CREATE TABLE sg.LQ_packages (
    packageID INT IDENTITY(1,1) PRIMARY KEY,
    packageName NVARCHAR(100) NOT NULL,
    description NVARCHAR(255),
    totalValue DECIMAL(10,2) NOT NULL,
    status NVARCHAR(20) DEFAULT 'Active', -- Active, Inactive
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

🍩 4️⃣ Product Categories

Used for grouping food and beverage items.

CREATE TABLE sg.LQ_product_categories (
    categoryID INT IDENTITY(1,1) PRIMARY KEY,
    categoryName NVARCHAR(100) NOT NULL,
    description NVARCHAR(255),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

☕ 5️⃣ Products Table

Contains all food and beverage items that can be added to packages or orders.

CREATE TABLE sg.LQ_products (
    productID INT IDENTITY(1,1) PRIMARY KEY,
    categoryID INT NOT NULL,
    productName NVARCHAR(100) NOT NULL,
    description NVARCHAR(255),
    image NVARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    size NVARCHAR(50), -- e.g., 12oz, 16oz
    status NVARCHAR(20) DEFAULT 'Available',
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (categoryID) REFERENCES sg.LQ_product_categories(categoryID)
);

📦 6️⃣ Package Items

Defines which products belong to which package (and quantity per package).

CREATE TABLE sg.LQ_package_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    packageID INT NOT NULL,
    productID INT NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (packageID) REFERENCES sg.LQ_packages(packageID),
    FOREIGN KEY (productID) REFERENCES sg.LQ_products(productID)
);

🧾 7️⃣ Orders Table

Orders placed by chapel clients (via PIN login).

CREATE TABLE sg.LQ_orders (
    orderID INT IDENTITY(1,1) PRIMARY KEY,
    clientID INT NOT NULL,
    totalAmount DECIMAL(10,2) NOT NULL,
    status NVARCHAR(20) DEFAULT 'Pending', -- Pending, Preparing, Completed, Cancelled
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (clientID) REFERENCES sg.LQ_client_info(clientID)
);

🛒 8️⃣ Order Items

Tracks each product ordered and quantity.

CREATE TABLE sg.LQ_order_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    orderID INT NOT NULL,
    productID INT NOT NULL,
    quantity INT NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (orderID) REFERENCES sg.LQ_orders(orderID),
    FOREIGN KEY (productID) REFERENCES sg.LQ_products(productID)
);

👥 9️⃣ Staff Table

For users who handle chapel or F&B operations.

CREATE TABLE sg.LQ_staff_accounts (
    staffID INT IDENTITY(1,1) PRIMARY KEY,
    fullName NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    phone NVARCHAR(20),
    role NVARCHAR(50) NOT NULL, -- Admin, Cashier, Staff
    passwordHash NVARCHAR(255) NOT NULL,
    status NVARCHAR(20) DEFAULT 'Active',
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

💳 🔟 Payment Transactions

Records client payments or top-ups.

CREATE TABLE sg.LQ_payment_transactions (
    transactionID INT IDENTITY(1,1) PRIMARY KEY,
    clientID INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    paymentType NVARCHAR(50), -- Cash, GCash, etc.
    remarks NVARCHAR(255),
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (clientID) REFERENCES sg.LQ_client_info(clientID)
);

🔁 11️⃣ Stored Procedure: Auto-Release Expired Chapel Rooms
CREATE PROCEDURE sg.LQ_release_expired_chapel_rooms
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE sg.LQ_client_info
    SET status = 'Completed',
        updatedAt = GETDATE()
    WHERE schedule_to < GETDATE()
      AND status = 'Active';

    UPDATE r
    SET r.status = 'Available',
        r.updatedAt = GETDATE()
    FROM sg.LQ_chapel_rooms r
    INNER JOIN sg.LQ_client_info c ON c.chapelID = r.chapelID
    WHERE c.schedule_to < GETDATE()
      AND c.status = 'Completed'
      AND r.status = 'Occupied';
END;


1️⃣ Table: sg.LQ_client_information

Stores all client and chapel booking details.

CREATE TABLE sg.LQ_client_info (
    clientID INT IDENTITY(1,1) PRIMARY KEY,
    deceasedName NVARCHAR(100),
    registeredBy NVARCHAR(100),
    mobileNo NVARCHAR(20),
    email NVARCHAR(100),
    address NVARCHAR(255),
    schedule_from DATETIME,
    schedule_to DATETIME,
    chapelID INT,
    packageNo INT,
    pin NVARCHAR(10),
    packageBalance DECIMAL(10,2),
    additionalBalance DECIMAL(10,2),
    status NVARCHAR(20) DEFAULT 'Active', -- Active, Completed
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (chapelID) REFERENCES sg.LQ_chapel_rooms(chapelID)
);

CREATE PROCEDURE sg.LQ_release_expired_chapel_rooms
AS
BEGIN
    SET NOCOUNT ON;

    -- Step 1: Find all client records whose schedule_to has passed and are still marked Active
    UPDATE sg.LQ_client_info
    SET status = 'Completed',
        updatedAt = GETDATE()
    WHERE schedule_to < GETDATE()
      AND status = 'Active';

    -- Step 2: Mark the corresponding chapel rooms as Available again
    UPDATE r
    SET r.status = 'Available',
        r.updatedAt = GETDATE()
    FROM sg.LQ_chapel_rooms r
    INNER JOIN sg.LQ_client_info c ON c.chapelID = r.chapelID
    WHERE c.schedule_to < GETDATE()
      AND c.status = 'Completed'
      AND r.status = 'Occupied';
END;

2️⃣ Table: sg.LQ_chapel_rooms

Tracks chapel room availability.

CREATE TABLE sg.LQ_chapel_rooms (
    chapelID INT IDENTITY(1,1) PRIMARY KEY,
    chapelNo NVARCHAR(50) UNIQUE NOT NULL,
    status NVARCHAR(20) DEFAULT 'Available', -- Available, Occupied, Maintenance
    createdAt DATETIME DEFAULT GETDATE()
);

3️⃣ Stored Procedure: sg.LQ_client_register

Registers a new client and assigns a chapel room + PIN.

CREATE PROCEDURE sg.LQ_client_register
    @deceasedName NVARCHAR(150),
    @registeredBy NVARCHAR(150),
    @mobileNo NVARCHAR(20),
    @email NVARCHAR(150),
    @address NVARCHAR(250),
    @scheduleFrom DATETIME,
    @scheduleTo DATETIME,
    @chapelNo NVARCHAR(50),
    @packageNo NVARCHAR(50),
    @pin NVARCHAR(10),
    @packageBalance DECIMAL(18,2),
    @additionalBalance DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if chapel is available
    IF EXISTS (SELECT 1 FROM sg.LQ_chapel_rooms WHERE chapelNo = @chapelNo AND status <> 'Available')
    BEGIN
        RAISERROR('Selected chapel is not available.', 16, 1);
        RETURN;
    END;

    -- Register client
    INSERT INTO sg.LQ_client_information
    (
        deceasedName, registeredBy, mobileNo, email, address,
        scheduleFrom, scheduleTo, chapelNo, packageNo,
        pin, packageBalance, additionalBalance, status
    )
    VALUES
    (
        @deceasedName, @registeredBy, @mobileNo, @email, @address,
        @scheduleFrom, @scheduleTo, @chapelNo, @packageNo,
        @pin, @packageBalance, @additionalBalance, 'Active'
    );

    -- Update chapel to Occupied
    UPDATE sg.LQ_chapel_rooms
    SET status = 'Occupied'
    WHERE chapelNo = @chapelNo;
END;

4️⃣ Stored Procedure: sg.LQ_client_update

Allows admin/cashier to update client details.

CREATE PROCEDURE sg.LQ_client_update
    @clientID INT,
    @mobileNo NVARCHAR(20),
    @email NVARCHAR(150),
    @address NVARCHAR(250),
    @scheduleFrom DATETIME,
    @scheduleTo DATETIME,
    @packageBalance DECIMAL(18,2),
    @additionalBalance DECIMAL(18,2)
AS
BEGIN
    UPDATE sg.LQ_client_information
    SET
        mobileNo = @mobileNo,
        email = @email,
        address = @address,
        scheduleFrom = @scheduleFrom,
        scheduleTo = @scheduleTo,
        packageBalance = @packageBalance,
        additionalBalance = @additionalBalance,
        updatedAt = GETDATE()
    WHERE clientID = @clientID;
END;

5️⃣ Stored Procedure: sg.LQ_client_raise_balance

Add funds to client’s package or additional balance.

CREATE PROCEDURE sg.LQ_client_raise_balance
    @clientID INT,
    @amount DECIMAL(18,2),
    @type NVARCHAR(20) -- 'Package' or 'Additional'
AS
BEGIN
    IF @type = 'Package'
        UPDATE sg.LQ_client_information
        SET packageBalance = packageBalance + @amount
        WHERE clientID = @clientID;
    ELSE
        UPDATE sg.LQ_client_information
        SET additionalBalance = additionalBalance + @amount
        WHERE clientID = @clientID;
END;

6️⃣ Stored Procedure: sg.LQ_chapel_set_status

Updates chapel room availability.

CREATE PROCEDURE sg.LQ_chapel_set_status
    @chapelNo NVARCHAR(50),
    @status NVARCHAR(20)
AS
BEGIN
    UPDATE sg.LQ_chapel_rooms
    SET status = @status
    WHERE chapelNo = @chapelNo;
END;


🍽 Food & Beverage Module – Database Design
1️⃣ Table: sg.LQ_fnb_categories

Stores product categories (Coffee, Pastries, Meals, Drinks, etc.)

CREATE TABLE sg.LQ_fnb_categories (
    categoryID INT IDENTITY(1,1) PRIMARY KEY,
    categoryName NVARCHAR(100) NOT NULL,
    description NVARCHAR(255),
    image NVARCHAR(255),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

2️⃣ Table: sg.LQ_fnb_products

Stores all available products under each category.

CREATE TABLE sg.LQ_fnb_products (
    productID INT IDENTITY(1,1) PRIMARY KEY,
    categoryID INT NOT NULL FOREIGN KEY REFERENCES sg.LQ_fnb_categories(categoryID),
    productName NVARCHAR(150) NOT NULL,
    description NVARCHAR(255),
    price DECIMAL(18,2),
    size NVARCHAR(50), -- e.g., "12oz", "16oz"
    image NVARCHAR(255),
    isAvailable BIT DEFAULT 1, -- 1 = available, 0 = sold out
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

3️⃣ Table: sg.LQ_fnb_packages

Defines the food and beverage bundles available (e.g., “Basic Package”, “Premium Package”).

CREATE TABLE sg.LQ_fnb_packages (
    packageID INT IDENTITY(1,1) PRIMARY KEY,
    packageName NVARCHAR(100) NOT NULL,
    description NVARCHAR(255),
    totalValue DECIMAL(18,2) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

4️⃣ Table: sg.LQ_fnb_package_items

Links each package to multiple food/drink products with specific quantities.

CREATE TABLE sg.LQ_fnb_package_items (
    packageItemID INT IDENTITY(1,1) PRIMARY KEY,
    packageID INT NOT NULL FOREIGN KEY REFERENCES sg.LQ_fnb_packages(packageID),
    productID INT NOT NULL FOREIGN KEY REFERENCES sg.LQ_fnb_products(productID),
    quantity INT NOT NULL
);

5️⃣ Table: sg.LQ_fnb_orders

Stores orders made by clients inside the chapel (via QR login).

CREATE TABLE sg.LQ_fnb_orders (
    orderID INT IDENTITY(1,1) PRIMARY KEY,
    clientID INT NOT NULL FOREIGN KEY REFERENCES sg.LQ_client_information(clientID),
    status NVARCHAR(20) DEFAULT 'Pending', -- Pending, Preparing, Completed, Cancelled
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

6️⃣ Table: sg.LQ_fnb_order_items

Stores each ordered product per order.

CREATE TABLE sg.LQ_fnb_order_items (
    orderItemID INT IDENTITY(1,1) PRIMARY KEY,
    orderID INT NOT NULL FOREIGN KEY REFERENCES sg.LQ_fnb_orders(orderID),
    productID INT NOT NULL FOREIGN KEY REFERENCES sg.LQ_fnb_products(productID),
    quantity INT NOT NULL,
    size NVARCHAR(50),
    createdAt DATETIME DEFAULT GETDATE()
);

7️⃣ Stored Procedure: sg.LQ_fnb_place_order

Handles new orders placed by a client (through QR + PIN login).

CREATE PROCEDURE sg.LQ_fnb_place_order
    @clientID INT,
    @productList NVARCHAR(MAX) -- JSON format: [{"productID":1,"quantity":2,"size":"12oz"},...]
AS
BEGIN
    DECLARE @orderID INT;

    INSERT INTO sg.LQ_fnb_orders (clientID, status)
    VALUES (@clientID, 'Pending');

    SET @orderID = SCOPE_IDENTITY();

    DECLARE @productID INT, @quantity INT, @size NVARCHAR(50);
    DECLARE @json NVARCHAR(MAX) = @productList;

    INSERT INTO sg.LQ_fnb_order_items (orderID, productID, quantity, size)
    SELECT @orderID, productID, quantity, size
    FROM OPENJSON(@json)
    WITH (
        productID INT,
        quantity INT,
        size NVARCHAR(50)
    );

    SELECT @orderID AS orderID;
END;

8️⃣ Stored Procedure: sg.LQ_fnb_update_order_status

Used by staff to change order status.

CREATE PROCEDURE sg.LQ_fnb_update_order_status
    @orderID INT,
    @status NVARCHAR(20)
AS
BEGIN
    UPDATE sg.LQ_fnb_orders
    SET status = @status,
        updatedAt = GETDATE()
    WHERE orderID = @orderID;
END;