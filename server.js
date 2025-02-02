require('dotenv').config();

const { authenticate } = require('./middleware/auth');

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const deliveryRoutes = require("./routes/deliveryRoutes");

const app = express();
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

app.use("", authenticate, deliveryRoutes);

const port = process.env.PORT || 3006;
app.listen(port, () => {
  console.log(`Delivery Service running on port ${port}`);
});
