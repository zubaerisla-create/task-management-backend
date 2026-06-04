import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import config from "../config";


import fs from "fs";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(process.cwd(), "/uploads");
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

const upload = multer({ storage: storage })

const uploadToCloudinary = async (file: Express.Multer.File) => {

    // Configuration
    cloudinary.config({
        cloud_name: config.cloudinary.cloud_name,
        api_key: config.cloudinary.api_key,
        api_secret: config.cloudinary.api_secret,
    });

    // Upload an image
    try {
        const uploadResult = await cloudinary.uploader.upload(
            file.path, {
            public_id: file.filename,
        });
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        return uploadResult;
    } catch (error) {
        console.log(error);
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        return null;
    }
}



export const fileUpload = {
    upload,
    uploadToCloudinary

}