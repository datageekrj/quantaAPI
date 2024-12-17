const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config(); 

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// MongoDB connection URI and details
const uri = process.env.MONGODB_URI;
const dbName = "testData";
const collectionName = "testData";

// API Endpoint
app.post('/getProblems', async (req, res) => {
    const client = new MongoClient(uri);

    try {
        // Connect to MongoDB
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection(collectionName);

        // Get the list of problem_ids from the request body
        const ids = req.body.ids; // Expects { "ids": ["id1", "id2", ...] }

        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: "Invalid input. 'ids' should be an array." });
        }

        // Query MongoDB to find matching documents
        const query = { problem_id: { $in: ids } };
        const documents = await collection.find(query).toArray();

        // Format the response
        const response = {};
        documents.forEach(doc => {
            response[doc.problem_id] = doc.problem_statement;
        });

        // Send the formatted response
        res.json(response);

    } catch (error) {
        console.error("Error fetching problem statements:", error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        await client.close();
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});