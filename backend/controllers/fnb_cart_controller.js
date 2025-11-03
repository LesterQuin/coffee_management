// controllers/fnb_cart_controller.js
import { group } from "console";
import * as Model from "../models/fnb_cart_model.js";
import { success, error } from "../utils/response_helper.js";

// ----------------------GET-------------------------
// export const viewAllCarts = async (req, res) => {
//   try {
//     const carts = await Model.viewAllCarts();

//     // Group items by cartID
//     const grouped = carts.reduce((acc, item) => {
//       if (!acc[item.cartID]) {
//         acc[item.cartID] = {
//           cartID: item.cartID,
//           clientID: item.clientID,
//           deceasedName: item.deceasedName,
//           customerName: item.customerName,
//           customerNumber: item.customerNumber,
//           items: [],
//           totalAmount: 0
//         };
//       }
//       acc[item.cartID].items.push({
//         cartItemID: item.cartItemID,
//         productID: item.productID,
//         description: item.productName,
//         qty: item.quantity,
//         sizeId: item.sizeId,
//         amount: item.price,
//         total: item.total
//       });
//       acc[item.cartID].totalAmount += item.total;
//       return acc;
//     }, {});

//     return success(res, Object.values(grouped), "All carts retrieved successfully");
//   } catch (e) {
//     return error(res, e.message, 500);
//   }
// };
export const viewAllCarts = async (req, res) => {
  try {
    const carts = await Model.viewAllCarts();

    // Group items by cartID and then by productID + sizeId
    const groupedCarts = carts.reduce((acc, item) => {
      if (!acc[item.cartID]) {
        acc[item.cartID] = {
          cartID: item.cartID,
          clientID: item.clientID,
          sessionID: item.sessionID,      // added sessionID
          deceasedName: item.deceasedName,
          customerName: item.customerName,
          customerNumber: item.customerNumber,
          items: [],
          totalAmount: 0
        };
      }

      const cart = acc[item.cartID];

      // Group items by productID + sizeId
      const key = `${item.productID}_${item.sizeId}`;
      let groupedItem = cart.items.find(i => i.productID === item.productID && i.sizeId === item.sizeId);

      if (!groupedItem) {
        groupedItem = {
          productID: item.productID,
          description: item.productName,
          sizeId: item.sizeId,
          qty: 0,
          amount: item.price,
          total: 0
        };
        cart.items.push(groupedItem);
      }

      groupedItem.qty += item.quantity;
      groupedItem.total += item.total || 0;
      cart.totalAmount += item.total || 0;

      return acc;
    }, {});

    return success(res, Object.values(groupedCarts), "All carts retrieved successfully");
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// View cart
export const viewCart = async (req, res) => {
  try {
    const { clientID, sessionID } = req.params;

    if (!clientID && !sessionID) {
      return error(res, "Missing required parameter: clientID or sessionID", 400);
    }

    // Fetch cart based on sessionID if provided, otherwise by clientID
    const cart = sessionID 
      ? await Model.viewCartBySession(parseInt(sessionID, 10)) 
      : await Model.viewCart(parseInt(clientID, 10));

    if (!cart || cart.length === 0) {
      return success(res, { items: [], totalAmount: 0 }, "Cart is empty");
    }

    // Group by productID
    const grouped = cart.reduce((acc, item) => {
      const key = `${item.productID}`;
      if (!acc[key]) {
        acc[key] = {
          productID: item.productID,
          description: item.productName,
          qty: 0,
          amount: item.price,
          total: 0
        };
      }
      acc[key].qty += item.quantity;
      acc[key].total += item.total || item.price * item.quantity;
      return acc;
    }, {});

    const itemsArray = Object.values(grouped);
    const totalAmount = itemsArray.reduce((sum, i) => sum + i.total, 0);

    return success(res, { items: itemsArray, totalAmount }, "Cart retrieved successfully");
  } catch (e) {
    return error(res, e.message, 500);
  }
};

export const viewCartSession = async (req, res) => {
  try {
    const sessionID = parseInt(req.params.sessionID, 10);
    if (isNaN(sessionID)) return error(res, "Invalid sessionID", 400);

    const cart = await Model.viewCartBySession(sessionID);

    if (!cart || cart.length === 0) {
      return success(res, { items: [], totalAmount: 0 }, "Cart is empty");
    }

    // Group items by productID + sizeId
    const grouped = cart.reduce((acc, item) => {
      const key = `${item.productID}_${item.sizeId}`;
      if (!acc[key]) {
        acc[key] = {
          productID: item.productID,
          categoryID: item.categoryId,
          categoryName: item.categoryName,  // if you join category table
          productName: item.productName,
          size: item.size,
          sizeId: item.sizeId,
          qty: 0,
          amount: item.price,
          total: 0
        };
      }

      acc[key].qty += item.qty;
      acc[key].amount = item.price;  // price per item
      acc[key].total += item.total || item.price * item.qty;

      return acc;
    }, {});

    const itemsArray = Object.values(grouped);
    const totalAmount = itemsArray.reduce((sum, i) => sum + i.total, 0);

    return success(res, { items: itemsArray, totalAmount }, "Cart retrieved successfully");
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ----------------------POST-------------------------
// export const addItem = async (req, res) => {
//   try {
//     const { clientID, productID, quantity, sizeId } = req.body;

//     if (!clientID || !productID || !quantity || !sizeId) {
//       return error(res, "Missing required fields: clientID, productID, quantity, sizeId", 400);
//     }

//     await Model.addItem(clientID, productID, quantity, sizeId);
//     return success(res, null, "Item added to cart");
//   } catch (e) {
//     return error(res, e.message, 500);
//   }
// }; 10/30

export const addItems = async (req, res) => {
  try {
    const { clientID, sessionID, items, productID, quantity, sizeId } = req.body;

    if (!clientID && !sessionID) {
      return error(res, "Missing required field: clientID or sessionID", 400);
    }

    // Normalize input
    let itemsArray = [];
    if (Array.isArray(items) && items.length > 0) {
      itemsArray = items.map(i => ({ productID: i.productID, quantity: i.quantity, sizeId: i.sizeId || null }));
    } else if (productID && quantity) {
      itemsArray = [{ productID, quantity, sizeId: sizeId || null }];
    } else {
      return error(res, "Invalid item format", 400);
    }

    // Add items to cart
    await Model.addItems(clientID, itemsArray, sessionID);

    // Fetch updated cart
    const cartItems = sessionID
      ? await Model.viewCartBySession(sessionID)
      : await Model.viewCart(clientID);

    // Filter only added items
    const addedProducts = cartItems
      .filter(item => itemsArray.some(i => i.productID === item.productID && i.sizeId === item.sizeId))
      .map(c => ({
        productID: c.productID,
        description: c.productName,
        size: c.size || 'N/A',
        qty: c.quantity,
        amount: c.price,
        total: c.total
      }));

    return success(res, addedProducts, "Items added to cart successfully");
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// Checkout cart
// export const checkout = async (req, res) => {
//   try {
//     const { clientID, paymentType } = req.body;
//     const staffID = req.user.staffID;

//     if (!clientID || !paymentType) {
//       return error(res, "Missing required fields: clientID, paymentType", 400);
//     }

//     const result = await Model.checkout(clientID, paymentType, staffID);
    
//     const receipt = await Model.getOrderReceipt(result.orderID);

//     return success(res, receipt, "Cart checked out and order created successfully");
//   } catch (e) {
//     return error(res, e.message, 500);
//   }
// };
export const checkout = async (req, res) => {
  try {
    const { clientID = null, sessionID = null } = req.body;
    const staffID = req.user?.staffID || null;

    if (!clientID && !sessionID) {
      return error(res, "Missing required fields: clientID or sessionID", 400);
    }

    // Perform checkout
    const receipt = await Model.checkout(clientID, sessionID, staffID);

    // If cart is empty, fetch items from the newly created order
    let itemsArray = [];
    let totalAmount = 0;

    if (receipt.items.length === 0 && receipt.orderID) {
      const orderData = await Model.getOrderReceipt(receipt.orderID);
      if (orderData && orderData.items.length) {
        itemsArray = orderData.items.map(i => ({
          productID: i.productID,
          description: i.description,
          qty: i.qty,
          amount: i.amount,
          total: i.qty * i.amount
        }));
        totalAmount = orderData.total;
      }
    } else {
      // Group items by productID
      const grouped = receipt.items.reduce((acc, item) => {
        const key = `${item.productID}`;
        if (!acc[key]) {
          acc[key] = {
            productID: item.productID,
            description: item.description,
            qty: 0,
            amount: item.amount || 0
          };
        }
        acc[key].qty += item.qty;
        return acc;
      }, {});
      itemsArray = Object.values(grouped);
      totalAmount = itemsArray.reduce((sum, i) => sum + (i.total || i.qty * i.amount), 0);
    }

    const responseData = {
      ...receipt,
      items: itemsArray,
      totalAmount
    };

    return success(res, responseData, "Checkout successful and order created");
  } catch (e) {
    return error(res, e.message, 500);
  }
};
// ----------------------PUT-------------------------
// Update item quantity or size
export const updateItem = async (req, res) => {
  try {
    const { clientID, sessionID, productID, quantity, sizeId } = req.body;

    if ((!clientID && !sessionID) || !productID || !quantity) {
      return error(res, "Missing required fields: clientID or sessionID, productID, quantity", 400);
    }

    const result = await Model.updateItem(clientID, sessionID, productID, quantity, sizeId);
    return success(res, null, result.message);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ----------------------DELETE-------------------------
// Remove item from cart
export const removeItem = async (req, res) => {
  try {
    const { clientID, sessionID, productID } = req.body;

    if ((!clientID && !sessionID) || !productID) {
      return error(res, "Missing required fields: clientID or sessionID, productID", 400);
    }

    // Call model with clientID or sessionID
    await Model.removeItem(clientID, productID, sessionID);

    return success(res, null, "Item removed from cart");
  } catch (e) {
    return error(res, e.message, 500);
  }
};
