-- =============================================
-- 🏛 SCHEMA: sg.LQ_CSS (Coffee Shop System)
-- =============================================

-- =============================================
-- 1️⃣ Chapel Module
-- =============================================

CREATE TABLE sg.LQ_CSS_chapel_rooms (
    chapelID INT IDENTITY(1,1) PRIMARY KEY,
    chapelName NVARCHAR(100) NOT NULL,
    status NVARCHAR(20) DEFAULT 'Available',
    description NVARCHAR(255),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE sg.LQ_CSS_client_info (
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
    pin NVARCHAR(10) NOT NULL,
    packageBalance DECIMAL(10,2) DEFAULT 0,
    additionalBalance DECIMAL(10,2) DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'Active',
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (chapelID) REFERENCES sg.LQ_CSS_chapel_rooms(chapelID)
);

-- Client Registration
CREATE PROCEDURE sg.LQ_CSS_client_register
    @deceasedName NVARCHAR(150),
    @registeredBy NVARCHAR(150),
    @mobileNo NVARCHAR(20),
    @email NVARCHAR(150),
    @address NVARCHAR(250),
    @scheduleFrom DATETIME,
    @scheduleTo DATETIME,
    @chapelID INT,
    @packageNo INT,
    @pin NVARCHAR(10),
    @packageBalance DECIMAL(18,2),
    @additionalBalance DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM sg.LQ_CSS_chapel_rooms WHERE chapelID = @chapelID AND status <> 'Available')
    BEGIN
        RAISERROR('Selected chapel is not available.', 16, 1);
        RETURN;
    END;

    INSERT INTO sg.LQ_CSS_client_info
    (
        deceasedName, registeredBy, mobileNo, email, address,
        schedule_from, schedule_to, chapelID, packageNo,
        pin, packageBalance, additionalBalance, status
    )
    VALUES
    (
        @deceasedName, @registeredBy, @mobileNo, @email, @address,
        @scheduleFrom, @scheduleTo, @chapelID, @packageNo,
        @pin, @packageBalance, @additionalBalance, 'Active'
    );

    UPDATE sg.LQ_CSS_chapel_rooms
    SET status = 'Occupied', updatedAt = GETDATE()
    WHERE chapelID = @chapelID;
END;
GO

-- Client Update
ALTER PROCEDURE sg.LQ_CSS_client_update
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
    UPDATE sg.LQ_CSS_client_info
    SET
        mobileNo = @mobileNo,
        email = @email,
        address = @address,
        schedule_from = @scheduleFrom,
        schedule_to = @scheduleTo,
        packageBalance = @packageBalance,
        additionalBalance = @additionalBalance,
        updatedAt = GETDATE()
    WHERE clientID = @clientID;
END;
GO

-- Raise Balance
ALTER PROCEDURE sg.LQ_CSS_client_raise_balance
    @clientID INT,
    @amount DECIMAL(18,2),
    @type NVARCHAR(20)
AS
BEGIN
    IF @type = 'Package'
        UPDATE sg.LQ_CSS_client_info
        SET packageBalance = packageBalance + @amount
        WHERE clientID = @clientID;
    ELSE
        UPDATE sg.LQ_CSS_client_info
        SET additionalBalance = additionalBalance + @amount
        WHERE clientID = @clientID;
END;
GO

-- Update Chapel Status
ALTER PROCEDURE sg.LQ_CSS_chapel_set_status
    @chapelID INT,
    @status NVARCHAR(20)
AS
BEGIN
    UPDATE sg.LQ_CSS_chapel_rooms
    SET status = @status,
        updatedAt = GETDATE()
    WHERE chapelID = @chapelID;
END;
GO

-- =============================================
-- 2️⃣ Food & Beverage Module
-- =============================================

