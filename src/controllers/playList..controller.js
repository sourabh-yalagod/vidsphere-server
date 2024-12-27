import { AsyncHandler } from "../utilities/AsyncHandler.js";
import { ApiError } from "../utilities/ApiError.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { playList } from "../models/playlist.model.js";
import mongoose from "mongoose";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../middlewares/cloudinary.middleware.js";

const createPlayList = AsyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const thumbnail = req.file.path || req.files.thumbnail[0].path;
  if (!title || !description || !thumbnail) {
    throw new ApiError(
      401,
      "Title and description and Thumbnail are Required . . . . !"
    );
  }
  const thumbnailOnCloudinary = await uploadOnCloudinary(thumbnail);
  if (!thumbnailOnCloudinary.url) {
    throw new ApiError(201, "Thumbnail is not uploaded on Cloudinary....!");
  }
  const newPlaylist = await playList.create({
    userId: req.user._id,
    title,
    description,
    thumbnail: thumbnailOnCloudinary.url,
    thumbnail_cloudinary_public_id: thumbnailOnCloudinary.public_id,
  });
  if (!newPlaylist) {
    throw new ApiError(402, "New Play-list creation failed.....!");
  }
  console.log("newPlaylist : ", newPlaylist);

  return res.json(
    new ApiResponse(
      201,
      newPlaylist,
      `${req.user.username} has successfully created the Playlist with Title : ${title}`
    )
  );
});

const addVideoToPlaylist = AsyncHandler(async (req, res) => {
  const playlistId = req?.params?.playlistId ?? req?.body?.playlistId;
  const videoId = req?.params?.videoId ?? req?.body?.videoId;
  if (!playlistId || !videoId) {
    throw new ApiError(
      401,
      "Video and Playlist ID not Found for adding into playlist.....!"
    );
  }

  const addVideoToPlaylist = await playList.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { videoId: videoId },
    },
    { new: true }
  );
  if (!addVideoToPlaylist) {
    throw new ApiError(
      401,
      "New video adding to playlist process failed.....!"
    );
  }
  return res.json(
    new ApiResponse(
      201,
      addVideoToPlaylist,
      "New video is added to the playlist"
    )
  );
});

const deleteVideoFromPlaylist = AsyncHandler(async (req, res) => {
  const playlistId = req?.params?.playlistId ?? req?.body?.playlistId;
  const videoId = req?.params?.videoId ?? req?.body?.videoId;
  console.log(playlistId,videoId);
  if (!playlistId || !videoId) {
    throw new ApiError(
      401,
      "Video and Playlist ID not Found for adding into playlist.....!"
    );
  }
  const deleteVideoFromPlaylist = await playList.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videoId: new mongoose.Types.ObjectId(videoId) },
    },
    { new: true }
  );
  console.log(deleteVideoFromPlaylist);
  return res.json(
    new ApiResponse(
      201,
      deleteVideoFromPlaylist,
      "video deleted successfully from the video-Playlist...."
    )
  );
});

const getAllPlaylist = AsyncHandler(async (req, res) => {
  const { userId } = req.params;
  console.log(userId);
  if (!userId) {
    throw new ApiError(401, "User ID not Found....!");
  }
  const allPlaylists = await playList.find({ userId: userId });
  if (!allPlaylists) {
    return res.json(new ApiResponse(201, [], "Create a playlist...."));
  }
  return res.json(
    new ApiResponse(
      201,
      allPlaylists,
      "All the playlist are fetched successfully...."
    )
  );
});

const editPlaylist = AsyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { playlistId } = req?.params ?? req?.body;
  const thumbnailPath = req.file.path || req.files.thumbnail[0].path;

  if (!playlistId || !title || !description || !thumbnailPath) {
    throw new ApiError(
      401,
      "playlistId , title , description , thumbnail are not found for to find and edit the playlist . . . . . !"
    );
  }
  const playlist = await playList.findById(playlistId);

  if (!playlist) {
    throw new ApiError(401, "User do not have any playlist . . . . . !");
  }
  const thumbnailOnCloudinary = await uploadOnCloudinary(thumbnailPath);
  if (!thumbnailOnCloudinary) {
    throw new ApiError(401, "thumbnail not uploaded on cloudinary . . . . . !");
  }
  playlist.title = title;
  playlist.description = description;
  playlist.thumbnail = thumbnailOnCloudinary.url;
  await playlist.save();
  await deleteFromCloudinary(playlist.thumbnail_cloudinary_public_id);

  return res.json(
    new ApiResponse(203, playlist, "Play-list edited successfully . . . . !")
  );
});

const deletePlaylist = AsyncHandler(async (req, res) => {
  const { playlistId } = req.params ?? req.body;
  if (!playlistId) {
    throw new ApiError(401, "Play list ID not found . . . .!");
  }
  const deletePlaylist = await playList.findByIdAndDelete(playlistId);
  if (!deletePlaylist) {
    throw new ApiError(401, "Play list deletion failed . . . . !");
  }
  return res.json(
    new ApiResponse(
      205,
      deletePlaylist,
      "Play-list deleted successfully . . . . !"
    )
  );
});

const videosFromPlaylist = AsyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(
      401,
      "Playlist ID not Found for fetching playlist videos . . . ."
    );
  }
  const videos = await playList.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videoId",
        foreignField: "_id",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    avatar: 1,
                    username: 1,
                    fullname: 1,
                  },
                },
              ],
              as: "owner",
            },
          },
          {
            $unwind: "$owner",
          },
        ],
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
        title: 1,
        description: 1,
        thumbnail: 1,
        userId: 1,
        videos: 1,
      },
    },
  ]);
  return res.json(
    new ApiResponse(
      201,
      videos[0],
      "Play list videos are fetched successfully . . . . !"
    )
  );
});
export {
  createPlayList,
  addVideoToPlaylist,
  deleteVideoFromPlaylist,
  getAllPlaylist,
  editPlaylist,
  deletePlaylist,
  videosFromPlaylist,
};
