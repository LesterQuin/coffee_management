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

// export const createPackage = async (pkg) => {
//   const pool = await poolPromise;
//   await pool.request()
//     .input("packageName", sql.NVarChar(100), pkg.packageName)
//     .input("description", sql.NVarChar(255), pkg.description ?? null)
//     .input("totalValue", sql.Decimal(18,2), pkg.totalValue)
//     .query(`
//       INSERT INTO sg.LQ_CSS_fnb_packages 
//       (packageName, description, totalValue) 
//       VALUES (@packageName,@description,@totalValue)
//     `);
//   return true;
// };
// export const createPackage = async (data) => {
//   const pool = await poolPromise;
//   const result = await pool.request()
//     .input("packageName", sql.NVarChar, data.packageName)
//     .input("description", sql.NVarChar, data.description ?? null)
//     .query(`
//       INSERT INTO sg.LQ_CSS_fnb_packages (packageName, description, totalValue)
//       OUTPUT INSERTED.packageID
//       VALUES (@packageName, @description, 0)
//     `);

//   return result.recordset[0].packageID;
// };
export const createPackage = async (data) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("packageName", sql.NVarChar(100), data.packageName)
    .input("description", sql.NVarChar(255), data.description ?? null)
    .input("totalValue", sql.Decimal(18,2), data.totalValue ?? 0)
    .query(`
      INSERT INTO sg.LQ_CSS_fnb_packages (packageName, description, totalValue)
      OUTPUT INSERTED.packageID, INSERTED.totalValue
      VALUES (@packageName, @description, @totalValue)
    `);

  // return both ID and the stored totalValue
  const row = result.recordset[0];
  return { packageID: row.packageID, totalValue: row.totalValue };
};

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

export const deletePackage = async (packageID) => {
  const pool = await poolPromise;
  await pool.request()
    .input("packageID", sql.Int, packageID)
    .query("DELETE FROM sg.LQ_CSS_fnb_packages WHERE packageID=@packageID");
};

// -------------------- Package Items --------------------
// export const getPackageItems = async (packageID) => {
//   const pool = await poolPromise;
//   const res = await pool.request()
//     .input("packageID", sql.Int, packageID)
//     .query(`
//       SELECT i.packageItemID, i.packageID, i.productID, p.productName, p.price, i.quantity
//       FROM sg.LQ_CSS_fnb_package_items i
//       INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
//       WHERE i.packageID = @packageID
//     `);

//   const items = res.recordset || [];

//   const pkgRes = await pool.request()
//     .input("packageID", sql.Int, packageID)
//     .query("SELECT totalValue FROM sg.LQ_CSS_fnb_packages WHERE packageID=@packageID");

//   if (!pkgRes.recordset.length) return { items: [], remainingValue: 0 };

//   const totalValue = pkgRes.recordset[0].totalValue;
//   const totalUsed = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
//   const remainingValue = totalValue - totalUsed;

//   return { items, remainingValue };
// };

export const getPackageItems = async (packageID) => {
  const pool = await poolPromise;

  const res = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query(`
      SELECT 
        i.packageItemID,
        i.packageID,
        i.productID,
        i.quantity,
        p.productName,
        p.price,
        p.sizeId,
        s.size,
        p.categoryID,
        c.categoryName
      FROM sg.LQ_CSS_fnb_package_items i
      INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
      LEFT JOIN sg.LQ_CSS_product_sizes s ON p.sizeId = s.sizeId
      LEFT JOIN sg.LQ_CSS_fnb_categories c ON p.categoryID = c.categoryID
      WHERE i.packageID = @packageID
      ORDER BY i.packageItemID
    `);

  const itemsRaw = res.recordset || [];

  // get package totalValue
  const pkgRes = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query("SELECT totalValue FROM sg.LQ_CSS_fnb_packages WHERE packageID=@packageID");

  if (!pkgRes.recordset.length) {
    return { items: [], remainingValue: 0, exceeded: false, exceededValue: 0 };
  }

  const totalValue = Number(pkgRes.recordset[0].totalValue) || 0;

  // compute total used
  const totalUsed = itemsRaw.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity)), 0);
  const remainingValue = Number((totalValue - totalUsed).toFixed(2));
  const exceeded = remainingValue < 0;
  const exceededValue = exceeded ? Math.abs(remainingValue) : 0;

  const items = itemsRaw.map(item => ({
    packageItemID: item.packageItemID,
    packageID: item.packageID,
    quantity: item.quantity,
    productInfo: {
      productID: item.productID,
      productName: item.productName,
      price: Number(item.price),
      sizeInfo: {
        size: item.size ?? null,
        sizeId: item.sizeId ?? null
      },
      categoryInfo: {
        categoryId: item.categoryID,
        categoryName: item.categoryName
      }
    }
  }));

  return { items, remainingValue, exceeded, exceededValue };
};

