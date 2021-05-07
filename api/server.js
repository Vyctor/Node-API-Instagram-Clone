var express = require("express"),
    bodyParser = require("body-parser"),
    multiparty = require("connect-multiparty"),
    mongodb = require("mongodb"),
    objectId = require("mongodb").ObjectId,
    fs = require("fs");

var app = express();

// body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multiparty());
app.use(function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
});

var port = 8080;

app.listen(port);

const db = mongodb.MongoClient.connect(
    "mongodb://localhost:27017",
    (err, client) => client.db("instagram")
);

app.get("/", function(req, res) {
    res.send({ msg: "Olá" });
});

// POST (create)
app.post("/api", function(req, res) {
    var date = new Date();
    time_stamp = date.getTime();

    var url_imagem = time_stamp + "_" + req.files.arquivo.originalFilename;

    var path_origem = req.files.arquivo.path;
    var path_destino = "./uploads/" + url_imagem;

    fs.rename(path_origem, path_destino, function(err) {
        if (err) {
            res.status(500).json({ error: err });
            return;
        } else {
            var dados = {
                url_imagem: url_imagem,
                titulo: req.body.titulo,
            };

            mongodb.MongoClient.connect("mongodb://localhost:27017", (err, client) =>
                client.db("instagram").collection("postagens", (err, collection) => {
                    collection.insertOne(dados, (err, records) => {
                        err
                            ?
                            res.json({ status: "erro" }) :
                            res.json({ status: "inclusão realizada com sucesso" });
                        client.close();
                    });
                })
            );
        }
    });
});

// GET (read)
app.get("/api", function(req, res) {
    mongodb.MongoClient.connect("mongodb://localhost:27017", (err, client) =>
        client.db("instagram").collection("postagens", (err, collection) => {
            collection.find().toArray((err, results) => {
                if (err) {
                    res.json(err);
                } else {
                    res.json(results);
                }
                client.close();
            });
        })
    );
});

// GET BY ID (read)
app.get("/api/:id", function(req, res) {
    var dados = req.body;

    mongodb.MongoClient.connect("mongodb://localhost:27017", (err, client) =>
        client.db("instagram").collection("postagens", (err, collection) => {
            collection.find(objectId(req.params.id)).toArray((err, results) => {
                if (err) {
                    res.json(err);
                } else {
                    res.json(results);
                }
                client.close();
            });
        })
    );
});

// GET IMAGE
app.get("/imagens/:imagem", function(req, res) {
    var img = req.params.imagem;

    console.log(img);

    fs.readFile("./uploads/" + img, function(err, content) {
        if (err) {
            res.status(400).json(err);
            return;
        }
        res.writeHead(200, { "content-type": "image/jpg" });
        res.end(content);
    });
});

// PUT by ID (update)
app.put("/api/:id", function(req, res) {
    mongodb.MongoClient.connect("mongodb://localhost:27017", (err, client) =>
        client.db("instagram").collection("postagens", (err, collection) => {
            collection.updateOne({ _id: objectId(req.params.id) }, {
                    $push: {
                        comentarios: {
                            id_comentario: new objectId(),
                            comentario: req.body.comentario,
                        },
                    },
                }, {},
                function(err, records) {
                    err ? res.json(err) : res.json(records);
                    client.close();
                }
            );
        })
    );
});

// Delete by ID (delete)
app.delete("/api/:id", function(req, res) {
    mongodb.MongoClient.connect("mongodb://localhost:27017", (err, client) =>
        client.db("instagram").collection("postagens", (err, collection) => {
            collection.updateOne({}, {
                    $pull: {
                        comentarios: { id_comentario: objectId(req.params.id) },
                    },
                }, { multi: true },
                function(err, records) {
                    err ? res.json(err) : res.json(records);
                    client.close();
                }
            );
        })
    );
});