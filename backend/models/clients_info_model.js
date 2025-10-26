// models/clients_info_model.js
import { poolPromise, sql } from "../config/db_config.js";
import QRCode from "qrcode";
import { createSession } from "./sessions_info_model.js";
import crypto from "crypto";

// -------------------- Timezone helper --------------------
/**
 * Return a Date object set to Manila (UTC+8) corresponding to "now".
 * This ensures PIN rolls over at 00:00 Manila time.
 */
const nowManila = () => {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const manilaMs = utcMs + 8 * 60 * 60000;
  return new Date(manilaMs);
};

/* -------------------------
  Helpers & validators
------------------------- */
const isValidPhone = (phone) => {
  if (typeof phone !== "string") return false;
  const trimmed = phone.trim();
  const mobileRegex = /^09\d{9}$/;
  const landlineRegex = /^0\d{1,3}-\d{3,4}-\d{4}$/;
  return mobileRegex.test(trimmed) || landlineRegex.test(trimmed);
};

export const mapClientRow = (r) => ({
  clientID: r.clientID,
  deceasedName: r.deceasedName,
  registeredBy: r.registeredBy,
  mobileNo: r.mobileNo,
  email: r.email,
  scheduleFrom: r.schedule_from || r.scheduleFrom,
  scheduleTo: r.schedule_to || r.scheduleTo,
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

// generate clientSecret
export const generateClientSecret = () => crypto.randomBytes(16).toString("hex");

// generate daily 6-digit PIN from clientSecret and date (YYYY-MM-DD)
export const generateDailyPin = (clientID, dateOverride = null) => {
  if (!clientID) throw new Error("clientID required to generate PIN");

  // Use Manila date (YYYYMMDD) so PIN changes at 00:00 Manila
  const d = dateOverride
    ? new Date(dateOverride)
    : nowManila();

  // Format YYYYMMDD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}${mm}${dd}`;

  const seed = `${clientID}${dateStr}`;
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  const num = parseInt(hash.slice(0, 8), 16) % 1000000;
  return String(num).padStart(6, "0");
};

// ---------------------- HELPERS -------------------------
export const assignDefaultPackageToClient = async (clientID) => {
  const pool = await poolPromise;
  const defaultRes = await pool.request()
    .query(`SELECT TOP 1 packageID FROM sg.LQ_CSS_default_package ORDER BY createdAt DESC, defaultID DESC`);
  const packageID = defaultRes.recordset?.[0]?.packageID;
  if (!packageID) return null;

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
        1,
        GETDATE()
      FROM sg.LQ_CSS_fnb_package_items pi
      WHERE pi.packageID = @packageID
    `);

  await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("packageID", sql.Int, packageID)
    .query(`UPDATE sg.LQ_CSS_client_info SET packageNo = @packageID WHERE clientID = @clientID`);

  return packageID;
};

export const addPackageToClient = async (clientID, packageID) => {
  const pool = await poolPromise;
  const packageItems = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query(`SELECT productID, quantity FROM sg.LQ_CSS_fnb_package_items WHERE packageID = @packageID`);

  if (packageItems.recordset.length === 0) {
    return { success: false, message: "Package not found or has no items" };
  }

  for (const item of packageItems.recordset) {
    const { productID, quantity } = item;
    const existing = await pool.request()
      .input("clientID", sql.Int, clientID)
      .input("productID", sql.Int, productID)
      .query(`SELECT clientPackageItemID, quantity FROM sg.LQ_CSS_client_package_items WHERE clientID = @clientID AND productID = @productID`);

    if (existing.recordset.length > 0) {
      await pool.request()
        .input("clientPackageItemID", sql.Int, existing.recordset[0].clientPackageItemID)
        .input("newQty", sql.Int, existing.recordset[0].quantity + quantity)
        .query(`UPDATE sg.LQ_CSS_client_package_items SET quantity = @newQty WHERE clientPackageItemID = @clientPackageItemID`);
    } else {
      await pool.request()
        .input("clientID", sql.Int, clientID)
        .input("productID", sql.Int, productID)
        .input("quantity", sql.Int, quantity)
        .input("packageID", sql.Int, packageID)
        .query(`INSERT INTO sg.LQ_CSS_client_package_items (clientID, productID, quantity, packageID, isDefault) VALUES (@clientID, @productID, @quantity, @packageID, 0)`);
    }
  }

  const updatedItems = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`SELECT * FROM sg.LQ_CSS_client_package_items WHERE clientID = @clientID`);

  return { success: true, message: "Package added successfully", items: updatedItems.recordset };
};

// ---------------------- GET -------------------------
export const getAllClient = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT 
      c.clientID, c.deceasedName, c.registeredBy, c.mobileNo, c.email,
      CONVERT(varchar(19), c.schedule_from, 120) AS scheduleFrom,
      CONVERT(varchar(19), c.schedule_to, 120) AS scheduleTo,
      ISNULL(cr.chapelName,'No Chapel Assigned') AS chapelName,
      ISNULL(fp.packageName,'No Package Assigned') AS packageName,
      c.pin, c.packageBalance, c.additionalBalance,
      ISNULL(c.contactPersonName,'') AS contactPersonName,
      ISNULL(c.contactPersonNumber,'') AS contactPersonNumber,
      c.status, c.createdAt, c.updatedAt,
      s.qrDataUrl, s.expires_at AS sessionExpires
    FROM sg.LQ_CSS_client_info AS c
    LEFT JOIN sg.LQ_CSS_chapel_rooms AS cr ON c.chapelID = cr.chapelID
    LEFT JOIN sg.LQ_CSS_fnb_packages AS fp ON c.packageNo = fp.packageID
    LEFT JOIN (
      SELECT clientID, qrDataUrl, expires_at
      FROM sg.LQ_CSS_sessions_info
      WHERE expires_at > GETDATE()
    ) AS s ON c.clientID = s.clientID
    ORDER BY c.createdAt DESC
  `);
  return result.recordset.map(mapClientRow);
};

export const getClientById = async (clientID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`SELECT * FROM sg.LQ_CSS_client_info WHERE clientID = @clientID`);
  return result.recordset[0] ? result.recordset[0] : null; // return raw row (controller can map)
};

