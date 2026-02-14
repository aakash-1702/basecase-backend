import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.resolve(__dirname, "../../public/temp");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
    
  },
  filename: function (req, file, cb) {    
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);

    // ensure directory exists
    
  }
});

export const upload = multer({ storage });