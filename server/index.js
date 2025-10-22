import express from "express";
import dotenv from "dotenv";
import provinceRoutes from "./routes/provinces.js";
import communeRoutes from "./routes/communes.js";
import convertRoutes from "./routes/convert.js";
import unitsRoutes from "./routes/units.js";
dotenv.config();
const app = express();
app.use(express.json());
app.use("/provinces", provinceRoutes);
app.use("/communes", communeRoutes);
app.use("/convert", convertRoutes);
app.use("/units", unitsRoutes);
console.log("✅ Routes loaded: /units");
app.get("/", (req, res) => {
  res.json({
    message: "Cas AddressKit API Proxy ✅",
    routes: ["/provinces", "/communes", "/convert", "/units"],
  });
});

export default app;