// returns raw client row (includes clientSecret) by pin
export const getClientByPin = async (pin) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("pin", sql.NVarChar(20), pin)
    .query(`SELECT TOP 1 * FROM sg.LQ_CSS_client_info WHERE pin = @pin`);
  return result.recordset[0] || null;
};

export const getClientPackageItems = async (clientID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`SELECT clientPackageItemID, productID, packageID, quantity, isDefault, createdAt FROM sg.LQ_CSS_client_package_items WHERE clientID = @clientID ORDER BY isDefault DESC, createdAt ASC`);
  return res.recordset;
};

export const getClientWithPackageSummary = async (clientID) => {
  const rawClient = await getClientById(clientID);
  if (!rawClient) return null;

  const client = mapClientRow(rawClient);
  const packageItems = await getClientPackageItems(clientID);

  const summary = packageItems.reduce(
    (acc, item) => {
      if (item.isDefault) {
        acc.defaultTotal += Number(item.quantity || 0);
      } else {
        acc.additionalTotal += Number(item.quantity || 0);
      }
      return acc;
    },
    { defaultTotal: 0, additionalTotal: 0 }
  );

  // ✅ Daily PIN (using your existing PIN column — NOT regenerating)
  const todayPin = client.pin || null;

  // ✅ Validate schedule (scheduleValid = is today between from–to)
  const today = new Date();
  const from = new Date(client.scheduleFrom);
  const to = new Date(client.scheduleTo);
  const scheduleValid =
    today.setHours(0, 0, 0, 0) >= from.setHours(0, 0, 0, 0) &&
    today.setHours(0, 0, 0, 0) <= to.setHours(0, 0, 0, 0);

  // ✅ PIN expires tonight 23:59:59
  const expiresAt = (() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  })();

  // ✅ Minimal order summary for now
  const orderSummary = {
    totalOrders: 0,
    completed: 0,
    pending: 0
  };

  // ✅ PIN included here
  return {
    clientID: client.clientID,
    deceasedName: client.deceasedName,
    chapelName: client.chapelName,
    scheduleFrom: client.scheduleFrom,
    scheduleTo: client.scheduleTo,
    packageName: client.packageName,
    pin: client.pin,                   
    packageBalance: client.packageBalance,
    additionalBalance: client.additionalBalance,
    status: client.status,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    qrDataUrl: client.qrDataUrl,       // (optional but useful for dashboard)
    packageItems,
    packageSummary: summary
  };
};