CREATE TABLE sg.LQ_CSS_fnb_categories (
    categoryID INT IDENTITY(1,1) PRIMARY KEY,
    categoryName NVARCHAR(100) NOT NULL,
    description NVARCHAR(255),
    image NVARCHAR(255),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE sg.LQ_CSS_fnb_products (
    productID INT IDENTITY(1,1) PRIMARY KEY,
    categoryID INT NOT NULL,
    productName NVARCHAR(150) NOT NULL,
    description NVARCHAR(255),
    price DECIMAL(18,2),
    size NVARCHAR(50),
    image NVARCHAR(255),
    isAvailable BIT DEFAULT 1,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (categoryID) REFERENCES sg.LQ_CSS_fnb_categories(categoryID)
);

CREATE TABLE sg.LQ_CSS_fnb_packages (
    packageID INT IDENTITY(1,1) PRIMARY KEY,
    packageName NVARCHAR(100) NOT NULL,
    description NVARCHAR(255),
    totalValue DECIMAL(18,2) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE sg.LQ_CSS_fnb_package_items (
    packageItemID INT IDENTITY(1,1) PRIMARY KEY,
    packageID INT NOT NULL,
    productID INT NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (packageID) REFERENCES sg.LQ_CSS_fnb_packages(packageID),
    FOREIGN KEY (productID) REFERENCES sg.LQ_CSS_fnb_products(productID)
);

CREATE TABLE sg.LQ_CSS_fnb_orders (
    orderID INT IDENTITY(1,1) PRIMARY KEY,
    clientID INT NOT NULL,
    status NVARCHAR(20) DEFAULT 'Pending',
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (clientID) REFERENCES sg.LQ_CSS_client_info(clientID)
);

CREATE TABLE sg.LQ_CSS_fnb_order_items (
    orderItemID INT IDENTITY(1,1) PRIMARY KEY,
    orderID INT NOT NULL,
    productID INT NOT NULL,
    quantity INT NOT NULL,
    size NVARCHAR(50),
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (orderID) REFERENCES sg.LQ_CSS_fnb_orders(orderID),
    FOREIGN KEY (productID) REFERENCES sg.LQ_CSS_fnb_products(productID)
);

-- =============================================
-- 🛒 Cart + Checkout Module
-- =============================================

CREATE TABLE sg.LQ_CSS_fnb_cart (
    cartID INT IDENTITY(1,1) PRIMARY KEY,
    clientID INT NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (clientID) REFERENCES sg.LQ_CSS_client_info(clientID)
);

CREATE TABLE sg.LQ_CSS_fnb_cart_items (
    cartItemID INT IDENTITY(1,1) PRIMARY KEY,
    cartID INT NOT NULL,
    productID INT NOT NULL,
    quantity INT NOT NULL,
    size NVARCHAR(50),
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (cartID) REFERENCES sg.LQ_CSS_fnb_cart(cartID),
    FOREIGN KEY (productID) REFERENCES sg.LQ_CSS_fnb_products(productID)
);

-- =============================================
-- 💳 Payment Transaction Log
-- =============================================
CREATE TABLE sg.LQ_CSS_payment_transactions (
    transactionID INT IDENTITY(1,1) PRIMARY KEY,
    clientID INT NOT NULL,
    orderID INT NULL,
    amount DECIMAL(18,2) NOT NULL,
    paymentType NVARCHAR(20) NOT NULL, -- 'Package' or 'Additional'
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (clientID) REFERENCES sg.LQ_CSS_client_info(clientID),
    FOREIGN KEY (orderID) REFERENCES sg.LQ_CSS_fnb_orders(orderID)
);

-- =============================================
-- 🧩 Stored Procedures
-- =============================================

-- Place Order (Direct)
CREATE PROCEDURE sg.LQ_CSS_fnb_place_order
    @clientID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @orderID INT;

    -- Create the order
    INSERT INTO sg.LQ_CSS_fnb_orders (clientID, status)
    VALUES (@clientID, 'Pending');

    SET @orderID = SCOPE_IDENTITY();

    -- Return the new orderID
    SELECT @orderID AS orderID;
END;
GO

-- Update Order Status
CREATE PROCEDURE sg.LQ_CSS_fnb_update_order_status
    @orderID INT,
    @status NVARCHAR(20)
AS
BEGIN
    UPDATE sg.LQ_CSS_fnb_orders
    SET status = @status,
        updatedAt = GETDATE()
    WHERE orderID = @orderID;
END;
GO

-- Add Item to Cart
CREATE PROCEDURE sg.LQ_CSS_fnb_cart_add_item
    @clientID INT,
    @productID INT,
    @quantity INT,
    @size NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @cartID INT;

    SELECT @cartID = cartID FROM sg.LQ_CSS_fnb_cart WHERE clientID = @clientID;

    IF @cartID IS NULL
    BEGIN
        INSERT INTO sg.LQ_CSS_fnb_cart (clientID) VALUES (@clientID);
        SET @cartID = SCOPE_IDENTITY();
    END;

    IF EXISTS (SELECT 1 FROM sg.LQ_CSS_fnb_cart_items WHERE cartID = @cartID AND productID = @productID AND size = @size)
        UPDATE sg.LQ_CSS_fnb_cart_items
        SET quantity = quantity + @quantity
        WHERE cartID = @cartID AND productID = @productID AND size = @size;
    ELSE
        INSERT INTO sg.LQ_CSS_fnb_cart_items (cartID, productID, quantity, size)
        VALUES (@cartID, @productID, @quantity, @size);
END;
GO

-- Remove Item from Cart
CREATE PROCEDURE sg.LQ_CSS_fnb_cart_remove_item
    @clientID INT,
    @productID INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM sg.LQ_CSS_fnb_cart_items
    WHERE cartID = (SELECT cartID FROM sg.LQ_CSS_fnb_cart WHERE clientID = @clientID)
      AND productID = @productID;
END;
GO

-- View Cart
CREATE PROCEDURE sg.LQ_CSS_fnb_cart_view
    @clientID INT
AS
BEGIN
    SELECT p.productName, p.price, i.quantity, i.size,
           (p.price * i.quantity) AS total
    FROM sg.LQ_CSS_fnb_cart_items i
    INNER JOIN sg.LQ_CSS_fnb_cart c ON i.cartID = c.cartID
    INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
    WHERE c.clientID = @clientID;
END;
GO

-- Checkout (Cart → Order + Deduct Balance + Log Transaction)
CREATE PROCEDURE sg.LQ_CSS_fnb_cart_checkout
    @clientID INT,
    @paymentType NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @cartID INT, @orderID INT, @totalAmount DECIMAL(18,2) = 0;

    SELECT @cartID = cartID FROM sg.LQ_CSS_fnb_cart WHERE clientID = @clientID;

    IF @cartID IS NULL
    BEGIN
        RAISERROR('No active cart found for this client.', 16, 1);
        RETURN;
    END;

    SELECT @totalAmount = SUM(p.price * i.quantity)
    FROM sg.LQ_CSS_fnb_cart_items i
    INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
    WHERE i.cartID = @cartID;

    -- Deduct balance
    IF @paymentType = 'Package'
        UPDATE sg.LQ_CSS_client_info
        SET packageBalance = packageBalance - @totalAmount
        WHERE clientID = @clientID;
    ELSE
        UPDATE sg.LQ_CSS_client_info
        SET additionalBalance = additionalBalance - @totalAmount
        WHERE clientID = @clientID;

    -- Create order
    INSERT INTO sg.LQ_CSS_fnb_orders (clientID, status)
    VALUES (@clientID, 'Pending');
    SET @orderID = SCOPE_IDENTITY();

    INSERT INTO sg.LQ_CSS_fnb_order_items (orderID, productID, quantity, size)
    SELECT @orderID, productID, quantity, size
    FROM sg.LQ_CSS_fnb_cart_items
    WHERE cartID = @cartID;

    -- Log payment
    INSERT INTO sg.LQ_CSS_payment_transactions (clientID, orderID, amount, paymentType)
    VALUES (@clientID, @orderID, @totalAmount, @paymentType);

    -- Clear cart
    DELETE FROM sg.LQ_CSS_fnb_cart_items WHERE cartID = @cartID;
    DELETE FROM sg.LQ_CSS_fnb_cart WHERE cartID = @cartID;

    SELECT @orderID AS orderID, @totalAmount AS totalAmount;
END;
GO

CREATE TABLE sg.LQ_CSS_staff_accounts (
    staffID INT IDENTITY(1,1) PRIMARY KEY,
    fullName NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    phone NVARCHAR(20),
    role NVARCHAR(50) NOT NULL DEFAULT 'staff',
    passwordHash NVARCHAR(255) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);
GO

CREATE PROCEDURE sg.LQ_CSS_staff_login
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT staffID, fullName, email, phone, role, passwordHash
    FROM sg.LQ_CSS_staff_accounts
    WHERE email = @Email;
END;
GO

CREATE TABLE sg.LQ_CSS_sessions_info (
    sessionID INT IDENTITY(1,1) PRIMARY KEY,
    clientID INT NOT NULL,
    userName NVARCHAR(150),
    pin NVARCHAR(10),
    qrDataUrl NVARCHAR(MAX),
    expiresAt DATETIME NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (clientID) REFERENCES sg.LQ_CSS_client_info(clientID)
);