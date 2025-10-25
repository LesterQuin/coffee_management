// models/clients_info_model.js
import { poolPromise, sql } from "../config/db_config.js";
import QRCode from "qrcode";
import { createSession } from "./sessions_info_model.js";
import { success } from "../utils/response_helper.js";

// ----------------------Validation-------------------------
 // Phone validation
const isValidPhone = (phone) => {
  if (typeof phone !== "string") return false;
  const trimmed = phone.trim();
  const mobileRegex = /^09\d{9}$/;
  const landlineRegex = /^0\d{1,3}-\d{3,4}-\d{4}$/;
  return mobileRegex.test(trimmed) || landlineRegex.test(trimmed);
};

const mapClientRow = (r) => ({
  clientID: r.clientID,
  deceasedName: r.deceasedName,
  registeredBy: r.registeredBy,
  mobileNo: r.mobileNo,
  email: r.email,
  scheduleFrom: r.scheduleFrom,
  scheduleTo: r.scheduleTo,
  chapelName: r.chapelName,
  packageName: r.packageName,
  pin: r.pin,
  packageBalance: r.packageBalance,
  additionalBalance: r.additionalBalance,
  contactPersonName: r.contactPersonName,
  contactPersonNumber: r.contactPersonNumber,
  status: r.status,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  qrDataUrl: r.qrDataUrl,
  sessionExpires: r.sessionExpires,
});

// ----------------------HELPER-------------------------
export const assignDefaultPackageToClient = async (clientID) => {
  const pool = await poolPromise;

  // 1) Get default packageID
  const defaultRes = await pool.request()
    .query(`SELECT TOP 1 packageID FROM sg.LQ_CSS_default_package ORDER BY createdAt DESC, defaultID DESC`);
  const packageID = defaultRes.recordset?.[0]?.packageID;
  if (!packageID) return null;

  // 2) Insert package items for client
  await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("packageID", sql.Int, packageID)
    .query(`
      INSERT INTO sg.LQ_CSS_client_package_items
        (clientID, packageID, productID, quantity, isDefault, createdAt)
      SELECT 
        @clientID,
        pi.packageID,
        pi.productID,
        pi.quantity,
        1, -- default package
        GETDATE()
      FROM sg.LQ_CSS_fnb_package_items pi
      WHERE pi.packageID = @packageID
    `);

  // 3) Update client_info with assigned packageNo
  await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("packageID", sql.Int, packageID)
    .query(`UPDATE sg.LQ_CSS_client_info SET packageNo = @packageID WHERE clientID = @clientID`);

  return packageID;
};

// export const addPackageToClient = async (clientID, packageID) => {
//   const pool = await poolPromise;

//   // Insert all items from the selected package into client_package_items
//   await pool.request()
//     .input("clientID", sql.Int, clientID)
//     .input("packageID", sql.Int, packageID)
//     .query(`
//       INSERT INTO sg.LQ_CSS_client_package_items
//         (clientID, packageID, productID, quantity, isDefault, createdAt)
//       SELECT
//         @clientID,
//         pi.packageID,
//         pi.productID,
//         pi.quantity,
//         1, -- additional package is not default
//         GETDATE()
//       FROM sg.LQ_CSS_fnb_package_items pi
//       WHERE pi.packageID = @packageID
//     `);

//   // Return how many items were added
//   const countRes = await pool.request()
//     .input("packageID", sql.Int, packageID)
//     .query(`SELECT COUNT(*) AS cnt FROM sg.LQ_CSS_fnb_package_items WHERE packageID = @packageID`);

//   return { packageID, added: countRes.recordset[0].cnt || 0 };
// };

