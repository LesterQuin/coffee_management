import { poolPromise, sql } from "../config/db_config.js";

// -------------------- Categories --------------------
export const getAllCategories = async () => {
  const pool = await poolPromise;
  const res = await pool.request().query(
    "SELECT * FROM sg.LQ_CSS_fnb_categories ORDER BY categoryName"
  );
  return res.recordset;
};

export const createCategory = async (category) => {
  const pool = await poolPromise;
  await pool.request()
    .input("categoryName", sql.NVarChar(100), category.categoryName)
    .input("description", sql.NVarChar(255), category.description ?? null)
    .input("image", sql.NVarChar(255), category.image ?? null)
    .query(`
      INSERT INTO sg.LQ_CSS_fnb_categories 
      (categoryName, description, image) 
      VALUES (@categoryName,@description,@image)
    `);
  return true;
};

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

export const deleteCategory = async (categoryID) => {
  const pool = await poolPromise;
  await pool.request()
    .input("categoryID", sql.Int, categoryID)
    .query("DELETE FROM sg.LQ_CSS_fnb_categories WHERE categoryID=@categoryID");
};

// -------------------- Products --------------------
// export const getAllProducts = async () => {
//   const pool = await poolPromise;
//   const res = await pool.request().query(`
//     SELECT p.productID, p.productName, p.description, p.price, p.sizeId, p.image, p.isAvailable,
//            c.categoryName
//     FROM sg.LQ_CSS_fnb_products p
//     INNER JOIN sg.LQ_CSS_fnb_categories c ON p.categoryID = c.categoryID
//     LEFT JOIN sg.LQ_CSS_fnb_product_size s ON p.sizeId = s.sizeId
//   `);
//    const formatted = res.recordset.map(item => ({
//     productID: item.productID,
//     productName: item.productName,
//     description: item.description,
//     price: item.price,
//     sizeInfo: {
//       size: item.size,
//       sizeId: item.sizeId
//     },
//     image: item.image,
//     isAvailable: item.isAvailable,
//     categoryInfo: {
//       categoryName: item.categoryName,
//       categoryId: item.categoryID
//     }
//   }));
//   return res.recordset;
// };

export const getAllProducts = async () => {
  const pool = await poolPromise;
  const res = await pool.request().query(`
    SELECT 
      p.productID, p.productName, p.description, p.price, p.sizeId, s.size, p.image, p.isAvailable, p.categoryID, c.categoryName
    FROM sg.LQ_CSS_fnb_products p
    INNER JOIN sg.LQ_CSS_fnb_categories c ON p.categoryID = c.categoryID
    LEFT JOIN sg.LQ_CSS_product_sizes s ON p.sizeId = s.sizeId
  `);


  const formatted = res.recordset.map(item => ({
    productID: item.productID,
    productName: item.productName,
    description: item.description,
    price: item.price,
    sizeInfo: {
      size: item.size,
      sizeId: item.sizeId
    },
    image: item.image,
    isAvailable: item.isAvailable,
    categoryInfo: {
      categoryName: item.categoryName,
      categoryId: item.categoryID
    }
  }));

  return formatted;
};

export const getProductByCategory = async (categoryID) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("categoryID", sql.Int, categoryID)
    .query(`
        SELECT 
        p.productID, p.productName, p.description, p.price, 
        p.sizeId, s.size, p.image, p.isAvailable, 
        c.categoryID, c.categoryName
      FROM sg.LQ_CSS_fnb_products p
      INNER JOIN sg.LQ_CSS_fnb_categories c ON p.categoryID = c.categoryID
      LEFT JOIN sg.LQ_CSS_product_sizes s ON p.sizeId = s.sizeId
      WHERE p.categoryID = @categoryID
      ORDER BY p.productName
  `);

  const formatted = result.recordset.map(item => ({
    productID: item.productID,
    productName: item.productName,
    description: item.description,
    price: item.price,
    sizeInfo: {
      size: item.size,
      sizeId: item.sizeId
    },
    image: item.image,
    isAvailable: item.isAvailable,
    categoryInfo: {
      categoryName: item.categoryName,
      categoryId: item.categoryID
    }
  }));

  return formatted;
}

