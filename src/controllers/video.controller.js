import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../middlewares/cloudinary.middleware.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utilities/ApiError.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { AsyncHandler } from "../utilities/AsyncHandler.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";

const publishVideo = AsyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoFile = req.files.videoFile[0].path;
  const thumbnail = req.files.thumbnail[0].path;

  if (!title || !description || !videoFile || !thumbnail) {
    throw new ApiError(401, "All the files are Required....!");
  }
  const uploadVideo = await uploadOnCloudinary(videoFile);

  const uploadThumbnail = await uploadOnCloudinary(thumbnail);

  if (!uploadVideo.url) {
    throw new ApiError(403, "Video not uploaded on Cloudinary...!");
  }
  if (!uploadThumbnail.url) {
    throw new ApiError(403, "Thumbnail not uploaded on Cloudinary...!");
  }
  const newVideo = await Video.create({
    title,
    description,
    videoFile_cloudinary_public_id: uploadVideo.public_id,
    thumbnail_cloudinary_public_id: uploadThumbnail.public_id,
    videoFile: uploadVideo.url,
    thumbnail: uploadThumbnail.url,
    duration: uploadVideo.duration,
    views: 0,
    isPublished: true,
    owner: req.user._id,
  });
  if (!newVideo) {
    throw new ApiError(403, "Video Upload Process failed...!");
  }
  console.log(newVideo);
  return res.json(
    new ApiResponse(201, newVideo, `Video created SuccessFully...`)
  );
});

const getVideo = AsyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req?.user?._id;
  const videoID = new mongoose.Types.ObjectId(videoId);
  const userID = new mongoose.Types.ObjectId(userId);

  // console.log("userID : ",userID);
  await Video.findByIdAndUpdate(
    videoID,
    {
      $inc: { views: 1 },
    },
    { new: true }
  );

  if (userID) {
    await User.updateOne(
      { _id: userId },
      {
        $addToSet: { watchHistory: videoId },
      },
      { new: true }
    );
  }
  

  const videoDetail = await Video.aggregate([
    // fetched the video by ID
    {
      $match: {
        _id: videoID,
        isPublished: true,
      },
    },
    // Uploader details using the owner field
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "subscriber",
              as: "subscribedTo",
            },
          },

          {
            $addFields: {
              subscriberCount: {
                $size: "$subscribers",
              },
              chennelSubscribed: {
                $size: "$subscribedTo",
              },
              isSubscribed: {
                $cond: {
                  if: { $in: [req?.user?._id, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              fullname: 1,
              username: 1,
              avatar: 1,
              coverImage: 1,
              subscriberCount: 1,
              chennelSubscribed: 1,
              isSubscribed: 1,
              email: 1,
              watchLater: 1,
              watchHistory: 1,
            },
          },
        ],
        as: "Uploader",
      },
    },
    // unwind the Uploader
    {
      $unwind: "$Uploader",
    },
    // Comments for a specific video
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        pipeline: [
          {
            $project: {
              owner: 1,
              createdAt: 1,
              content: 1,
            },
          },
        ],
        pipeline: [
          {
            $lookup: {
              from: "users",
              foreignField: "_id",
              localField: "owner",
              as: "CommentOwner",
            },
          },
          {
            $unwind: "$CommentOwner",
          },
          {
            $addFields: {
              username: "$CommentOwner.username",
              avatar: "$CommentOwner.avatar",
              owner: "$CommentOwner._id",
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
          {
            $project: {
              content: 1,
              username: 1,
              avatar: 1,
              createdAt: 1,
              owner: 1,
            },
          },
        ],
        as: "allComments",
      },
    },
    // total likes of a specific video
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        pipeline: [
          {
            $group: {
              _id: null,
              likes: {
                $sum: 1,
              },
            },
          },
        ],
        as: "totalLikes",
      },
    },
    // related videos for recommendetions
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "owner",
              as: "videos",
            },
          },

          {
            $addFields: {
              videos: "$videos",
            },
          },
          {
            $project: {
              videos: 1,
            },
          },
        ],
        as: "recommendedVideos",
      },
    },
  ]);

  console.log(videoDetail);
  return res.json(
    new ApiResponse(
      203,
      videoDetail[0],
      "Video and its detail fetched successfully......!"
    )
  );
});

const updateVideo = AsyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnail = req.file.path;
  if (!videoId || !thumbnail || !title || !description) {
    throw new ApiError(404, "all field should be present.....!");
  }
  const uploadThumbnail = await uploadOnCloudinary(thumbnail);
  console.log(uploadThumbnail.url);
  if (!uploadThumbnail.url) {
    throw new ApiError(404, "Thumbnail is not uploaded on Cloudinary.....!");
  }
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: uploadThumbnail.url,
      },
    },
    { new: true }
  );
  if (!video) {
    throw new ApiError(404, "Video not found for Updating.....!");
  }
  return res.json(
    new ApiResponse(204, video, "video updated Successfully....!")
  );
});

