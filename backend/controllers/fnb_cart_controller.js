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
}

// View cart
export const viewCart = async (req, res) => {
  try {
    const { clientID } = req.params;

    if (!clientID) {
      return error(res, "Missing required parameter: clientID", 400);
    }

    const cart = await Model.viewCart(clientID);

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
    const { clientID, sessionID } = req.params;

    if (!clientID && !sessionID) {
      return error(res, "Missing required parameter: clientID or sessionID", 400);
    }

    const cart = await Model.viewCart(clientID, sessionID);

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
      acc[key].total += item.total || 0;
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
    const { clientID, items, productID, quantity } = req.body;

    if (!clientID) {
      return error(res, "Missing required field: clientID", 400);
    }

    // Normalize input: single item to array items
    let itemsArray = [];
    if (Array.isArray(items) && items.length > 0){
      itemsArray = items;
    } else if (productID && quantity){
      itemsArray = [{ productID, quantity }];
    } else {
      return error(res, "Invalid item format", 400);
    }

    // Add the items to cart
    await Model.addItems(clientID, itemsArray);
    // Retrieve added items
    const cartItems = await Model.viewCart(clientID);
    // Filter only
    const addedProducts = cartItems
      .filter(item => itemsArray.some(i => i.productID === item.productID))
      .map(c => ({
        productID: c.productID,
        description: c.productName,
        qty: c.quantity,
        amount: c.price,
        total: c.total
      }));
    return success(res, addedProducts, "Items added to cart successfully");
  } catch (e) {
    return error(res, e.message, 500);
  }
}

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
    const { clientID, paymentType = "Package" } = req.body; // default to "Package"
    const staffID = req.user?.staffID || null;

    if (!clientID) {
      return error(res, "Missing required field: clientID", 400);
    }

    // Perform checkout (handles deduction + order creation)
    const receipt = await Model.checkout(clientID, paymentType, staffID);

    // 🧾 Group items by productID (no sizeId)
    const grouped = receipt.items.reduce((acc, item) => {
      const key = `${item.productID}`;
      if (!acc[key]) {
        acc[key] = {
          productID: item.productID,
          description: item.description,
          qty: 0,
          amount: item.amount,
          total: 0
        };
      }
      acc[key].qty += item.qty;
      acc[key].total += item.amount * item.qty;
      return acc;
    }, {});

    const itemsArray = Object.values(grouped);
    const totalAmount = itemsArray.reduce((sum, i) => sum + i.total, 0);

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
    const { clientID, productID, quantity, sizeId } = req.body;

    if (!clientID || !productID || !quantity || !sizeId) {
      return error(res, "Missing required fields: clientID, productID, quantity, sizeId", 400);
    }
    
    const result = await Model.updateItem(clientID, productID, quantity, sizeId);
    return success(res, null, "Cart item updated successfully");
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ----------------------DELETE-------------------------
// Remove item from cart
export const removeItem = async (req, res) => {
  try {
    const { clientID, productID } = req.body;

    if (!clientID || !productID) {
      return error(res, "Missing required fields: clientID, productID", 400);
    }

    await Model.removeItem(clientID, productID);
    return success(res, null, "Item removed from cart");
  } catch (e) {
    return error(res, e.message, 500);
  }
};

