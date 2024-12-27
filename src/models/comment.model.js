import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Content required in comment....!"],
      trim: true,
    },
    video: {
      type: mongoose.Types.ObjectId,
      ref: "Video",
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);
