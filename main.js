require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./config/mongoose");
const pubkeyRoutes = require("./routes/pubkeyRoutes");
const mainRoutes = require("./routes/mainRoutes");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));

// Routes
app.use("/api/pubkeys", pubkeyRoutes);
app.use("/api/request", mainRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