// export const addPackageItem = async (packageID, productID, quantity) => {
//   const pool = await poolPromise;
//   await pool.request()
//     .input("packageID", sql.Int, packageID)
//     .input("productID", sql.Int, productID)
//     .input("quantity", sql.Int, quantity)
//     .query(`
//       INSERT INTO sg.LQ_CSS_fnb_package_items 
//       (packageID, productID, quantity) 
//       VALUES (@packageID, @productID, @quantity)
//     `);
// };

// export const addPackageItem = async (packageID, productID, quantity) => {
//   const pool = await poolPromise;
//   const transaction = pool.transaction();

//   try {
//     await transaction.begin();

//     // Insert item
//     await transaction.request()
//       .input("packageID", sql.Int, packageID)
//       .input("productID", sql.Int, productID)
//       .input("quantity", sql.Int, quantity)
//       .query(`
//         INSERT INTO sg.LQ_CSS_fnb_package_items (packageID, productID, quantity)
//         VALUES (@packageID, @productID, @quantity)
//       `);

//     // Subtract price * qty from package totalValue
//     await transaction.request()
//       .input("packageID", sql.Int, packageID)
//       .input("productID", sql.Int, productID)
//       .input("quantity", sql.Int, quantity)
//       .query(`
//         UPDATE sg.LQ_CSS_fnb_packages
//         SET totalValue = totalValue - (p.price * @quantity)
//         FROM sg.LQ_CSS_fnb_packages pkg
//         JOIN sg.LQ_CSS_fnb_products p ON p.productID = @productID
//         WHERE pkg.packageID = @packageID
//       `);

//     await transaction.commit();
//     return true;
//   } catch (err) {
//     await transaction.rollback();
//     throw err;
//   }
// };

