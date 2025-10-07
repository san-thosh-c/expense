const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyparser = require("body-parser");
const path = require("path");
const cors = require("cors");
const { type } = require("os");
app.use(express.json());
app.use(cors());
app.use(express.static("public"));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.set("view engine", "ejs");

mongoose.connect("mongodb+srv://admin_db:Welcome%402468@cluster0.6jgdplr.mongodb.net/Expense_Tracker", {
  tls: true,
}).then(() => console.log("MongoDB connected successfully"))
.catch(err => console.error("MongoDB connection error:", err));

const tripSchema = new mongoose.Schema({
  tripname: { type: String, required: true },
});

const userSchema = new mongoose.Schema({
  guestname: {
    type: String,
    required: true,
  },
  flatNumber: {
    type: String,
    required: true,
  },
  adults: {
    type: Number,
    required: true,
  },
  kids: {
    type: Number,
    required: true,
  },
  trip_id: {
    type: String,
    required: true,
  },
  veg:{
    type: Number,
    required: true,
  },
  nv: {
    type: Number,
    required: true,   
  }
});

const expenseSchema = new mongoose.Schema({
  guestname: {
    type: String,
    required: true,
  },
  flatNumber: {
    type: String,
    required: true,
  },
  trip_id: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

const User = mongoose.model("persons", userSchema);
const trip = mongoose.model("Trip", tripSchema);
const expense = mongoose.model("Expense", expenseSchema);

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public/html", "index.html"));
});

app.get("/api/trip/:id", async (req, res) => {
  try {
    const trip_id = req.params.id;
    const records = await User.find({ trip_id }).lean();
    res.json(records);
  } catch (err) {
    console.error("Error fetching trip records:", err);
    res.status(500).json({ error: "Failed to fetch trip records" });
  }
});

app.get("/api/trips/:id", async (req, res) => {
  try {
    const trip_id = req.params.id;
    const exp_records = await expense.find({ trip_id }).lean();
    res.json(exp_records);
  } catch (err) {
    console.error("Error fetching expense records:", err);
    res.status(500).json({ error: "Failed to fetch expense records" });
  }
});

app.get("/api/trips", async (req, res) => {
  try {
    const trips = await trip.find().lean();
    res.json(trips);
  } catch (err) {
    console.error("Error fetching trips:", err);
    res.status(500).json({ error: "Failed to fetch trips" });
  }
});

app.post("/addtrip", async (req, res) => {
  try {
    const { tripname } = req.body;
    const newTrip = new trip({
      tripname,
    });

    console.log("newTrip = ", newTrip);

    await newTrip.save();
    return res.status(201).json({
      success: true,
      message: "User created successfully!",
    });
  } catch (err) {
    console.error("Error occurred while adding Trip:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred during Trip addition.",
    });
  }
});

app.post("/addguest", async (req, res) => {
  try {
    console.log("Guest request = ", req.body);
    const { guestname, flatNumber, adults, kids, trip_id } = req.body;
    const numAdults = parseInt(adults) || 0;
    const numKids = parseInt(kids) || 0;
    const fn = flatNumber;
    const existingUser = await User.findOne({ flatNumber: fn, trip_id: trip_id });
    console.log("existingUser = ", existingUser);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "flatNumber already exists.",
      });
    }
    const newUser = new User({
      guestname,
      flatNumber: fn,
      adults: numAdults,
      kids: numKids,
      trip_id,
    });
    await newUser.save();
    return res.status(201).json({
      success: true,
      message: "User created successfully!",
    });
  } catch (err) {
    console.error("Error occurred while adding Guest:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred during Guest addition.",
    });
  }
});

app.post("/addexpense", async (req, res) => {
  try {
    const { guestname, flatNumber, trip_id, category, amount } = req.body;
    console.log("req", req);
    const numamount = Number(amount);
    const newExp = new expense({
      guestname,
      flatNumber,
      category,
      amount: numamount,
      trip_id,
    });
    await newExp.save();
    return res.status(201).json({
      success: true,
      message: "Expense created successfully!",
    });
  } catch (err) {
    console.error("Error occurred while creating Expenses:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred during Expense addition.",
    });
  }
});

app.post("/addsettlement", async (req, res) => {
  try {
    const { trip_id, category, amount, guestname, flatNumber } = req.body;
    console.log("*******************REQUEST", req.body);
    const numamount = Number(amount);
    const newExp = new expense({
      guestname: guestname, 
      flatNumber: flatNumber,  
      category,
      amount: numamount,
      trip_id,
    });
    await newExp.save();
    return res.status(201).json({
      success: true,
      message: "Expense created successfully!",
    });
  } catch (err) {
    console.error("Error occurred while creating Expenses:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred during Expense addition.",
    });
  }
});

app.put("/update-expense/:id", async (req, res) => {
  const expenseId = req.params.id;
  const { amount } = req.body;

  try {
    const updatedExpense = await expense.findByIdAndUpdate(
      expenseId,
      { amount },
      { new: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (err) {
    console.error("Error updating expense:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while updating expense",
    });
  }
});

app.put("/update-guest/:id", async (req, res) => {
    console.log("req", req.body);
  const guestId = req.params.id;
  const { flatNumber, adults, kids, veg, nv } = req.body;

  try {
    const updatedGuest = await User.findByIdAndUpdate(
      guestId,
      { flatNumber, adults, kids, veg, nv },
      { new: true }
    );

    if (!updatedGuest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Guest details updated successfully",
      data: updatedGuest,
    });
  } catch (err) {
    console.error("Error updating guest:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while updating guest",
    });
  }
});

// Start the server on port 3000
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