const deleteVideo = AsyncHandler(async (req, res) => {
  const { videoId } = req.params;
  console.log("videoId : ", videoId);
  if (!videoId) {
    throw new ApiError(404, "Video ID not fetched for Deleting Video.....");
  }
  const video = await Video.findByIdAndDelete(videoId);

  if (!video) {
    throw new ApiError(404, "Video deletion failed.....!");
  }
  const deleteThumbnailFromCloudinary = await deleteFromCloudinary(
    video.thumbnail_cloudinary_public_id
  );
  const deleteVideoFileFromCloudinary = await deleteFromCloudinary(
    video.videoFile_cloudinary_public_id
  );

  if (!deleteVideoFileFromCloudinary || !deleteThumbnailFromCloudinary) {
    console.log("Resources are not yet deleted from Cloudinary");
    // throw new ApiError(402, "Resources are not yet deleted from Cloudinary");
  }

  const comments = await Comment.deleteMany({
    video: videoId,
  });

  if (!comments) {
    throw new ApiError(404, "Comments deletion failed for video.....!");
  }

  const likes = await Like.deleteMany({
    video: videoId,
  });
  if (!likes) {
    throw new ApiError(404, "Likes documents deletion failed for video.....!");
  }

  const response = { video, comments, likes };

  return res.json(
    new ApiResponse(201, response, "Video deleted successfully.....!")
  );
});

const updateViews = AsyncHandler(async (req, res) => {
  const { videoId } = req.query;
  const userId = req?.user?._id;

  const user = await User.findById(userId);
  const video = await Video.findById(videoId);
  if (!video || !user) {
    throw new ApiError(
      404,
      "Video OR User not Found.....! while views updation"
    );
  }
  video.views = video.views + 1;
  await video.save({ validateBeforeSave: false });
  user.watchHistory.push(videoId);
  await user.save({ validateBeforeSave: false });

  return res.json(
    new ApiResponse(
      202,
      video,
      user,
      `${user.username} has just watched ${video.title} Video......!`
    )
  );
});

const watchLatervideos = AsyncHandler(async (req, res) => {
  const { videoId } = req.body || req.params;
  const watchLaterVideos = await User.updateOne(
    { _id: req.user._id },
    {
      $addToSet: { watchLater: videoId },
    },
    { new: true }
  );
  return res.json(
    new ApiResponse(
      201,
      watchLaterVideos,
      `video is added to watch-later list by User : ${req.user.username}`
    )
  );
});

const removeWatchLaterVideos = AsyncHandler(async (req, res) => {
  const { videoId } = req.body;
  console.log("videoId : ", videoId);
  const removedVideos = await User.updateMany(
    { _id: new mongoose.Types.ObjectId(req.user._id) },
    [
      {
        $set: {
          watchLater: {
            $filter: {
              input: "$watchLater",
              as: "video",
              cond: { $ne: ["$$video", new mongoose.Types.ObjectId(videoId)] },
            },
          },
        },
      },
    ]
  );

  console.log("removedVideos : ", removedVideos);
  return res.json(
    new ApiResponse(
      201,
      removedVideos,
      `${req.user.username} has removed the ${videoId} ID video from watch Later list.....!`
    )
  );
});

const allWatchLaterVideos = AsyncHandler(async (req, res) => {
  const { userId } = req.params;
  const userID = new mongoose.Types.ObjectId(userId);
  if (!userID) {
    throw new ApiError(401, "User ID not Found.....!");
  }
  const watchLaterVideos = await User.aggregate([
    {
      $match: {
        _id: userID,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchLater",
        foreignField: "_id",
        as: "watchLaterVideos",
      },
    },
    {
      $addFields: {
        watchLaterVideos: "$watchLaterVideos",
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        watchLaterVideos: 1,
      },
    },
  ]);
  return res.json(
    new ApiResponse(
      203,
      watchLaterVideos[0],
      `All the Watch later videos are fetched by ${
        req.user.username || "User."
      }`
    )
  );
});

const clearWatchHistory = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userID = new mongoose.Types.ObjectId(userId);
  if (!userID) {
    throw new ApiError(401, "UserID not found . . . . .!");
  }
  const clearWatchHistory = await User.findByIdAndUpdate(
    userID,
    {
      $set: {
        watchHistory: [],
      },
    },
    { new: true }
  );
  return res.json(
    new ApiResponse(
      201,
      clearWatchHistory,
      "watch history is cleared . . . . !"
    )
  );
});

export {
  publishVideo,
  getVideo,
  updateVideo,
  deleteVideo,
  updateViews,
  watchLatervideos,
  removeWatchLaterVideos,
  allWatchLaterVideos,
  clearWatchHistory,
};
