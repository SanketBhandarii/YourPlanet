import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    thought : {
        type : String,
        maxlength : [25, "Thought must be less than 25 characters"],
        required: true
    },
    mood : {
        type : String,
        required : true
    },
    city : {
        type : String,
        required : true
    },
    state : {
        type : String,
        required : true
    },
    country : {
        type : String,
        required : true
    },
    continent : {
        type : String,
        required : true
    },
    latitude : {
        type : Number,
    },
    longitude : {
        type : Number,
    },
    date : {
        type : String,
        required : true
    },
    anonId : {
        type : String,
        required: true
    }
})
UserSchema.index({ anonId: 1, date: 1 }, { unique: true });

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;