// models/clients_info_model.js
import { poolPromise, sql } from "../config/db_config.js";
import QRCode from "qrcode";
import { createSession } from "./sessions_info_model.js";
import crypto from "crypto";
import { fetchLatestDefaultPackage, getPackageById, getPackageItems } from "./default_package_model.js";


// -------------------- Timezone helper --------------------
const nowManila = () => {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const manilaMs = utcMs + 8 * 60 * 60000;
  return new Date(manilaMs);
};

// -------------------- Helpers & validators --------------------
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
  const d = dateOverride ? new Date(dateOverride) : nowManila();
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

  // Insert default package items with the package's predefined quantities
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
        pi.quantity,       -- quantity comes from package definition
        1,
        GETDATE()
      FROM sg.LQ_CSS_fnb_package_items pi
      WHERE pi.packageID = @packageID
    `);

  // Update client_info.packageNo
  await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("packageNo", sql.Int, packageID)
    .query(`UPDATE sg.LQ_CSS_client_info SET packageNo = @packageNo WHERE clientID = @clientID`);

  return packageID;
};

export const addPackageToClient = async (clientID, packageID, isDefault = 0) => {
  const pool = await poolPromise;

  // 1) Insert package items for the client
  const itemsRes = await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("packageID", sql.Int, packageID)
    .input("isDefault", sql.Bit, isDefault)
    .query(`
      INSERT INTO sg.LQ_CSS_client_package_items (clientID, packageID, productID, quantity, isDefault, createdAt)
      SELECT @clientID, packageID, productID, quantity, @isDefault, GETDATE()
      FROM sg.LQ_CSS_fnb_package_items
      WHERE packageID = @packageID;
    `);

  // 2) Fetch the package name
  const pkgRes = await pool.request()
    .input("packageID", sql.Int, packageID)
    .query(`SELECT packageName FROM sg.LQ_CSS_fnb_packages WHERE packageID = @packageID`);
  const packageName = pkgRes.recordset?.[0]?.packageName || "Unknown";

  // 3) Calculate total quantity and total value
  const itemsDetails = await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("packageID", sql.Int, packageID)
    .query(`
      SELECT cpi.quantity, p.price
      FROM sg.LQ_CSS_client_package_items cpi
      LEFT JOIN sg.LQ_CSS_fnb_products p ON cpi.productID = p.productID
      WHERE cpi.clientID = @clientID AND cpi.packageID = @packageID
    `);

  let totalQuantity = 0;
  let totalValue = 0;
  itemsDetails.recordset.forEach(i => {
    totalQuantity += i.quantity || 0;
    totalValue += (i.quantity || 0) * (i.price || 0);
  });

  // 4) Insert into LQ_CSS_client_packages
  await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("packageID", sql.Int, packageID)
    .input("packageName", sql.NVarChar(150), packageName)
    .input("quantity", sql.Int, totalQuantity)
    .input("totalValue", sql.Decimal(18,2), totalValue)
    .query(`
      INSERT INTO sg.LQ_CSS_client_packages (clientID, packageID, packageName, quantity, totalValue, createdAt)
      VALUES (@clientID, @packageID, @packageName, @quantity, @totalValue, GETDATE())
    `);

  return { success: true, message: "Package added to client" };
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
  return result.recordset[0] ? result.recordset[0] : null;
};

export const getClientByPin = async (pin) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("pin", sql.NVarChar(20), pin)
    .query(`SELECT TOP 1 * FROM sg.LQ_CSS_client_info WHERE pin = @pin`);
  return result.recordset[0] || null;
};

export const updateClientPin = async (clientID, pin) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("clientID", sql.Int, clientID)
      .input("pin", sql.NVarChar(10), pin)
      .query(`
        UPDATE sg.LQ_CSS_client_info
        SET pin = @pin, updatedAt = GETDATE()
        WHERE clientID = @clientID
      `);
    return true;
  } catch (err) {
    console.error("❌ updateClientPin error:", err);
    throw err;
  }
};

export const getClientPackageItems = async (clientID) => {
  const pool = await poolPromise;
  const res = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`SELECT clientPackageItemID, productID, packageID, quantity, isDefault, createdAt FROM sg.LQ_CSS_client_package_items WHERE clientID = @clientID ORDER BY isDefault DESC, createdAt ASC`);
  return res.recordset;
};

// export const getClientWithPackageSummaryTest = async (clientID) => {
//   const pool = await poolPromise;
//   const defaultPackage = await pool.request()
//     .input("clientID", sql.Int, clientID)
//     .query(`SELECT 
//       [packageNo]
//   FROM [DHUB].[sg].[LQ_CSS_client_info] WHERE clientID = @clientID`);
//   const defaultPackageId = defaultPackage.recordset[0]?.packageNo;


