import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import staffRoutes from "./routes/staff_info_route.js";
import chapelRoutes from "./routes/chapel_info_route.js";
import clientRoutes from "./routes/clients_info_route.js";
import productRoutes from "./routes/products_info_route.js";
import packageRoutes from "./routes/packages_info_route.js";
import orderRoutes from "./routes/orders_info_route.js";
import sessionRoutes from "./routes/sessions_info_route.js";
import fnbRoutes from "./routes/fnb_info_route.js";
import cartRoutes from "./routes/fnb_cart_route.js";
import paymentRoutes from "./routes/payment_route.js";

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Define route base paths
app.use("/api/staff", staffRoutes);
app.use("/api/chapel", chapelRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/products", productRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/fnb", fnbRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Coffee Shop Chapel System API is running 🚀");
});

export default app;
