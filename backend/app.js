// app.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import chapelRoutes from "./routes/chapel_info_route.js";
import clientsRoutes from "./routes/clients_info_route.js";
import staffRoutes from "./routes/staff_info_route.js";
import productsRoutes from "./routes/products_info_route.js";
import packagesRoutes from "./routes/packages_info_route.js";
import ordersRoutes from "./routes/orders_info_route.js";
import sessionsRoutes from "./routes/sessions_info_route.js";
import cartRoutes from "./routes/fnb_cart_route.js";
import paymentRoutes from "./routes/payment_route.js";
import errorHandler from "./middleware/error_handler.js";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));

app.use("/api/chapels", chapelRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/packages", packagesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentRoutes);

app.use(errorHandler);
export default app;