// Get client by clientSecret
export const getClientBySecret = async (clientSecret) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientSecret", sql.NVarChar(64), clientSecret)
    .query(`
      SELECT 
        c.clientID,
        c.deceasedName,
        c.registeredBy,
        c.mobileNo,
        c.email,
        c.schedule_from,
        c.schedule_to,
        c.chapelID,
        ISNULL(cr.chapelName, '') AS chapelName,
        c.packageNo,
        ISNULL(fp.packageName, '') AS packageName,
        c.pin,
        c.packageBalance,
        c.additionalBalance,
        c.status,
        c.createdAt,
        c.updatedAt,
        c.contactPersonName,
        c.contactPersonNumber,
        c.clientSecret
      FROM sg.LQ_CSS_client_info c
      LEFT JOIN sg.LQ_CSS_chapel_rooms cr ON c.chapelID = cr.chapelID
      LEFT JOIN sg.LQ_CSS_fnb_packages fp ON c.packageNo = fp.packageID
      WHERE c.clientSecret = @clientSecret
    `);

  return res.recordset[0] || null;
};

// ---------------------- AUTH helpers -------------------------
// get client auth fields needed for login/validation
export const getClientAuthData = async (clientID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`SELECT clientID, clientSecret, schedule_from, schedule_to, status FROM sg.LQ_CSS_client_info WHERE clientID = @clientID`);
  return res.recordset[0] || null;
};

// is default package allowed today? returns boolean
export const isDefaultPackageAllowed = async (clientID, forDate = null) => {
  const auth = await getClientAuthData(clientID);
  if (!auth) return false;
  const from = new Date(auth.schedule_from);
  const to = new Date(auth.schedule_to);

  // default usage allowed up to (schedule_to - 1 day)
  const lastAllowed = new Date(to);
  lastAllowed.setDate(lastAllowed.getDate() - 1);

  const today = forDate ? new Date(forDate) : new Date();
  // normalize date portion only
  const ymd = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return ymd(today) >= ymd(from) && ymd(today) <= ymd(lastAllowed);
};

// ---------------------- POST (register with clientSecret & static QR) -------------------------
export const registerClientWithQR = async (client, userName) => {
  const pool = await poolPromise;
  const pin = Math.floor(100000 + Math.random() * 900000).toString(); // legacy pin (you can ignore usage)
  const clientSecret = generateClientSecret();

  const insertResult = await pool.request()
    .input("deceasedName", sql.NVarChar(150), client.deceasedName)
    .input("registeredBy", sql.NVarChar(150), client.registeredBy)
    .input("mobileNo", sql.NVarChar(20), client.mobileNo)
    .input("email", sql.NVarChar(150), client.email ?? null)
    .input("scheduleFrom", sql.DateTime, client.scheduleFrom)
    .input("scheduleTo", sql.DateTime, client.scheduleTo)
    .input("chapelID", sql.Int, client.chapelID)
    .input("pin", sql.NVarChar(10), pin)
    .input("packageBalance", sql.Decimal(18,2), client.packageBalance ?? 0)
    .input("additionalBalance", sql.Decimal(18,2), client.additionalBalance ?? 0)
    .input("contactPersonName", sql.NVarChar(150), client.contactPersonName)
    .input("contactPersonNumber", sql.NVarChar(50), client.contactPersonNumber)
    .input("clientSecret", sql.NVarChar(64), clientSecret)
    .query(`
      INSERT INTO sg.LQ_CSS_client_info
        (deceasedName, registeredBy, mobileNo, email, schedule_from, schedule_to, chapelID, pin, packageBalance, additionalBalance, contactPersonName, contactPersonNumber, clientSecret, status, createdAt, updatedAt)
      VALUES
        (@deceasedName, @registeredBy, @mobileNo, @email, @scheduleFrom, @scheduleTo, @chapelID, @pin, @packageBalance, @additionalBalance, @contactPersonName, @contactPersonNumber, @clientSecret, 'Active', GETDATE(), GETDATE());
      SELECT SCOPE_IDENTITY() AS clientID;
    `);

  const clientID = insertResult.recordset?.[0]?.clientID;
  if (!clientID) throw new Error("Failed to register client");

  const assignedDefaultPackageID = await assignDefaultPackageToClient(clientID);
  let assignedSelectedPackageID = null;

  if (client.packageNo) {
    assignedSelectedPackageID = client.packageNo;
    await addPackageToClient(clientID, client.packageNo);
  }

  const itemsRes = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`SELECT clientPackageItemID, productID, quantity, isDefault, packageID FROM sg.LQ_CSS_client_package_items WHERE clientID = @clientID`);

  const packageItems = itemsRes.recordset || [];

  // Static QR points to clientID (not PIN)
  const qrDataUrl = await generateQrDataUrl({ clientID });

  const sessionID = await createSession({ clientID, userName, pin, qrDataUrl, expiresAt: new Date(Date.now() + 7*24*60*60*1000) });

  return {
    success: true,
    message: "Client registered successfully",
    data: {
      client: { clientID, pin, clientSecret, qrDataUrl, sessionID, assignedDefaultPackageID, assignedSelectedPackageID },
      packageItems
    }
  };
};