export const addPackageToClient = async (clientID, packageID) => {
  const pool = await poolPromise;

  const packageItems = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query(`
      SELECT productID, quantity
      FROM sg.LQ_CSS_fnb_package_items
      WHERE packageID = @packageID
    `);

  if (packageItems.recordset.length === 0) {
    return { success: false, message: "Package not found or has no items" };
  }

  for (const item of packageItems.recordset) {
    const { productID, quantity } = item;

    const existing = await pool.request()
      .input("clientID", sql.Int, clientID)
      .input("productID", sql.Int, productID)
      .query(`
        SELECT clientPackageItemID, quantity
        FROM sg.LQ_CSS_client_package_items
        WHERE clientID = @clientID AND productID = @productID
      `);

    if (existing.recordset.length > 0) {
      await pool.request()
        .input("clientPackageItemID", sql.Int, existing.recordset[0].clientPackageItemID)
        .input("newQty", sql.Int, existing.recordset[0].quantity + quantity)
        .query(`
          UPDATE sg.LQ_CSS_client_package_items
          SET quantity = @newQty
          WHERE clientPackageItemID = @clientPackageItemID
        `);
    } else {
      await pool.request()
        .input("clientID", sql.Int, clientID)
        .input("productID", sql.Int, productID)
        .input("quantity", sql.Int, quantity)
        .input("packageID", sql.Int, packageID)
        .query(`
          INSERT INTO sg.LQ_CSS_client_package_items
            (clientID, productID, quantity, packageID, isDefault)
          VALUES
            (@clientID, @productID, @quantity, @packageID, 0)
        `);
    }
  }

  const updatedItems = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`
      SELECT *
      FROM sg.LQ_CSS_client_package_items
      WHERE clientID = @clientID
    `);

  return {
    success: true,
    message: "Package added successfully",
    items: updatedItems.recordset
  };
};

// ----------------------GET-------------------------
// Get all client information
export const getAllClient = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT 
      c.clientID,
      c.deceasedName,
      c.registeredBy,
      c.mobileNo,
      c.email,
      CONVERT(varchar(19), c.schedule_from, 120) AS scheduleFrom,
      CONVERT(varchar(19), c.schedule_to, 120) AS scheduleTo,
      ISNULL(cr.chapelName, 'No Chapel Assigned') AS chapelName,
      ISNULL(fp.packageName, 'No Package Assigned') AS packageName,
      c.pin,
      c.packageBalance,
      c.additionalBalance,
      ISNULL(c.contactPersonName, '') AS contactPersonName,
      ISNULL(c.contactPersonNumber, '') AS contactPersonNumber,
      c.status,
      c.createdAt,
      c.updatedAt,
      s.qrDataUrl,
      s.expires_at AS sessionExpires
    FROM sg.LQ_CSS_client_info AS c
    LEFT JOIN sg.LQ_CSS_chapel_rooms AS cr ON c.chapelID = cr.chapelID
    LEFT JOIN sg.LQ_CSS_fnb_packages AS fp ON c.packageNo = fp.packageID
    LEFT JOIN (
      SELECT clientID, qrDataUrl, expires_at
      FROM sg.LQ_CSS_sessions_info
      WHERE expires_at > GETDATE()
    ) AS s ON c.clientID = s.clientID
    ORDER BY c.createdAt DESC;
  `);

  return result.recordset.map(mapClientRow);
};

// get client by ID
export const getClientById = async (clientID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`
      SELECT 
        c.clientID,
        c.deceasedName,
        c.registeredBy,
        c.mobileNo,
        c.email,
        CONVERT(varchar(19), c.schedule_from, 120) AS scheduleFrom,
        CONVERT(varchar(19), c.schedule_to, 120) AS scheduleTo,
        ISNULL(cr.chapelName, 'No Chapel Assigned') AS chapelName,
        ISNULL(fp.packageName, 'No Package Assigned') AS packageName,
        c.pin,
        c.packageBalance,
        c.additionalBalance,
        ISNULL(c.contactPersonName, '') AS contactPersonName,
        ISNULL(c.contactPersonNumber, '') AS contactPersonNumber,
        c.status,
        c.createdAt,
        c.updatedAt,
        s.qrDataUrl,         
        s.expires_at AS sessionExpires
      FROM sg.LQ_CSS_client_info AS c
      LEFT JOIN sg.LQ_CSS_chapel_rooms AS cr ON c.chapelID = cr.chapelID
      LEFT JOIN sg.LQ_CSS_fnb_packages AS fp ON c.packageNo = fp.packageID
      LEFT JOIN (
        SELECT clientID, qrDataUrl, expires_at
        FROM sg.LQ_CSS_sessions_info
        WHERE expires_at > GETDATE()
      ) AS s ON c.clientID = s.clientID
      WHERE c.clientID = @clientID
    `);

  const row = result.recordset[0];
  return row ? mapClientRow(row) : null;
};

// get client by PIN (used by client login)
export const getClientByPin = async (pin) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("pin", sql.NVarChar(20), pin)
    .query(`
      SELECT TOP 1 *
      FROM sg.LQ_CSS_client_info
      WHERE pin = @pin
    `);

  return result.recordset[0] || null;
};

export const getClientPackageItems = async (clientID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`
      SELECT clientPackageItemID, productID, packageID, quantity, isDefault, createdAt
      FROM sg.LQ_CSS_client_package_items
      WHERE clientID = @clientID
      ORDER BY isDefault DESC, createdAt ASC
    `);
  return res.recordset;
};

/*----------------------POST-------------------------*/
// V1. Register a new client and generate QR + session
//   export const registerClientWithQR = async (client, userName) => {
//   const pool = await poolPromise;

//   // Generate a 6-digit PIN
//   const pin = Math.floor(100000 + Math.random() * 900000).toString();

//   // Insert client info
//   const insertResult = await pool.request()
//     .input("deceasedName", sql.NVarChar(150), client.deceasedName)
//     .input("registeredBy", sql.NVarChar(150), client.registeredBy)
//     .input("mobileNo", sql.NVarChar(20), client.mobileNo)
//     .input("email", sql.NVarChar(150), client.email ?? null)
//     .input("scheduleFrom", sql.DateTime, client.scheduleFrom)
//     .input("scheduleTo", sql.DateTime, client.scheduleTo)
//     .input("chapelID", sql.Int, client.chapelID)
//     .input("pin", sql.NVarChar(10), pin)
//     .input("packageBalance", sql.Decimal(18, 2), client.packageBalance ?? 0)
//     .input("additionalBalance", sql.Decimal(18, 2), client.additionalBalance ?? 0)
//     .input("contactPersonName", sql.NVarChar(150), client.contactPersonName)
//     .input("contactPersonNumber", sql.NVarChar(50), client.contactPersonNumber)
//     .query(`
//       INSERT INTO sg.LQ_CSS_client_info
//         (deceasedName, registeredBy, mobileNo, email, schedule_from, schedule_to, chapelID, pin, packageBalance, additionalBalance, contactPersonName, contactPersonNumber, status, createdAt, updatedAt)
//       VALUES
//         (@deceasedName, @registeredBy, @mobileNo, @email, @scheduleFrom, @scheduleTo, @chapelID, @pin, @packageBalance, @additionalBalance, @contactPersonName, @contactPersonNumber, 'Active', GETDATE(), GETDATE());
//       SELECT SCOPE_IDENTITY() AS clientID;
//     `);

