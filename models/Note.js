var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var Notesschema = new Schema({
    title: {
        type: String,
    },
    body: {
        type: String,
    }
});

var Note = mongoose.model("Note", Notesschema);
module.exports = Note;