require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// Validate required env vars
if (!process.env.MONGO_URI) {
  console.error("ERROR: MONGO_URI environment variable is not set");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET environment variable is not set");
  process.exit(1);
}

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
