const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// MongoDB connection URI and client
const uri =
  "mongodb+srv://admin:admin@cluster0.wddk5sa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect once, reuse client
let donorsCollection;

async function connectDB() {
  try {
    await client.connect();
    donorsCollection = client.db("yourDatabaseName").collection("donors");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
}
connectDB();

// Enable CORS for your frontend origin (adjust if needed)
app.use(cors());

// Multer setup to save uploaded files to /uploads folder
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp + original name
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Parse JSON bodies (for non-file requests)
app.use(express.json());

// POST /api/donors - handle donor form submission with photo upload
app.post("/api/donors", upload.single("photo"), async (req, res) => {
  try {
    const {
      name,
      address,
      phone,
      bloodGroup,
      lastDonation,
      occupation,
      disease,
      age,
      gender,
      medicalHistory,
      email,
      status, // expected to be 'pending' from frontend
    } = req.body;

    // File info
    const photoFile = req.file;

    if (!name || !email || !phone || !bloodGroup || !gender) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Build donor document
    const donorDoc = {
      name,
      address,
      phone,
      bloodGroup,
      lastDonation: lastDonation || null,
      occupation: occupation || null,
      disease: disease || null,
      age: age ? parseInt(age) : null,
      gender,
      medicalHistory: medicalHistory || null,
      email,
      status: status || "pending",
      photo: photoFile ? `/uploads/${photoFile.filename}` : null,
      createdAt: new Date(),
    };

    // Insert into DB
    const result = await donorsCollection.insertOne(donorDoc);

    res.status(201).json({ message: "Donor submitted successfully", donorId: result.insertedId });
  } catch (err) {
    console.error("Error in /api/donors:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Serve uploaded images statically
app.use("/uploads", express.static(uploadDir));

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
