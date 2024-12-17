const express = require('express');
const cors = require('cors'); // Import CORS middleware
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI;


// CORS configuration
const corsOptions = {
    origin: 'https://www.quanta.world', // Allow requests from your Webflow site
    optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions)); // Enable CORS for specific origin
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello from Express server deployed on Render!');
});

// Example API endpoint
app.post('/getProblems', async (req, res) => {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const database = client.db("testData");
        const collection = database.collection("testData");

        const ids = req.body.ids;

        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: "Invalid input. 'ids' should be an array." });
        }

        const query = { problem_id: { $in: ids } };
        const documents = await collection.find(query).toArray();

        const response = {};
        documents.forEach(doc => {
            response[doc.problem_id] = doc.problem_statement;
        });

        res.json(response);

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        await client.close();
    }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});
