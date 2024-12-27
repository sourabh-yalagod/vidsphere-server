import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export const uploadOnCloudinary = async (fileLink) => {
  try {
    if (!fileLink) return null;
    const response = await cloudinary.uploader.upload(fileLink, {
      resource_type: "auto",
    });
    fs.unlinkSync(fileLink);
    return response;
  } catch (error) {
    fs.unlinkSync(fileLink);
    return error;
  }
};

export const deleteFromCloudinary = async (file_public_id) => {
  if (!file_public_id) return null;
  try {
    const response = await cloudinary.uploader.destroy(file_public_id);
    return response;
  } catch (error) {
    console.log(
      "Error from deleting the resources from cloudinary....! : ",
      error
    );
  }
};