//   const addPackage = await pool.request()
//     .input("clientID", sql.Int, clientID)
//     .query(`SELECT [packageID]
//   FROM [DHUB].[sg].[LQ_CSS_client_packages] WHERE clientId = 7`);
//   const addPackageId = addPackage.recordset[0]?.packageID;

//   const packageDetailsResult = await pool.request()
//       .input("defaultPackageId", sql.Int, defaultPackageId)
//       .input("addPackageId", sql.Int, addPackageId)
//       .query(`
//         SELECT
//           MAX(CASE WHEN packageID = @addPackageId THEN packageName END) AS packageName,
//           SUM(ISNULL(quantity, 0)) AS quantity,
//           MAX(CASE WHEN packageID = @addPackageId THEN totalValue END) AS totalValue
//         FROM sg.LQ_CSS_fnb_packages
//         WHERE packageID IN (@defaultPackageId, @addPackageId);
//       `);

//      const packageSummary = packageDetailsResult.recordset[0];

//      const productListResult = await pool.request()
//       .input("defaultPackageId", sql.Int, defaultPackageId)
//       .input("addPackageId", sql.Int, addPackageId)
//       .query(`
//         SELECT DISTINCT
//           p.productID,
//           p.productName,
//           p.price,
//           p.sizeId,
//           s.size,
//           p.categoryID,
//           c.categoryName
//         FROM sg.LQ_CSS_fnb_package_items AS i
//         INNER JOIN sg.LQ_CSS_fnb_products AS p ON i.productID = p.productID
//         LEFT JOIN sg.LQ_CSS_product_sizes AS s ON p.sizeId = s.sizeId
//         LEFT JOIN sg.LQ_CSS_fnb_categories AS c ON p.categoryID = c.categoryID
//         WHERE i.packageID IN (@defaultPackageId, @addPackageId);
//       `);

//     const products = productListResult.recordset;

//     return {
//       packageSummary,
//       products
//     };
// };

// Get client by clientSecret
export const getClientWithPackageSummaryTest = async (clientID) => {
  const pool = await poolPromise;
  const defaultPackage = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`SELECT [packageID]
  FROM [DHUB].[sg].[LQ_CSS_client_packages] WHERE clientId = @clientID`);
  const packageRecords = defaultPackage.recordset;

  const firstPackageID = packageRecords[0]?.packageID || null;
  const secondPackageID = packageRecords[1]?.packageID || null;

  const packageDetailsResult = await pool.request()
      .input("secondPackageID", sql.Int, secondPackageID)
      .input("firstPackageID", sql.Int, firstPackageID)
      .query(`
        SELECT
          MAX(CASE WHEN packageID = @firstPackageID THEN packageName END) AS packageName,
          SUM(ISNULL(quantity, 0)) AS quantity,
          MAX(CASE WHEN packageID = @firstPackageID THEN totalValue END) AS totalValue
        FROM sg.LQ_CSS_fnb_packages
        WHERE packageID IN (@secondPackageID, @firstPackageID);
      `);

     const packageSummary = packageDetailsResult.recordset[0];

     const productListResult = await pool.request()
      .input("secondPackageID", sql.Int, secondPackageID)
      .input("firstPackageID", sql.Int, firstPackageID)
      .query(`
        SELECT DISTINCT
          p.productID,
          p.productName,
          p.price,
          p.sizeId,
          s.size,
          p.categoryID,
          c.categoryName
        FROM sg.LQ_CSS_fnb_package_items AS i
        INNER JOIN sg.LQ_CSS_fnb_products AS p ON i.productID = p.productID
        LEFT JOIN sg.LQ_CSS_product_sizes AS s ON p.sizeId = s.sizeId
        LEFT JOIN sg.LQ_CSS_fnb_categories AS c ON p.categoryID = c.categoryID
        WHERE i.packageID IN (@secondPackageID, @firstPackageID);
      `);

    const products = productListResult.recordset;

    return {
      packageSummary,
      products
    };

}

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

