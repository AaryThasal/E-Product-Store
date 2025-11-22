import express from "express"; 
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

import productRoutes from "./routes/productRoutes.js";
import { sql } from "./config/db.js";
import { aj } from "./lib/arcjet.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

app.use(helmet({
  contentSecurityPolicy: false,
})); // used for security headers 
app.use(morgan("dev")); // used for logging requests
app.use(cors()); 
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    const decision = await aj.protect(req, {
      requested:1,
    });

    if(decision.isDenied()){
      if(decision.reason.isRateLimit()) {
        res.status(429).json({ error: "Too Many Requests" });
      }else if(decision.reason.isBot()) {
        res.status(403).json({ error: " Bot Access Denied" });
      } else {
        res.status(403).json({ error: "Access Denied" });
      }
      return;
    }
    // checking for spoofed bots
    if(decision.results.some((result) => result.reason.isBot() && result.reason.isSpoofed())) {
      res.status(403).json({ error: "Spoofed Bot Access Denied" });
      return;    
    }
    next(); 
  } catch (error) {
    console.error("Arcjet protection error:", error);
    next(error);
  }
})

app.use("/api/products", productRoutes);

if(process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.use((req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

async function initDB() {
  try {
    await sql`
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(250) NOT NULL,
            image VARCHAR(500) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    console.log("Database connected and ensured products table exists.");
  } catch (error) { 
    console.error("Database connection failed:", error);
  }
}
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});