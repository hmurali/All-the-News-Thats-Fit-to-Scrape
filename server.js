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
app.engine("handlebars", exphbs({defaultLayout: "main" }));
app.set("view engine", "handlebars");

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
console.log(MONGODB_URI);
mongoose.connect(MONGODB_URI);

app.get("/", function(req, res) {
    db.Article.find({}, null, {sort: {created: -1}}, function(err, data) {
        if(data.length === 0) {
            res.render("placeholder", {message: "There's nothing scraped yet. Please click \"Scrape For Newest Articles\" for fresh and delicious news."});
        } else {
            res.render("index", {Article, data});
        }
    });
});

app.get("/scrape", function(req, res) {
    console.log("about to scrape");
    axios.get("https://www.nytimes.com/section/world").then(function(response) {
        //console.log(response.data);
        var $ = cheerio.load(response.data);
        var result = {};
        var results = [];
        $("div.story-body").each(function(i, element) {
            var link = $(element).find("div.css-10wtrbd").find("h2.css-12vidh.e4e4i5l1").find("a").attr("href");
            console.log("Link: " + link);
            var title = $(element).find("div.css-10wtrbd").find("h2.css-12vidh.e4e4i5l1").find("a").attr("href").text().trim();
            console.log("title: " + title);
            var summary = $(element).find("div.css-10wtrbd").find("p.css-1gh531.e4e4i514").text().trim();
            console.log("summary: " + summary);
            var img = $(element).find("figure.photo.css-1ag53q4.e1oaj3z10").find("a").attr("href").find("img").attr("src");
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
            results.push(result);
        });
        const promises = results.map(function(result){
            console.log("String saving", result);
            return db.Article.create(result)
        }) 
        Promise.all(promises)
            .then(function(dbArticle) {
                res.send("Scrape Complete!");
                console.log("Scrape finished.");
                console.log(dbArticle);
            }).catch(function(err) {
                console.log(err);
            });
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