export const getClientByTokenQr = async (tokenQr) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("tokenQr", sql.NVarChar(100), tokenQr)
      .query(`
        SELECT *
        FROM sg.LQ_CSS_client_info
        WHERE tokenQr = @tokenQr
      `);
    return result.recordset[0] || null;
  } catch (err) {
    console.error("❌ getClientByTokenQr error:", err);
    throw err;
  }
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

  const lastAllowed = new Date(to);
  lastAllowed.setDate(lastAllowed.getDate() - 1);

  const today = forDate ? new Date(forDate) : new Date();
  const ymd = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return ymd(today) >= ymd(from) && ymd(today) <= ymd(lastAllowed);
};

// ---------------------- POST (register with clientSecret & static QR) -------------------------
// export const registerClientWithQR = async (client, userName) => {
//   const pool = await poolPromise;
//   const pin = Math.floor(100000 + Math.random() * 900000).toString();
//   const clientSecret = generateClientSecret();

//   // 1️⃣ Insert client info
//   const insertResult = await pool.request()
//     .input("deceasedName", sql.NVarChar(150), client.deceasedName)
//     .input("registeredBy", sql.NVarChar(150), client.registeredBy)
//     .input("mobileNo", sql.NVarChar(20), client.mobileNo)
//     .input("email", sql.NVarChar(150), client.email ?? null)
//     .input("scheduleFrom", sql.DateTime, client.scheduleFrom)
//     .input("scheduleTo", sql.DateTime, client.scheduleTo)
//     .input("chapelID", sql.Int, client.chapelID)
//     .input("pin", sql.NVarChar(10), pin)
//     .input("packageBalance", sql.Decimal(18,2), client.packageBalance ?? 0)
//     .input("additionalBalance", sql.Decimal(18,2), client.additionalBalance ?? 0)
//     .input("contactPersonName", sql.NVarChar(150), client.contactPersonName)
//     .input("contactPersonNumber", sql.NVarChar(50), client.contactPersonNumber)
//     .input("clientSecret", sql.NVarChar(64), clientSecret)
//     .query(`
//       INSERT INTO sg.LQ_CSS_client_info
//         (deceasedName, registeredBy, mobileNo, email, schedule_from, schedule_to, chapelID, pin, packageBalance, additionalBalance, contactPersonName, contactPersonNumber, clientSecret, status, createdAt, updatedAt)
//       VALUES
//         (@deceasedName, @registeredBy, @mobileNo, @email, @scheduleFrom, @scheduleTo, @chapelID, @pin, @packageBalance, @additionalBalance, @contactPersonName, @contactPersonNumber, @clientSecret, 'Active', GETDATE(), GETDATE());
//       SELECT SCOPE_IDENTITY() AS clientID;
//     `);

//   const clientID = insertResult.recordset?.[0]?.clientID;
//   if (!clientID) throw new Error("Failed to register client");

//   // 2️⃣ Collect all package IDs to assign (default + selected + extra)
//   const packageIDs = new Set();

//   // Assign default package
//   const defaultPackageID = await assignDefaultPackageToClient(clientID);
//   if (defaultPackageID) packageIDs.add(defaultPackageID);

//   // Selected/chosen package
//   let selectedPackageID = null;
//   if (client.packageNo) selectedPackageID = client.packageNo;
//   else if (client.chapelID) {
//     const chapelRes = await pool.request()
//       .input("chapelID", sql.Int, client.chapelID)
//       .query(`SELECT packageID FROM sg.LQ_CSS_chapel_rooms WHERE chapelID = @chapelID`);
//     selectedPackageID = chapelRes.recordset?.[0]?.packageID || null;
//   }
//   if (selectedPackageID && !packageIDs.has(selectedPackageID)) {
//     await addPackageToClient(clientID, selectedPackageID, 1);
//     packageIDs.add(selectedPackageID);
//   }

