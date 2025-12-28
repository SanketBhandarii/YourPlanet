import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config();
 const connectDb = async () => {
    try {
      const con = await mongoose.connect(process.env.MONGO_URL)   
      console.log("Mongodb connection successfull", con.connection.host )
    } catch (error) {
      
        
    }
 }

 export default connectDb;