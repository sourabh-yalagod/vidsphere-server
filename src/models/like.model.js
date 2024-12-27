import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    likeStatus: {
      type: Boolean,
      default: false,
    },
    video: {
      type: mongoose.Types.ObjectId,
      ref: "Video",
    },
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    userId:{
      type: mongoose.Types.ObjectId,
      ref: "User",
    }
  },
  { timestamps: true }
);

export const Like = mongoose.model("Like", likeSchema);