//   // Extra packages
//   const assignedExtraPackages = [];
//   if (Array.isArray(client.extraPackages)) {
//     for (const extraPkgRaw of client.extraPackages) {
//       const extraPkgID = Number(extraPkgRaw);
//       if (!extraPkgID || packageIDs.has(extraPkgID)) continue;
//       const addRes = await addPackageToClient(clientID, extraPkgID, 0);
//       if (addRes.success) packageIDs.add(extraPkgID);
//       assignedExtraPackages.push({ packageID: extraPkgID, success: addRes.success, message: addRes.message });
//     }
//   }

//   // 3️⃣ Insert into client_packages, avoid duplicates
//   for (const pkgID of packageIDs) {
//     const pkgRes = await pool.request()
//       .input("packageID", sql.Int, pkgID)
//       .query(`SELECT packageName FROM sg.LQ_CSS_fnb_packages WHERE packageID = @packageID`);
//     const pkgName = pkgRes.recordset?.[0]?.packageName || "Unknown";

//     const itemsRes = await pool.request()
//       .input("clientID", sql.Int, clientID)
//       .input("packageID", sql.Int, pkgID)
//       .query(`
//         SELECT quantity, p.price 
//         FROM sg.LQ_CSS_client_package_items cpi
//         LEFT JOIN sg.LQ_CSS_fnb_products p ON cpi.productID = p.productID
//         WHERE clientID = @clientID AND packageID = @packageID
//       `);

//     const totalQuantity = itemsRes.recordset.reduce((sum, i) => sum + (i.quantity || 0), 0);
//     const totalValue = itemsRes.recordset.reduce((sum, i) => sum + ((i.quantity || 0) * (i.price || 0)), 0);

//     await pool.request()
//       .input("clientID", sql.Int, clientID)
//       .input("packageID", sql.Int, pkgID)
//       .input("packageName", sql.NVarChar(150), pkgName)
//       .input("quantity", sql.Int, totalQuantity)
//       .input("totalValue", sql.Decimal(18,2), totalValue)
//       .query(`
//         IF NOT EXISTS (SELECT 1 FROM sg.LQ_CSS_client_packages WHERE clientID = @clientID AND packageID = @packageID)
//           INSERT INTO sg.LQ_CSS_client_packages (clientID, packageID, packageName, quantity, totalValue, createdAt)
//           VALUES (@clientID, @packageID, @packageName, @quantity, @totalValue, GETDATE());
//       `);
//   }

//   // 4️⃣ Generate QR + session
//   const tokenQr = crypto.randomBytes(16).toString("hex");
//   await pool.request()
//     .input("clientID", sql.Int, clientID)
//     .input("tokenQr", sql.NVarChar(64), tokenQr)
//     .query(`UPDATE sg.LQ_CSS_client_info SET tokenQr = @tokenQr WHERE clientID = @clientID`);

//   const qrDataUrl = await generateQrDataUrl({ tokenQr });
//   const sessionID = await createSession({
//     clientID,
//     userName,
//     pin,
//     qrDataUrl,
//     expiresAt: new Date(Date.now() + 7*24*60*60*1000)
//   });

//   // 5️⃣ Prepare package meta & items for frontend
//   const pkgMetaRes = await pool.request()
//     .query(`SELECT packageID, packageName, description FROM sg.LQ_CSS_fnb_packages WHERE packageID IN (${Array.from(packageIDs).join(",")})`);

//   const packageMeta = pkgMetaRes.recordset.map(p => ({
//     packageID: p.packageID,
//     packageName: p.packageName,
//     description: p.description
//   }));

//   const pkgItemsRes = await pool.request()
//     .input("clientID", sql.Int, clientID)
//     .query(`SELECT clientPackageItemID, productID, quantity, isDefault, packageID FROM sg.LQ_CSS_client_package_items WHERE clientID = @clientID ORDER BY isDefault DESC, createdAt ASC`);

//   const packageItems = pkgItemsRes.recordset;

