const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ufymyeh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Mongo Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(process.env.DB_NAME);
    const donorsCollection = db.collection("donors");

    // Root route
    app.get("/", (req, res) => {
      res.send("🚀 Backend is running!");
    });

    // Get all donors
    app.get("/donors", async (req, res) => {
      const donors = await donorsCollection.find().toArray();
      res.send(donors);
    });

    // Get a single donor by ID
    app.get("/donors/:id", async (req, res) => {
      const id = req.params.id;
      const donor = await donorsCollection.findOne({ _id: new ObjectId(id) });
      res.send(donor);
    });

    // Add a donor
    app.post("/donors", async (req, res) => {
      const newDonor = req.body;
      const result = await donorsCollection.insertOne(newDonor);
      res.send(result);
    });

    // Update donor by ID
    app.put("/donors/:id", async (req, res) => {
      const id = req.params.id;
      const updatedDonor = req.body;
      const result = await donorsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedDonor }
      );
      res.send(result);
    });

    // Delete donor by ID
    app.delete("/donors/:id", async (req, res) => {
      const id = req.params.id;
      const result = await donorsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // Start server
    app.listen(port, () => {
      console.log(`✅ Server is running on port ${port}`);
    });
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err);
  }
}

run();