export const createProduct = async (product) => {
  const pool = await poolPromise;
  await pool.request()
    .input("categoryID", sql.Int, product.categoryID)
    .input("productName", sql.NVarChar(150), product.productName)
    .input("description", sql.NVarChar(255), product.description ?? null)
    .input("price", sql.Decimal(18,2), product.price)
    .input("sizeId", sql.Int, product.sizeId ?? null)
    .input("image", sql.NVarChar(255), product.image ?? null)
    .input("isAvailable", sql.Bit, product.isAvailable ?? 1)
    .query(`
      INSERT INTO sg.LQ_CSS_fnb_products
      (categoryID, productName, description, price, sizeId, image, isAvailable)
      VALUES (@categoryID, @productName, @description, @price, @sizeId, @image, @isAvailable)
    `);
  return true;
};

export const updateProduct = async (productID, product) => {
  const pool = await poolPromise;
  const request = pool.request().input("productID", sql.Int, productID);

  // Allowed fields for update
  const fieldsMap = {
    categoryID: sql.Int,
    productName: sql.NVarChar(150),
    description: sql.NVarChar(255),
    price: sql.Decimal(18, 2),
    sizeId: sql.Int,
    isAvailable: sql.Bit,
    image: sql.NVarChar(255),
  };

  const fields = [];

  for (const [key, type] of Object.entries(fieldsMap)) {
    if (product[key] !== undefined) {
      // Convert decimals to numbers, and ensure integers for sizeId
      let value = product[key];
      if (type === sql.Decimal(18, 2)) value = Number(value);
      if (key === "sizeId") value = value !== null ? Number(value) : null;
      fields.push(`${key} = @${key}`);
      request.input(key, type, value);
    }
  }

  if (fields.length === 0) {
    return false; // nothing to update
  }

  fields.push("updatedAt = GETDATE()");

  const query = `
    UPDATE sg.LQ_CSS_fnb_products
    SET ${fields.join(", ")}
    WHERE productID = @productID
  `;

  try {
    const result = await request.query(query);
    return result.rowsAffected[0] > 0;
  } catch (err) {
    console.error("DB update error:", err);
    throw err;
  }
};

export const deleteProduct = async (productID) => {
  const pool = await poolPromise;
  await pool.request()
    .input("productID", sql.Int, productID)
    .query("DELETE FROM sg.LQ_CSS_fnb_products WHERE productID=@productID");
};

// -------------------- Packages --------------------
export const getAllPackages = async () => {
  const pool = await poolPromise;
  const res = await pool.request().query(
    "SELECT * FROM sg.LQ_CSS_fnb_packages ORDER BY createdAt DESC"
  );
  return res.recordset;
};

export const getPackageByID = async (packageID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query("SELECT * FROM sg.LQ_CSS_fnb_packages WHERE packageID=@packageID");
  return res.recordset[0];
};

export const createPackage = async (pkg) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("packageName", sql.NVarChar(100), pkg.packageName)
    .input("description", sql.NVarChar(255), pkg.description ?? null)
    .input("totalValue", sql.Decimal(18,2), pkg.totalValue)
    .input("quantity", sql.Int, pkg.quantity)
    .query(`
      INSERT INTO sg.LQ_CSS_fnb_packages 
      (packageName, description, totalValue, quantity) 
      VALUES (@packageName,@description,@totalValue,@quantity);
      SELECT SCOPE_IDENTITY() AS packageID;
    `);

  return res.recordset[0].packageID;
};

export const updatePackage = async (packageID, pkg) => {
  const pool = await poolPromise;
  await pool.request()
    .input("packageID", sql.Int, packageID)
    .input("packageName", sql.NVarChar(100), pkg.packageName)
    .input("description", sql.NVarChar(255), pkg.description ?? null)
    .input("totalValue", sql.Decimal(18,2), pkg.totalValue)
    .input("quantity", sql.Int, pkg.quantity)
    .query(`
      UPDATE sg.LQ_CSS_fnb_packages
      SET packageName=@packageName, description=@description, 
      totalValue=@totalValue, quantity=@quantity, updatedAt=GETDATE()
      WHERE packageID=@packageID
    `);
};

