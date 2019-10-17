var express = require("express");
var exphbs = require("express-handlebars");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");
var PORT = process.env.PORT || 3000;

var app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.engine("handlebars", exphbs({defaultLayout: "main"}));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI);

app.get("/", function(req, res) {
    db.Article.find({}, null, {sort: {created: -1}}, function(err, data) {
        if(data.length === 0) {
            res.render("placedholder", {message: "There's nothing scraped yet. Please click \"Scrape For Newest Articles\" for fresh and delicious news."});
        } else {
            res.render("index", {articles, data});
        }
    });
});

app.get("/scrape", function(req, res) {
    axios.get("https://www.nytimes.com/section/world").then(function(response) {
        var $ = cheerio.load(response.data);
        var result = {};
        $("div.story-body").each(function(i, element) {
            var link = $(element).find("a").attr("href");
            var title = $(element).find("h2.headline").text().trim();
            var summary = $(element).find("p.summary").text().trim();
            var img = $(element).parent().find("figure.media").find("img").attr("src");
            result.link = link;
            result.title = title;
            if(summary) {
                result.summary = summary;
            };
            if(img) {
                result.img = img;
            } else {
                result.img = $(element).find(".wide-thumb").find("img").attr("src");
            };
            db.Article.create(result).then(function(dbArticle) {
                console.log(dbArticle);
            }).catch(function(err) {
                console.log(err);
            });
        });
        //res.send("Scrape Complete!");
        console.log("Scrape finished.");
        res.redirect("/");
    });
});

app.get("/saved", function(req, res) {
    db.Article.find({issaved: true}, null, {sort: {created: -1}}, function(err, data) {
        if(data.length === 0) {
            res.render("placeholder", {message: "You have not saved any articles yet. Try to save some delicious news by simply clicking \"Save Article\"!"});
        } else {
            res.render("saved", {saved: data});
        }
    });
});

app.get("/:id", function(req, res) {
    db.Article.findById(req.params.id, function(err, data) {
        res.json(data);
    })
})

app.post("/search", function(req, res) {
    console.log(req.body.search);
    db.Article.find({$text: {$search: req.body.search, $caseSensitive: false}}, null, {sort: {created: -1}}, function(err, data) {
        console.log(data);
        if(data.length === 0) {
            res.render("placeholder", {message: "Nothing has been found. Please try other keywords."});
        } else {
            res.render("search", {search: data});
        }
    })
});

app.post("/save/:id", function(req, res) {
    db.Article.findById(req.params.id, function(err, data) {
        if(data.issaved) {
            db.Article.findByIdAndUpdate(req.params.id, {$set: {issaved: false, status: "Save Article"}}, {new: true}, function(err, data) {
                res.redirect("/");
            });
        } else {
            db.Article.findByIdAndUpdate(req.params.id, {$set: {issaved: true, status: "Saved"}}, {new: true}, function(err, data) {
                res.redirect("/saved");
            });
        }
    });
});

app.post("/note/:id", function(req, res) {
    db.Note.save(function(err, doc) {
        if(err) throw err;
        db.Article.findByIdAndUpdate(req.params.id, {$set: {"note": doc._id}}, {new: true}, function(err, newdoc) {
            if(err) throw err;
            else {
                res.send(newdoc);
            }
        });
    });
});

app.get("/note/:id", function(req, res) {
    var id = req.params.id;
    db.Article.findById(id).populate("note").exec(function(err, data) {
        res.send(data.note);
    });
});

app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});