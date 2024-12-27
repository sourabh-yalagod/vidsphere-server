import { ApiResponse } from "../utilities/ApiResponse.js";
import { AsyncHandler } from "../utilities/AsyncHandler.js";
import { Like } from "../models/like.model.js";
import mongoose from "mongoose";
import { ApiError } from "../utilities/ApiError.js";

const toggleLikeStatus = AsyncHandler(async (req, res) => {
  const { userId } = req.body;
  console.log(userId);
  const { videoId } = req.params;
  const owner = req.user._id;
  if (!userId || !videoId || !owner) {
    throw new ApiError(401, "All the Ids are required.....!");
  }
  const checkLike = await Like.findOne({
    owner: owner,
    video: videoId,
  });
  console.log("checkLike : ", checkLike);
  if (checkLike) {
    const disLike = await Like.deleteOne({
      owner: owner,
      video: videoId,
    });
    console.log("Like Removed : ", disLike);
    return res.json(new ApiResponse(201, disLike, "Like removed....!"));
  }
  const like = await Like.create({
    likeStatus: true,
    userId: userId,
    video: videoId,
    owner: owner,
  });
  console.log("Like Created : ", like);

  return res.json(new ApiResponse(201, like, "new Like created....!"));
});

const allFavourateVideos = AsyncHandler(async (req, res) => {
  const { userId } = req.params;
  const userID = new mongoose.Types.ObjectId(userId);
  if (!userID) {
    throw new ApiError(
      404,
      "UserId not found for favourate video fetching.....!"
    );
  }
  const favourateVideos = await Like.aggregate([
    {
      $match: {
        owner: userID,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "favouriteVideos",
      },
    },
    {
      $unwind: "$favouriteVideos", 
    },
    {
      $replaceRoot: { newRoot: "$favouriteVideos" }
    },
    {
      $lookup:{
        from:"users",
        foreignField:"_id",
        localField:"owner",
        pipeline:[
          {
            $project:{
              _id:0,
              avatar:1,
              username:1,
              fullname:1
            }
          }
        ],
        as:"Uploader"
      }
    },
    {
      $unwind:"$Uploader"
    }
  ]);
  return res.json(
    new ApiResponse(
      201,
      favourateVideos,
      "All the Liked videos are fetched....!"
    )
  );
});

export { toggleLikeStatus, allFavourateVideos };