export const deletePackage = async (packageID) => {
  const pool = await poolPromise;
  await pool.request()
    .input("packageID", sql.Int, packageID)
    .query("DELETE FROM sg.LQ_CSS_fnb_packages WHERE packageID=@packageID");
};

// -------------------- Package Items --------------------
export const getPackageItems = async (packageID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query(`
      SELECT 
        i.packageItemID, i.packageID, i.productID, p.productName, p.price, i.quantity,
        p.sizeId, s.size , p.categoryID, c.categoryName  
      FROM sg.LQ_CSS_fnb_package_items i
      INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
      LEFT JOIN sg.LQ_CSS_product_sizes s ON p.sizeId = s.sizeId
      LEFT JOIN sg.LQ_CSS_fnb_categories c ON p.categoryID = c.categoryID
      WHERE i.packageID = @packageID
    `);

  // Return only items (no remainingValue)
  return res.recordset || [];
};

export const addPackageItem = async (packageID, productID) => {
  const pool = await poolPromise;

  // Check package exists
  const pkgRes = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query("SELECT quantity FROM sg.LQ_CSS_fnb_packages WHERE packageID=@packageID");

  if (!pkgRes.recordset.length) throw new Error("Package not found");

  const packageQty = Number(pkgRes.recordset[0].quantity);

  // Check if product already exists in package
  const existingRes = await pool.request()
    .input("packageID", sql.Int, packageID)
    .input("productID", sql.Int, productID)
    .query("SELECT packageItemID FROM sg.LQ_CSS_fnb_package_items WHERE packageID=@packageID AND productID=@productID");

  if (existingRes.recordset.length > 0) {
    return { merged: true, packageItemID: existingRes.recordset[0].packageItemID };
  } else {
    const insertRes = await pool.request()
      .input("packageID", sql.Int, packageID)
      .input("productID", sql.Int, productID)
      .input("quantity", sql.Int, packageQty)  // <-- use package's quantity
      .query(`
        INSERT INTO sg.LQ_CSS_fnb_package_items (packageID, productID, quantity)
        VALUES (@packageID, @productID, @quantity);
        SELECT SCOPE_IDENTITY() AS packageItemID;
      `);

    const packageItemID = insertRes.recordset?.[0]?.packageItemID || null;
    return { merged: false, packageItemID };
  }
};

export const deletePackageItem = async (packageItemID) => {
  const pool = await poolPromise;
  await pool.request()
    .input("packageItemID", sql.Int, packageItemID)
    .query("DELETE FROM sg.LQ_CSS_fnb_package_items WHERE packageItemID=@packageItemID");
};

export const deleteAllPackageItems = async (packageID) => {
  const pool = await poolPromise;
  await pool.request()
    .input("packageID", sql.Int, packageID)
    .query("DELETE FROM sg.LQ_CSS_fnb_package_items WHERE packageID=@packageID");
};

export const getPackageItemById = async (itemId) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("packageItemID", sql.Int, itemId)
    .query("SELECT * FROM sg.LQ_CSS_fnb_package_items WHERE packageItemID=@packageItemID");
  return res.recordset[0];
};

export const updatePackageItem = async (packageID, itemId, quantity) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("quantity", sql.Int, quantity)
    .input("packageItemID", sql.Int, itemId)
    .input("packageID", sql.Int, packageID)
    .query(`
      UPDATE sg.LQ_CSS_fnb_package_items
      SET quantity = @quantity
      WHERE packageItemID = @packageItemID AND packageID = @packageID
    `);

  return result.rowsAffected[0] > 0;
};

// -------------------- Validation: check package total --------------------
export const canAddPackageItem = async (packageID, addQuantity) => {
  const pool = await poolPromise;

  const pkgRes = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query("SELECT quantity FROM sg.LQ_CSS_fnb_packages WHERE packageID=@packageID");

  if (!pkgRes.recordset.length) throw new Error("Package not found");

  const packageQtyLimit = Number(pkgRes.recordset[0].quantity || 0);

  const totalRes = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query("SELECT ISNULL(SUM(quantity),0) AS totalQty FROM sg.LQ_CSS_fnb_package_items WHERE packageID=@packageID");

  const currentTotal = Number(totalRes.recordset[0].totalQty || 0);
  const newTotal = currentTotal + Number(addQuantity || 0);

  return {
    canAdd: newTotal <= packageQtyLimit,
    packageQtyLimit,
    currentTotal,
    newTotal
  };
};