export const addPackageItems = async (packageID, items) => {
  const pool = await poolPromise;
  const transaction = pool.transaction();

  try {
    await transaction.begin();

    for (const item of items) {
      const { productID, quantity } = item;

      if (!productID || !quantity) continue;

      // Insert item
      await transaction.request()
        .input("packageID", sql.Int, packageID)
        .input("productID", sql.Int, productID)
        .input("quantity", sql.Int, quantity)
        .query(`
          INSERT INTO sg.LQ_CSS_fnb_package_items (packageID, productID, quantity)
          VALUES (@packageID, @productID, @quantity)
        `);

      // Update package totalValue
      await transaction.request()
        .input("packageID", sql.Int, packageID)
        .input("productID", sql.Int, productID)
        .input("quantity", sql.Int, quantity)
        .query(`
          UPDATE sg.LQ_CSS_fnb_packages
          SET totalValue = totalValue - (p.price * @quantity)
          FROM sg.LQ_CSS_fnb_packages pkg
          JOIN sg.LQ_CSS_fnb_products p ON p.productID = @productID
          WHERE pkg.packageID = @packageID
        `);
    }

    await transaction.commit();
    return true;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};


export const deletePackageItem = async (packageItemID) => {
  const pool = await poolPromise;
  const transaction = pool.transaction();

  try {
    await transaction.begin();

    // fetch item details first
    const itemRes = await transaction.request()
      .input("packageItemID", sql.Int, packageItemID)
      .query(`
        SELECT packageItemID, packageID, productID, quantity
        FROM sg.LQ_CSS_fnb_package_items
        WHERE packageItemID=@packageItemID
      `);

    if (!itemRes.recordset.length) {
      await transaction.rollback();
      return false;
    }

    const item = itemRes.recordset[0];

    // delete the item
    await transaction.request()
      .input("packageItemID", sql.Int, packageItemID)
      .query("DELETE FROM sg.LQ_CSS_fnb_package_items WHERE packageItemID=@packageItemID");

    // add back (price * qty) to package totalValue
    await transaction.request()
      .input("packageID", sql.Int, item.packageID)
      .input("productID", sql.Int, item.productID)
      .input("quantity", sql.Int, item.quantity)
      .query(`
        UPDATE sg.LQ_CSS_fnb_packages
        SET totalValue = totalValue + (p.price * @quantity)
        FROM sg.LQ_CSS_fnb_packages pkg
        JOIN sg.LQ_CSS_fnb_products p ON p.productID = @productID
        WHERE pkg.packageID = @packageID
      `);

    await transaction.commit();
    return true;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
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

// export const updatePackageItem = async (packageID, itemId, quantity) => {
//   const pool = await poolPromise;
//   const result = await pool.request()
//     .input("quantity", sql.Int, quantity)
//     .input("packageItemID", sql.Int, itemId)
//     .input("packageID", sql.Int, packageID)
//     .query(`
//       UPDATE sg.LQ_CSS_fnb_package_items
//       SET quantity = @quantity
//       WHERE packageItemID = @packageItemID AND packageID = @packageID
//     `);

//   return result.rowsAffected[0] > 0;
// };

export const updatePackageItem = async (packageID, packageItemID, newQuantity) => {
  const pool = await poolPromise;
  const transaction = pool.transaction();

  try {
    await transaction.begin();

    // get current item
    const itemRes = await transaction.request()
      .input("packageItemID", sql.Int, packageItemID)
      .input("packageID", sql.Int, packageID)
      .query(`
        SELECT packageItemID, productID, quantity
        FROM sg.LQ_CSS_fnb_package_items
        WHERE packageItemID=@packageItemID AND packageID=@packageID
      `);

    if (!itemRes.recordset.length) {
      await transaction.rollback();
      return false; // not found
    }

    const current = itemRes.recordset[0];
    const oldQty = Number(current.quantity);
    const delta = Number(newQuantity) - oldQty;

    // Update item quantity
    await transaction.request()
      .input("packageItemID", sql.Int, packageItemID)
      .input("packageID", sql.Int, packageID)
      .input("quantity", sql.Int, newQuantity)
      .query(`
        UPDATE sg.LQ_CSS_fnb_package_items
        SET quantity = @quantity
        WHERE packageItemID = @packageItemID AND packageID = @packageID
      `);

    // If delta !== 0 adjust package totalValue by (price * delta)
    if (delta !== 0) {
      await transaction.request()
        .input("packageID", sql.Int, packageID)
        .input("productID", sql.Int, current.productID)
        .input("delta", sql.Int, delta)
        .query(`
          UPDATE pkg
          SET totalValue = totalValue - (p.price * @delta)
          FROM sg.LQ_CSS_fnb_packages pkg
          JOIN sg.LQ_CSS_fnb_products p ON p.productID = @productID
          WHERE pkg.packageID = @packageID
        `);
    }

    await transaction.commit();
    return true;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// -------------------- Validation: check package total --------------------
export const canAddPackageItem = async (packageID, productID, quantity) => {
  const pool = await poolPromise;

  // Get package
  const pkgRes = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query("SELECT totalValue FROM sg.LQ_CSS_fnb_packages WHERE packageID=@packageID");
  if (!pkgRes.recordset.length) throw new Error("Package not found");
  const totalValue = pkgRes.recordset[0].totalValue;

  // Get current items
  const itemsRes = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query(`
      SELECT i.quantity, p.price
      FROM sg.LQ_CSS_fnb_package_items i
      INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
      WHERE i.packageID=@packageID
    `);
  const packageItems = itemsRes.recordset;

  // Get product price
  const productRes = await pool.request()
    .input("productID", sql.Int, productID)
    .query("SELECT price FROM sg.LQ_CSS_fnb_products WHERE productID=@productID");
  if (!productRes.recordset.length) throw new Error("Product not found");
  const productPrice = productRes.recordset[0].price;

  const totalUsed = packageItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const newTotal = totalUsed + (productPrice * quantity);

  return {
    canAdd: newTotal <= totalValue,
    remainingValue: totalValue - totalUsed,
    extraCharge: newTotal > totalValue ? newTotal - totalValue : 0
  };
};

export const canUpdatePackageItem = async (packageID, packageItemID, newQuantity) => {
  const pool = await poolPromise;

  // Get package total
  const pkgRes = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query("SELECT totalValue FROM sg.LQ_CSS_fnb_packages WHERE packageID=@packageID");
  if (!pkgRes.recordset.length) throw new Error("Package not found");
  const totalValue = pkgRes.recordset[0].totalValue;

  // Get all items and prices
  const itemsRes = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query(`
      SELECT i.packageItemID, i.quantity, p.price
      FROM sg.LQ_CSS_fnb_package_items i
      INNER JOIN sg.LQ_CSS_fnb_products p ON i.productID = p.productID
      WHERE i.packageID=@packageID
    `);

  let totalUsed = 0;
  for (const item of itemsRes.recordset) {
    if (item.packageItemID === parseInt(packageItemID)) {
      totalUsed += item.price * newQuantity;
    } else {
      totalUsed += item.price * item.quantity;
    }
  }

  return totalUsed <= totalValue;
};
