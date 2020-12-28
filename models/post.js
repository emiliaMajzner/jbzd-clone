const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MemeSchema = new Schema({
    title: String,
    img: String,
    tags: String,
    creationDate: Date,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})
module.exports = mongoose.model('Meme', MemeSchema);