//   return {
//     success: true,
//     message: "Client registered successfully",
//     data: {
//       client: { clientID, pin, clientSecret, qrDataUrl, sessionID, assignedExtraPackages },
//       packageMeta,
//       packageItems
//     }
//   };
// };
export const registerClientWithQR = async (client, userName) => {
  const pool = await poolPromise;
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  const clientSecret = generateClientSecret();

  // 1️⃣ Insert client info
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

  // 2️⃣ Collect all package IDs (default + chapel + extra)
  const packageIDs = new Set();

  // Default package
  const defaultPackageID = await assignDefaultPackageToClient(clientID);
  if (defaultPackageID) packageIDs.add(defaultPackageID);

  // Chapel package
  if (client.chapelID) {
    const chapelRes = await pool.request()
      .input("chapelID", sql.Int, client.chapelID)
      .query(`SELECT packageID FROM sg.LQ_CSS_chapel_rooms WHERE chapelID = @chapelID`);
    const selectedPackageID = chapelRes.recordset?.[0]?.packageID;
    if (selectedPackageID) packageIDs.add(selectedPackageID);
  }

  // Extra packages
  if (Array.isArray(client.extraPackages)) {
    for (const pkgRaw of client.extraPackages) {
      const pkgID = Number(pkgRaw);
      if (pkgID) packageIDs.add(pkgID);
    }
  }

  // 3️⃣ Insert into client_packages with package-level total quantity
  for (const pkgID of packageIDs) {
    const pkgRes = await pool.request()
      .input("packageID", sql.Int, pkgID)
      .query(`SELECT packageName, quantity AS packageQuantity FROM sg.LQ_CSS_fnb_packages WHERE packageID = @packageID`);

    const pkgName = pkgRes.recordset?.[0]?.packageName || "Unknown";
    const totalQuantity = pkgRes.recordset?.[0]?.packageQuantity || 50; // package-level total
    const remainingQty = totalQuantity;

    await pool.request()
      .input("clientID", sql.Int, clientID)
      .input("packageID", sql.Int, pkgID)
      .input("packageName", sql.NVarChar(150), pkgName)
      .input("packageQuantity", sql.Int, totalQuantity)
      .input("remainingQty", sql.Int, remainingQty)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM sg.LQ_CSS_client_packages WHERE clientID = @clientID AND packageID = @packageID)
          INSERT INTO sg.LQ_CSS_client_packages (clientID, packageID, packageName, quantity, remainingQty, createdAt)
          VALUES (@clientID, @packageID, @packageName, @packageQuantity, @remainingQty, GETDATE());
      `);
  }

  // 4️⃣ Generate QR + session
  const tokenQr = crypto.randomBytes(16).toString("hex");
  await pool.request()
    .input("clientID", sql.Int, clientID)
    .input("tokenQr", sql.NVarChar(64), tokenQr)
    .query(`UPDATE sg.LQ_CSS_client_info SET tokenQr = @tokenQr WHERE clientID = @clientID`);

  const qrDataUrl = await generateQrDataUrl({ tokenQr });
  const sessionID = await createSession({
    clientID,
    userName,
    pin,
    qrDataUrl,
    expiresAt: new Date(Date.now() + 7*24*60*60*1000)
  });

  // 5️⃣ Prepare package items for frontend
  const pkgItemsRes = await pool.request()
    .input("clientID", sql.Int, clientID)
    .query(`
      SELECT cpi.clientPackageItemID, cpi.productID, cpi.quantity AS productQuantity, p.productName, p.price, cpi.packageID
      FROM sg.LQ_CSS_client_package_items cpi
      LEFT JOIN sg.LQ_CSS_fnb_products p ON cpi.productID = p.productID
      WHERE cpi.clientID = @clientID
      ORDER BY cpi.packageID, cpi.clientPackageItemID
    `);

  const packageItems = pkgItemsRes.recordset;

  return {
    success: true,
    message: "Client registered successfully",
    data: {
      client: { clientID, pin, clientSecret, qrDataUrl, sessionID },
      packageItems
    }
  };
};

// export const generateQrDataUrl = async (payload) => {
//   if (!payload || !payload.clientID) throw new Error("clientID required for QR");
//   const loginUrl = `http://localhost:5000/clients/login?clientID=${encodeURIComponent(payload.clientID)}`;
//   return QRCode.toDataURL(loginUrl, { errorCorrectionLevel: 'H', type: 'image/png', width: 300 });
// };

export const generateQrDataUrl = async (payload) => {
  if (!payload || !payload.tokenQr) throw new Error("tokenQr required for QR");

  // Replace with your front-end login URL
  const loginUrl = `http://192.168.50.26:3000/login?token=${encodeURIComponent(payload.tokenQr)}`;

  return QRCode.toDataURL(loginUrl, { 
    errorCorrectionLevel: 'H', 
    type: 'image/png', 
    width: 300 
  });
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

