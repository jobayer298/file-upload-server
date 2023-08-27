const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const multer = require("multer");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// const uploads = multer({ dest: "./uploads" });


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});


const uploads = multer({ storage: storage });

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.je2pvxf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("fileUploading"); 
    const filesCollection = db.collection("files");
    const dataCollection = client.db("fileUploading").collection("data")

    app.post("/upload/:id", uploads.array("files", 12), async function (req, res, next) {
      const fileData = req.files.map((file) => ({
        originalName: file.originalname,
        mimeType: file.mimetype,
        filePath: file.path,
        postedBy: req.params.id,
      }));
      const files = parseInt(req.params.id);

      try {
        const result = await filesCollection.insertMany(fileData);
        console.log("Files saved in MongoDB:", result.insertedCount);
        // Update total_files in the data collection by adding the new files count
        res.json({ status: "file received and saved" });
      } catch (error) {
        console.error("Error saving files:", error);
        res.status(500).json({ error: "An error occurred while saving files" });
      }
    })

    app.get("/data", async(req, res) =>{
      const result = await dataCollection.find().toArray()
      res.send(result)
    })
    app.get("/fileCount/:id", async(req, res) =>{
      const id = req.params.id 
      const result =await filesCollection.find().toArray()
      const filterData = result.filter(f => f.postedBy === id)
      res.send(filterData);

    })

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("File uploading");
});

app.listen(port, (req, res) => {
  console.log("server is running");
});
