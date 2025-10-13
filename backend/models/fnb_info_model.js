//import mssql from "mssql";
import { poolPromise, sql } from "../config/db_config.js";

//-------------------- Categories --------------------
export const getAllCategories = async () => {
  const pool = await poolPromise;
  const res = await pool.request().query(
    "SELECT * FROM sg.LQ_CSS_fnb_categories ORDER BY categoryName"
  );
  return res.recordset;
};

// Create a new category
export const createCategory = async (category) => {
  const pool = await poolPromise;
  await pool.request()
    .input("categoryName", sql.NVarChar(100), category.categoryName)
    .input("description", sql.NVarChar(255), category.description ?? null)
    .input("image", sql.NVarChar(255), category.image ?? null)
    .query("INSERT INTO sg.LQ_CSS_fnb_categories (categoryName, description, image) VALUES (@categoryName,@description,@image)");
  return true;
};
// Update a category
export const updateCategory = async (categoryID, category) => {
  const pool = await poolPromise;
  await pool.request()
  .input("categoryID", sql.Int, categoryID)
  .input("categoryName", sql.NVarChar(100), category.categoryName)
  .input("description", sql.NVarChar(255), category.description ?? null)
  .input("image", sql.NVarChar(255), category.image ?? null)
  .query(`
    UPDATE sg.LQ_CSS_fnb_categories
    SET categoryName=@categoryName, description=@description, image=@image
    WHERE categoryID=@categoryID
    `);
  return true;
};
// Delete a category
export const deleteCategory = async (categoryID) => {
  const pool = await poolPromise;
  await pool.request()
    .input("categoryID", sql.Int, categoryID)
    .query("DELETE FROM sg.LQ_CSS_fnb_categories WHERE categoryID=@categoryID");
};

// -------------------- Products --------------------
export const getAllProducts = async () => {
  const pool = await poolPromise;
  const res = await pool.request().query(`
    SELECT p.productID, p.productName, p.description, p.price, p.size, p.image, p.isAvailable,
           c.categoryName
    FROM sg.LQ_CSS_fnb_products p
    INNER JOIN sg.LQ_CSS_fnb_categories c ON p.categoryID = c.categoryID
  `);
  return res.recordset;
};

// Create a new product
export const createProduct = async (product) => {
  const pool = await poolPromise;
  await pool.request()
    .input("categoryID", sql.Int, product.categoryID)
    .input("productName", sql.NVarChar(150), product.productName)
    .input("description", sql.NVarChar(255), product.description ?? null)
    .input("price", sql.Decimal(18,2), product.price)
    .input("size", sql.NVarChar(50), product.size ?? null)
    .input("image", sql.NVarChar(255), product.image ?? null)
    .input("isAvailable", sql.Bit, product.isAvailable ?? 1)
    .query(`
      INSERT INTO sg.LQ_CSS_fnb_products
      (categoryID, productName, description, price, size, image, isAvailable)
      VALUES (@categoryID,@productName,@description,@price,@size,@image,@isAvailable)
    `);
  return true;
};
// update a product
export const updateProduct = async (productID, product) => {
  const pool = await poolPromise;
  await pool.request()
    .input("productID", sql.Int, productID)
    .input("categoryID", sql.Int, product.categoryID)
    .input("productName", sql.NVarChar(150), product.productName)
    .input("description", sql.NVarChar(255), product.description ?? null)
    .input("price", sql.Decimal(18,2), product.price)
    .input("size", sql.NVarChar(50), product.size ?? null)
    .input("image", sql.NVarChar(255), product.image ?? null)
    .query(`
      UPDATE sg.LQ_CSS_fnb_products
      SET categoryID=@categoryID, productName=@productName, description=@description,
          price=@price, size=@size, image=@image, isAvailable=@isAvailable
      WHERE productID=@productID
  `);
};
// delete a product
export const deleteProduct = async (productID) => {
  const pool = await poolPromise;
  await pool.request()
    .input("productID", sql.Int, productID)
    .query("DELETE FROM sg.LQ_CSS_fnb_products WHERE productID=@productID");
};