export const consumePackageItem = async (packageID, productID, consumeQty) => {
  const pool = await poolPromise;

  // Get package quantity limit
  const pkgRes = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query("SELECT quantity FROM sg.LQ_CSS_fnb_packages WHERE packageID=@packageID");
  if (!pkgRes.recordset.length) throw new Error("Package not found");

  const packageQtyLimit = Number(pkgRes.recordset[0].quantity);

  // Current total consumed quantity
  const totalRes = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query("SELECT ISNULL(SUM(quantity),0) AS totalQty FROM sg.LQ_CSS_fnb_package_items WHERE packageID=@packageID");

  const currentTotal = Number(totalRes.recordset[0].totalQty || 0);
  const newTotal = currentTotal + Number(consumeQty);

  if (newTotal > packageQtyLimit) {
    throw new Error("Not enough quantity in package");
  }

  // Increase the quantity of the specific product
  const existingRes = await pool.request()
    .input("packageID", sql.Int, packageID)
    .input("productID", sql.Int, productID)
    .query("SELECT packageItemID, quantity FROM sg.LQ_CSS_fnb_package_items WHERE packageID=@packageID AND productID=@productID");

  if (!existingRes.recordset.length) throw new Error("Product not found in package");

  const packageItemID = existingRes.recordset[0].packageItemID;
  const updatedQty = existingRes.recordset[0].quantity + Number(consumeQty);

  await pool.request()
    .input("packageItemID", sql.Int, packageItemID)
    .input("quantity", sql.Int, updatedQty)
    .query("UPDATE sg.LQ_CSS_fnb_package_items SET quantity=@quantity WHERE packageItemID=@packageItemID");

  return { packageItemID, quantity: updatedQty };
};

export const addPackageItemQuantity = async (packageID, productID, quantity) => {
  const canAdd = await canAddPackageItem(packageID, quantity);
  if (!canAdd.canAdd) throw new Error(`Cannot add ${quantity} items: exceeds package total quantity`);

  const pool = await poolPromise;

  // Check if product already exists in package
  const existing = await pool.request()
    .input("packageID", sql.Int, packageID)
    .input("productID", sql.Int, productID)
    .query("SELECT packageItemID, quantity FROM sg.LQ_CSS_fnb_package_items WHERE packageID=@packageID AND productID=@productID");

  if (!existing.recordset.length) throw new Error("Product not found in package");

  const newQty = Number(existing.recordset[0].quantity || 0) + Number(quantity);

  await pool.request()
    .input("quantity", sql.Int, newQty)
    .input("packageItemID", sql.Int, existing.recordset[0].packageItemID)
    .query("UPDATE sg.LQ_CSS_fnb_package_items SET quantity=@quantity WHERE packageItemID=@packageItemID");

  return { packageItemID: existing.recordset[0].packageItemID, quantity: newQty };
};


export const canUpdatePackageItem = async (packageID, packageItemID, newQuantity) => {
  const pool = await poolPromise;

  // Get package quantity limit
  const pkgRes = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query("SELECT quantity FROM sg.LQ_CSS_fnb_packages WHERE packageID=@packageID");

  if (!pkgRes.recordset.length) throw new Error("Package not found");
  const packageQtyLimit = Number(pkgRes.recordset[0].quantity || 0);

  // Get all items and compute total with replaced qty for the target item
  const itemsRes = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query(`
      SELECT packageItemID, quantity
      FROM sg.LQ_CSS_fnb_package_items
      WHERE packageID = @packageID
    `);

  let totalQty = 0;
  for (const it of itemsRes.recordset) {
    if (Number(it.packageItemID) === Number(packageItemID)) {
      totalQty += Number(newQuantity || 0);
    } else {
      totalQty += Number(it.quantity || 0);
    }
  }

  return {
    canUpdate: totalQty <= packageQtyLimit,
    packageQtyLimit,
    totalQty
  };
};

