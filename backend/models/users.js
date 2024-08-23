const mongoose = require ('mongoose');

const userSchema = mongoose.Schema({
    email: {type: String, required:true}, //attention: email user [unique]
    password: {type: String, required:true}, //attention: mdp devra être haché par le user.
});

module.exports = mongoose.model('User', userSchema);