// -------------------- Packages --------------------
export const getAllPackages = async () => {
  const pool = await poolPromise;
  const res = await pool.request()
    .query("SELECT * FROM sg.LQ_CSS_fnb_packages ORDER BY createdAt DESC");
  return res.recordset;
};
// get package ID
export const getPackageByID = async (packageID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query("SELECT * FROM sg.LQ_CSS_fnb_packages WHERE packageID=@packageID");
  return res.recordset[0];
};

// Create a new package
export const createPackage = async (pkg) => {
  const pool = await poolPromise;
  await pool.request()
    .input("packageName", sql.NVarChar(100), pkg.packageName)
    .input("description", sql.NVarChar(255), pkg.description ?? null)
    .input("totalValue", sql.Decimal(18,2), pkg.totalValue)
    .query("INSERT INTO sg.LQ_CSS_fnb_packages (packageName, description, totalValue) VALUES (@packageName,@description,@totalValue)");
  return true;
};
// Update a package
export const updatePackage = async (packageID, pkg) => {
  const pool = await poolPromise;
  await pool.request()
    .input("packageID", sql.Int, packageID)
    .input("packageName", sql.NVarChar(100), pkg.packageName)
    .input("description", sql.NVarChar(255), pkg.description ?? null)
    .input("totalValue", sql.Decimal(18,2), pkg.totalValue)
    .query(`
      UPDATE sg.LQ_CSS_fnb_packages
      SET packageName=@packageName, description=@description, totalValue=@totalValue
      WHERE packageID=@packageID
  `);
};
// Delete a package
export const deletePackage = async (packageID) => {
  const pool = await poolPromise;
  await pool.request()
    .input("packageID", sql.Int, packageID)
    .query("DELETE FROM sg.LQ_CSS_fnb_packages WHERE packageID=@packageID");
};

// -------------------- Package Items --------------------
// Get items in a package
export const getPackageItems = async (packageID) => {
  const pool = await poolPromise;

  // Get package items with product prices
  const res = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query(`
      SELECT i.packageItemID, i.packageID, i.productID, p.productName, p.price, i.quantity
      FROM [DHUB].[sg].[LQ_CSS_fnb_package_items] i
      INNER JOIN [DHUB].[sg].[LQ_CSS_fnb_products] p
        ON i.productID = p.productID
      WHERE i.packageID = @packageID
    `);

  const items = res.recordset || [];

  // Get totalValue of the package
  const pkgRes = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query(`SELECT totalValue FROM sg.LQ_CSS_fnb_packages WHERE packageID = @packageID`);

  if (!pkgRes.recordset.length) {
    // Package not found — return empty items and zero remaining
    return { items: [], remainingValue: 0 };
  }

  const totalValue = pkgRes.recordset[0].totalValue;

  // Calculate total value of items in package
  const totalUsed = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const remainingValue = totalValue - totalUsed;

  return { items, remainingValue };
};


// Create Package item
export const addPackageItem = async (packageID, productID, quantity) => {
  const pool = await poolPromise;
  await pool.request()
    .input("packageID", sql.Int, packageID)
    .input("productID", sql.Int, productID)
    .input("quantity", sql.Int, quantity)
    .query(`
      INSERT INTO [DHUB].[sg].[LQ_CSS_fnb_package_items] 
        (packageID, productID, quantity)
      VALUES (@packageID, @productID, @quantity)
    `);
};

// Delete item from package
export const deletePackageItem = async (packageItemID) => {
  const pool = await poolPromise;
  await pool.request()
    .input("packageItemID", sql.Int, packageItemID)
    .query(`
      DELETE FROM [DHUB].[sg].[LQ_CSS_fnb_package_items]
      WHERE packageItemID = @packageItemID
    `);
};

// -------------------- Validation: check package total --------------------
export const canAddPackageItem = async (packageID, productID, quantity) => {
  const pool = await poolPromise;

  const pkg = await getPackageByID(packageID);
  if (!pkg) throw new Error("Package not found");

  const { items: packageItems } = await getPackageItems(packageID);

  const productRes = await pool.request()
    .input("productID", sql.Int, productID)
    .query("SELECT price FROM sg.LQ_CSS_fnb_products WHERE productID=@productID");

  if (productRes.recordset.length === 0) throw new Error("Product not found");

  const productPrice = productRes.recordset[0].price;

  const currentTotal = packageItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const newTotal = currentTotal + (productPrice * quantity);

  return newTotal <= pkg.totalValue;
};