//   const clientID = insertResult.recordset?.[0]?.clientID;
//   if (!clientID) throw new Error("Failed to register client");

//   // Assign default package items
// // const assignedPackageID = await assignDefaultPackageToClient(clientID);
//   let assignedPackageID = null;

//   if (client.packageNo) {
//     // user selected a package → use that package
//     assignedPackageID = client.packageNo;
//     await addPackageToClient(clientID, client.packageNo);

//     await pool.request()
//       .input("clientID", sql.Int, clientID)
//       .input("packageID", sql.Int, client.packageNo)
//       .query(`UPDATE sg.LQ_CSS_client_info SET packageNo = @packageID WHERE clientID = @clientID`);
//   } else {
//   // no package selected → assign default
//     assignedPackageID = await assignDefaultPackageToClient(clientID);
//   }
//   // Fetch assigned package items for the client
//   const itemsRes = await pool.request()
//     .input("clientID", sql.Int, clientID)
//     .query(`
//       SELECT clientPackageItemID, productID, quantity, isDefault, packageID
//       FROM sg.LQ_CSS_client_package_items
//       WHERE clientID = @clientID
//     `);

//   const packageItems = itemsRes.recordset || [];

//   // Generate QR data URL
//   const qrPayload = { pin, chapelID: client.chapelID, packageID: assignedPackageID, deceasedName: client.deceasedName };
//   const qrDataUrl = await generateQrDataUrl(qrPayload);

