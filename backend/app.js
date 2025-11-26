import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import corsOptions from "./config/corsOptions.js";
import cookieParser from "cookie-parser";

import { apiLimiter } from "./middleware/limiter.js";

// Import routes
import staffRoutes from "./routes/staff_info_route.js";
import chapelRoutes from "./routes/chapel_info_route.js";
import clientRoutes from "./routes/clients_info_route.js";
import orderRoutes from "./routes/orders_info_route.js";
import sessionRoutes from "./routes/sessions_info_route.js";
import fnbRoutes from "./routes/fnb_info_route.js";
import cartRoutes from "./routes/fnb_cart_route.js";
import paymentRoutes from "./routes/payment_route.js";
import reportRoute from "./routes/reports_routes.js";
import fnbPackageRoutes from "./routes/fnb_package_route.js"
import tableRoutes from "./routes/table_routes.js"
import DefaultPackageRoute  from "./routes/default_package_routes.js";

const app = express();

app.use(cookieParser());

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

app.use(apiLimiter);

// API routes
app.use("/api/staff", staffRoutes);
app.use("/api/chapel", chapelRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/fnb", fnbRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/reports", reportRoute);
app.use("/api/fnb", fnbPackageRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/defaultpackage", DefaultPackageRoute);

app.get("/", (req, res) => {
  res.send("Coffee Shop Chapel System API is running 🚀");
});

export default app;
