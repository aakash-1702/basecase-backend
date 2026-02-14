import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();
const uploadAtCloudinary = async (localFileName) => {
    console.log("cloudinary config",{
         cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET

    });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
    if(!localFileName) return null;// no file was present
    try {
        const response = await cloudinary.uploader.upload(
            localFileName,{
                resource_type : "auto"
            }
        ) 
        console.log("File Uploaded at cloudinary successfully",response.url);
        // since uploaded we can delete it from localStorage
        fs.unlinkSync(localFileName);
        return response;// for further use

    } catch (error) {
        console.log(error);
        fs.unlinkSync(localFileName);
        return null;        
    }

}

export {uploadAtCloudinary};