//   // Create session
//   const sessionID = await createSession({
//     clientID,
//     userName,
//     pin,
//     qrDataUrl,
//     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
//   });

//   return {
//     success: true,
//     message: "Client registered successfully with default package",
//     data: {
//       client: {
//         clientID,
//         pin,
//         qrDataUrl,
//         sessionID,
//         assignedPackageID,
//       },
//       packageItems
//     }
//   };
// };

export const generateQrDataUrl = async (pin) => {
  if (!pin) throw new Error("PIN is required to generate QR code");

  const loginUrl = `http://localhost:5000/client/login?pin=${encodeURIComponent(pin)}`;
  const qrDataUrl = await QRCode.toDataURL(loginUrl, { errorCorrectionLevel: 'H', type: 'image/png', width: 300 });
  return qrDataUrl;
}

// ----------------------- Consume / Order logic -----------------------
export const consumeClientItem = async (clientID, productID, qty) => {
  if (!clientID || !productID || !qty || qty <= 0) {
    throw new Error("Invalid parameters");
  }

  const pool = await poolPromise;
  const trx = pool.transaction();

  try {
    await trx.begin();
    const tReq = trx.request();

    // total available across default + additional for this product
    const totalRes = await tReq
      .input("clientID", sql.Int, clientID)
      .input("productID", sql.Int, productID)
      .query(`
        SELECT SUM(quantity) AS totalQty
        FROM sg.LQ_CSS_client_package_items
        WHERE clientID = @clientID AND productID = @productID AND quantity > 0
      `);

    const totalQty = (totalRes.recordset[0] && Number(totalRes.recordset[0].totalQty)) || 0;

    if (totalQty < qty) {
      await trx.rollback();
      return { success: false, message: "Not enough package quantity. Please add another package to continue." };
    }

    let remainingToConsume = qty;
    const consumedItems = [];

    // Helper function to consume from rows by given isDefault flag and record consumption
    const consumeFromRows = async (isDefaultFlag) => {
      // select rows with quantity > 0 in creation order
      const rowsRes = await tReq
        .input("clientID", sql.Int, clientID)
        .input("productID", sql.Int, productID)
        .input("isDefault", sql.Bit, isDefaultFlag)
        .query(`
          SELECT clientPackageItemID, packageID, quantity
          FROM sg.LQ_CSS_client_package_items
          WHERE clientID = @clientID AND productID = @productID AND isDefault = @isDefault AND quantity > 0
          ORDER BY createdAt ASC
        `);

      for (const row of rowsRes.recordset) {
        if (remainingToConsume <= 0) break;

        const available = Number(row.quantity || 0);
        if (available <= 0) continue;

        const take = Math.min(available, remainingToConsume);
        const newQty = available - take;

        // update the client row
        await tReq
          .input("clientPackageItemID", sql.Int, row.clientPackageItemID)
          .input("newQty", sql.Decimal(18,2), newQty)
          .query(`
            UPDATE sg.LQ_CSS_client_package_items
            SET quantity = @newQty
            WHERE clientPackageItemID = @clientPackageItemID
          `);

        // log consumption in client_consumption_log
        await tReq
          .input("clientID", sql.Int, clientID)
          .input("packageID", sql.Int, row.packageID ?? null)
          .input("productID", sql.Int, productID)
          .input("qty", sql.Decimal(18,2), take)
          .input("consumedFrom", sql.NVarChar(50), isDefaultFlag ? 'default' : 'additional')
          .query(`
            INSERT INTO sg.LQ_CSS_client_consumption_log
              (clientID, packageID, productID, quantity, consumedFrom, createdAt)
            VALUES (@clientID, @packageID, @productID, @qty, @consumedFrom, GETDATE())
          `);

        consumedItems.push({
          clientPackageItemID: row.clientPackageItemID,
          packageID: row.packageID ?? null,
          from: isDefaultFlag ? 'default' : 'additional',
          qtyConsumed: take
        });

        remainingToConsume -= take;
      }
    };

    // 1) consume from default (isDefault = 1)
    await consumeFromRows(1);

    // 2) if still need, consume from additional (isDefault = 0)
    if (remainingToConsume > 0) {
      await consumeFromRows(0);
    }

    // at this point remainingToConsume must be 0 because we checked totalQty earlier
    if (remainingToConsume > 0) {
      // should not happen, but safe-guard
      await trx.rollback();
      return { success: false, message: "Unexpected error: could not fulfill consumption." };
    }

    await trx.commit();

    // compute remaining total quantity after consumption
    const remRes = await pool.request()
      .input("clientID", sql.Int, clientID)
      .input("productID", sql.Int, productID)
      .query(`
        SELECT SUM(quantity) AS remainingQty
        FROM sg.LQ_CSS_client_package_items
        WHERE clientID = @clientID AND productID = @productID
      `);

    const remainingTotal = (remRes.recordset[0] && Number(remRes.recordset[0].remainingQty)) || 0;

    return { success: true, consumed: consumedItems, remainingTotal };
  } catch (err) {
    try { await trx.rollback(); } catch (e) {}
    console.error("consumeClientItem transaction failed:", err);
    throw err;
  }
};

