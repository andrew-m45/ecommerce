// import dependencies
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const cors = require('cors');
var path = require("path");
var fs = require("fs");
// create express instance
const app = express();

// express middleware
app.use(express.json());
app.set('port', 3000);
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "*");
    next();
});
app.use(cors());

// logger middleware
app.use(function (req, res, next) {
    console.log("Request IP: " + req.url);
    console.log("Request date: " + new Date());
    next();
});


// connect to MongoDB
let db;
MongoClient.connect('mongodb+srv://andrew:andrew996@cluster0.yqshl.mongodb.net/test', (err, client) => {
    db = client.db('webstore');
});

// dispaly a message for root path
app.get('/', (req, res, next) => {
    res.send('Select a collection, e.g., /collection/products')
});

// get the collection name, setting the url pattern
app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName)
    return next()
})

// retrieve all the objects from an collection
app.get('/collection/:collectionName', (req, res, next) => {
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e)
        res.send(results)
    });
});

app.post('/collection/:collectionName/search', (req, res, next) => {
    // query from the search
    let query = req.body.query.trim();
    console.log(query);
    // finidng matches on location or name
    req.collection.find({
        $or: [
            { title: { $regex: new RegExp(query, 'i') } },
            { location: { $regex: new RegExp(query, 'i') } }
        ]
        // collect results in an array and send response
    }).toArray((e, results) => {
        if (e) return next(e)
        res.send(results)
        // console.log(results);
    });

});

// adding post
app.post('/collection/:collectionName', (req, res, next) => {
    req.collection.insert(req.body, (e, results) => {
        if (e) return next(e)
        res.send(results.ops)
    });
});

// return with object id 
const ObjectID = require('mongodb').ObjectID;
app.get('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.findOne({ _id: new ObjectID(req.params.id) }, (e, result) => {
        if (e) return next(e)
        res.send(result)
    });
});


//update an object 
app.put('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.updateOne(
        { _id: new ObjectID(req.params.id) },
        { $set: req.body },
        { safe: true, multi: false },
        (e, result) => {
            if (e) return next(e)
            res.send(result.modifiedCount === 1 ? { msg: "success" } : { msg: "error" });
        });
});


// PUT route to reduce value of specified attribute of the record in database
app.put('/collection/:collectionName/:id/reduce/:name/:value', (req, res, next) => {

    console.log(req.params.id);
    let value = -1 * parseInt(req.params.value);
    let name = req.params.name;

    const attr = {};
    attr[name] = value;

    req.collection.updateOne(
        { _id: new ObjectID(req.params.id) },
        { "$inc": attr },
        { safe: true, multi: false },
        (e, result) => {
            // if (e || result.result.n !== 1) return next();
            // res.json({ message: 'success' });
            if (e) return next(e)
            res.send(result.modifiedCount === 1 ? { msg: "success" } : { msg: "error" });
        });
});

app.use(function (req, res, next) {
    // Uses path.join to find the path where the file should be
    var filePath = path.join(__dirname, "assests", req.url);
    // Built-in fs.stat gets info about a file
    fs.stat(filePath, function (err, fileInfo) {
        if (err) {
            next();
            return;
        }
        if (fileInfo.isFile()) res.sendFile(filePath);
        else next();
    });
});



const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Server running at localhost:3000');
});
