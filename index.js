import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { exec } from "child_process";

const app = express();
dotenv.config({ path: "./.env" });
const port = process.env.PORT;

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, "public");
console.log("Public Path:", publicPath);

app.use(express.static(publicPath));
app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, publicPath); // Save files in the public directory
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.post("/api/images", upload.array("images"), async (req, res) => {
  const images = req.files; // Access uploaded files via `req.files`

  if (!images || images.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  const format = ".jpeg";
  const convertedImages = [];

  const convertImage = (image) => {
    return new Promise((resolve, reject) => {
      const outputFilename = `${
        image.filename.split(".")[0]
      }-${Date.now()}${format}`;
      const outputPath = path.join(publicPath, outputFilename);

      exec(`ffmpeg -i "${image.path}" "${outputPath}"`, (error) => {
        if (error) {
          console.error(`Error converting ${image.filename}:`, error);
          fs.unlinkSync(image.path);
          return reject(error);
        }
        convertedImages.push({
          original: image.path,
          converted: outputPath,
        });
        fs.unlinkSync(image.path);
        setTimeout(() => fs.unlinkSync(outputPath), 2 * 60 * 1000);
        resolve();
      });
    });
  };
  await Promise.allSettled(images.map((image) => convertImage(image)));
  console.log(convertedImages);

  return res.status(200).json({
    message: "Files uploaded and converted successfully",
    output: convertedImages,
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