// Raise client balance (adds amount to either packageBalance or additionalBalance)
export const raiseBalance = async (clientID, amount, type = "package") => {
  if (!clientID || isNaN(parseInt(clientID, 10))) throw new Error("Invalid clientID");
  const pool = await poolPromise;
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) throw new Error("Invalid amount");

  const field = type === "additional" ? "additionalBalance" : "packageBalance";

  const result = await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("amount", sql.Decimal(18,2), numericAmount)
    .query(`
      UPDATE sg.LQ_CSS_client_info
      SET ${field} = ISNULL(${field}, 0) + @amount, updatedAt = GETDATE()
      WHERE clientID = @clientID
    `);

  return result.rowsAffected[0] > 0;
};

// ----------------------PUT-------------------------
// Update client information
export const updateClient = async (client) => {
  if (!client.clientID) throw new Error("clientID is required for update");

  const pool = await poolPromise;
  const request = pool.request().input("clientID", sql.Int, client.clientID);

  const fieldsMap = {
    deceasedName: sql.NVarChar(150),
    registeredBy: sql.NVarChar(150),
    mobileNo: sql.NVarChar(20),
    email: sql.NVarChar(150),
    scheduleFrom: sql.DateTime,
    scheduleTo: sql.DateTime,
    chapelID: sql.Int,
    packageNo: sql.Int,
    pin: sql.NVarChar(10),
    packageBalance: sql.Decimal(18, 2),
    additionalBalance: sql.Decimal(18, 2),
    status: sql.NVarChar(50),
    contactPersonName: sql.NVarChar(150),
    contactPersonNumber: sql.NVarChar(50),
  };

  const fields = [];

  for (const [key, type] of Object.entries(fieldsMap)) {
    if (client[key] !== undefined) {
      if (key === "contactPersonNumber") {
        const phonePattern = /^(\d{2}-\d{4}-\d{4}|09\d{9})$/;
        if (!phonePattern.test(client[key])) {
          throw new Error("Invalid contactPersonNumber format");
        }
      }

      const value = type === sql.Decimal(18, 2) ? Number(client[key]) || 0 : client[key];
      fields.push(`${key} = @${key}`);
      request.input(key, type, value);
    }
  }

  if (fields.length === 0) throw new Error("No fields provided to update");

  fields.push("updatedAt = GETDATE()");

  const query = `
    UPDATE sg.LQ_CSS_client_info
    SET ${fields.join(", ")}
    WHERE clientID = @clientID
  `;

  const result = await request.query(query);
  return result.rowsAffected[0] > 0;
};

// ----------------------DELETE-------------------------
// Delete client by ID (hard delete chain: delete sessions then client)
export const deleteClient = async (clientID) => {
  const pool = await poolPromise;

  // delete sessions first
  await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`DELETE FROM sg.LQ_CSS_sessions_info WHERE clientID = @clientID`);

  // delete client package items
  await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`DELETE FROM sg.LQ_CSS_client_package_items WHERE clientID = @clientID`);

  // delete client header
  const result = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`DELETE FROM sg.LQ_CSS_client_info WHERE clientID = @clientID`);

  return result.rowsAffected[0] > 0;
};