export const generateQrDataUrl = async (payload) => {
  // payload should contain clientID
  if (!payload || !payload.clientID) throw new Error("clientID required for QR");
  const loginUrl = `http://localhost:5000/clients/login?clientID=${encodeURIComponent(payload.clientID)}`;
  return QRCode.toDataURL(loginUrl, { errorCorrectionLevel: 'H', type: 'image/png', width: 300 });
};

// ----------------------- Consume / Order logic (respects default validity) -----------------------
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

    // Check whether default package consumption allowed today
    const allowDefault = await isDefaultPackageAllowed(clientID);

    // Helper function to consume from rows by given isDefault flag and record consumption
    const consumeFromRows = async (isDefaultFlag) => {
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

        await tReq
          .input("clientPackageItemID", sql.Int, row.clientPackageItemID)
          .input("newQty", sql.Decimal(18,2), newQty)
          .query(`UPDATE sg.LQ_CSS_client_package_items SET quantity = @newQty WHERE clientPackageItemID = @clientPackageItemID`);

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

    // 1) consume from default (isDefault = 1) only if allowed by date
    if (allowDefault) {
      await consumeFromRows(1);
    }

    // 2) if still need, consume from additional (isDefault = 0)
    if (remainingToConsume > 0) {
      await consumeFromRows(0);
    }

    // If still remaining and default was not allowed earlier, allow falling back to default? 
    // We intentionally disallow default if date expired. The check above ensures we don't use default when not allowed.

    if (remainingToConsume > 0) {
      // Should not happen because we checked totalQty (includes both types), but safeguard
      await trx.rollback();
      return { success: false, message: "Unexpected error: could not fulfill consumption." };
    }

    await trx.commit();

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

// ---------------------- BALANCE / UPDATE / DELETE (unchanged) -------------------------
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

  const query = `UPDATE sg.LQ_CSS_client_info SET ${fields.join(", ")} WHERE clientID = @clientID`;
  const result = await request.query(query);
  return result.rowsAffected[0] > 0;
};

export const deleteClient = async (clientID) => {
  const pool = await poolPromise;
  await pool.request().input("clientID", sql.Int, clientID).query(`DELETE FROM sg.LQ_CSS_sessions_info WHERE clientID = @clientID`);
  await pool.request().input("clientID", sql.Int, clientID).query(`DELETE FROM sg.LQ_CSS_client_package_items WHERE clientID = @clientID`);
  const result = await pool.request().input("clientID", sql.Int, clientID).query(`DELETE FROM sg.LQ_CSS_client_info WHERE clientID = @clientID`);
  return result.rowsAffected[0] > 0;
};

export const getClientPackageSummary = async (clientID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`
      SELECT productID, SUM(quantity) AS totalQty, MIN(isDefault) AS isDefault
      FROM sg.LQ_CSS_client_package_items
      WHERE clientID = @clientID
      GROUP BY productID
    `);
  return res.recordset.map(r => ({ productID: r.productID, totalQty: Number(r.totalQty), isDefault: Boolean(r.isDefault) }));
};
