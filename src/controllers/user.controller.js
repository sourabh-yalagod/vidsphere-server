import { ApiError } from "../utilities/ApiError.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { AsyncHandler } from "../utilities/AsyncHandler.js";
import { User } from "../models/user.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../middlewares/cloudinary.middleware.js";
// import { Options } from "../utilities/options.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";

const Options = {
  httpOnly: true,
  secure: true,
};

const getToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens");
  }
};

const RegisterUser = AsyncHandler(async (req, res) => {
  const { fullname, username, email, password } = req.body;
  if (
    [fullname, username, email, password].some((field) => field.trim() == "")
  ) {
    throw new ApiError(401, "all the fields are Required.....!");
  }

  const userExist = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExist) {
    throw new ApiError(
      401,
      `${(username || email).toLowerCase()} - named User already Exist.....`
    );
  }
  const avatarFile = req.files?.avatar[0]?.path;
  let coverImageFile = req.files?.coverImage[0]?.path;

  if (!avatarFile) {
    throw new ApiError(401, "avarat image is not uploaded properly....!");
  }

  const avatar = await uploadOnCloudinary(avatarFile);
  if (coverImageFile && coverImageFile.length > 0) {
    coverImageFile = await uploadOnCloudinary(coverImageFile);
  }
  if (!avatar.url) {
    throw new ApiError(401, "Avatar image is not on Cloudinary.....!");
  }

  const user = await User.create({
    fullname,
    username,
    email,
    password,
    avatar: avatar.url,
    avatar_cloudinary_public_id: avatar?.public_id,
    coverImage_cloudinary_public_id: coverImageFile?.public_id,
    coverImage: coverImageFile.url,
  });

  const newUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!newUser) {
    throw new ApiError(500, "new User not created");
  }
  console.log("New User : ", newUser);
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        newUser,
        `New user created with, UserName : ${newUser.username} & Email : ${newUser.email}`
      )
    );
});

const loginUser = AsyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(401, "Email or Username can't be empty!");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(401, "User does not exist!");
  }

  const checkPassword = await user.isPasswordCorrect(password);

  if (!checkPassword) {
    throw new ApiError(401, "Password does not match!");
  }

  try {
    const { accessToken, refreshToken } = await getToken(user._id);

    const loggedUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!loggedUser) {
      throw new ApiError(401, "Login user not found!");
    }

    return res
      .cookie("accessToken", accessToken, Options)
      .cookie("refreshToken", refreshToken, Options)
      .json(
        new ApiResponse(
          200,
          {
            id: user._id,
            loggedUser,
            accessToken,
            refreshToken,
          },
          "User logged In Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Failed to log in user");
  }
});

const logout = AsyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );
  return res
    .clearCookie("accessToken", Options)
    .clearCookie("refreshToken", Options)
    .json(
      new ApiResponse(
        201,
        {},
        `${user.username} has logged Out at ${Date.now().toLocaleString()}`
      )
    );
});

const getUser = AsyncHandler(async (req, res) => {
  return res.json(
    new ApiResponse(201, req.user, "User fetched successFully....!")
  );
});

const changePassword = AsyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  console.log(req.user);
  console.log(oldPassword, newPassword);
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError(401, "Password changing process got failed.....!");
    }

    const isPasswordRight = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordRight) {
      throw new ApiError(401, "You have entered wrong password.....!");
    }
    user.password = newPassword;
    await user.save();
    return res.json(
      new ApiResponse(
        204,
        user,
        `${
          user.username || user.email
        } has successFull changed the Old Password....!`
      )
    );
  } catch (error) {
    throw new ApiError(
      501,
      `${
        req.user.username || req.user.email
      } has failed to change the Old Password....!` + error
    );
  }
});

const newRefreshToken = AsyncHandler(async (req, res) => {
  const newRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  try {
    const decodeToken = jwt.verify(
      newRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodeToken._id);

    if (!user) {
      throw new ApiError(
        401,
        "User not Found during refreshToken Generation.....!"
      );
    }

    if (user.refreshToken !== newRefreshToken) {
      throw new ApiError(501, "Input Token and User Token not matched.....!");
    }
    const { accessToken, refreshToken } = await getToken(user._id);
    console.log("decodeToken", { accessToken, refreshToken });

    res
      .cookie("accessToken", accessToken, Options)
      .cookie("refreshToken", refreshToken, Options)
      .json(
        new ApiResponse(
          201,
          { user, accessToken, refreshToken },
          `${user.username} has Generated new Access and Refresh TOKEN Succeessfully......!`
        )
      );
  } catch (error) {
    throw new ApiError(
      501,
      "New Refresh Token generation process failed.....!"
    );
  }
});

const updateAccount = AsyncHandler(async (req, res) => {
  const { fullname, email } = req.body || req.json;

  if (!(fullname || email)) {
    throw new ApiError(
      401,
      "At least one field Fullname OR Email required....."
    );
  }
  const userId = req.user._id;
  const user = await User.findOneAndUpdate(
    userId,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true }
  );
  if (!user) {
    throw new ApiError(
      401,
      "User not found while Modifying the User Account....!"
    );
  }
  return res.json(
    new ApiResponse(201, user, `${user.username} has Modified the User Account`)
  );
});

const changeAvatar = AsyncHandler(async (req, res) => {
  const existinguser = req.user;

  if (!existinguser) {
    throw new ApiError(401, "user not found for avatar change.....!");
  }
  const newAvatarFile = req.files?.avatar[0]?.path || req.file.path;
  if (!newAvatarFile) {
    throw new ApiError(401, "Avatar is not Recevied as an Input.....!");
  }
  const avatar = await uploadOnCloudinary(newAvatarFile);

  if (!avatar.url) {
    throw new ApiError(401, "Avatar upload failed on Cloudianary.....!");
  }
  const user = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        avatar: avatar.url,
        avatar_cloudinary_public_id: avatar.public_id,
      },
    },
    { new: true }
  );
  if (!user) {
    throw new ApiError(
      401,
      "User not Found while changing the Avatar File.....!"
    );
  }
  const deleteOldAvatar = await deleteFromCloudinary(
    existinguser.avatar_cloudinary_public_id
  );

  if (!deleteOldAvatar) {
    throw new ApiError(401, "Deleting the old image process failed....!");
  }
  console.log(user);

  return res.json(
    new ApiResponse(
      204,
      user,
      `${user.username} has changed the Avatar file SuccessFully....!`
    )
  );
});

const changeCoverImage = AsyncHandler(async (req, res) => {
  const existinguser = req.user;

  if (!existinguser) {
    throw new ApiError(401, "user not found for avatar change.....!");
  }

  const newCoverImage = req.file.path || "";
  if (!newCoverImage) {
    throw new ApiError(401, "New CoverImage has not received from Client");
  }
  const coverImage = await uploadOnCloudinary(newCoverImage);
  if (!coverImage.url) {
    throw new ApiError(
      401,
      "New CoverImage failed while Uploading on Cloudinary"
    );
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
        coverImage_cloudinary_public_id: coverImage.public_id,
      },
    },
    { new: true }
  );
  if (!user) {
    throw new ApiError(
      404,
      "user not Found while changing the User Cover-Image"
    );
  }
  const deleteOldCoverImage = await deleteFromCloudinary(
    existinguser.coverImage_cloudinary_public_id
  );
  console.log(existinguser);
  console.log(deleteOldCoverImage);
  if (!deleteOldCoverImage) {
    throw new ApiError(401, "Deleting the old image process failed....!");
  }
  return res.json(
    new ApiResponse(
      203,
      user,
      `${user.username} has Changed the Cover Image Succeefully`
    )
  );
});

const getUserProfile = AsyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId?.trim()) {
    throw new ApiError(
      401,
      "username not found for channel Profile Request.....!"
    );
  }

  const channel = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
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
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(401, "User profile fetching process failed.....!");
  }
  return res.json(
    new ApiResponse(
      201,
      channel,
      `${userId}'s Channel is Fetched successfully.....!`
    )
  );
});

const watchHistory = AsyncHandler(async (req, res) => {
  const { userId } = req.params;
  const userID = new mongoose.Types.ObjectId(userId);
  if (!userID) {
    throw new ApiError(404, "User ID not found for watchHistory fetch.....!");
  }
  const watchedVideos = await User.aggregate([
    {
      $match: {
        _id: userID,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
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
        fullname: 1,
        username: 1,
        avatar: 1,
        watchHistory: 1,
        videos: 1,
      },
    },
  ]);
  return res.json(
    new ApiResponse(
      201,
      watchedVideos[0],
      "All the videos are fethced successfully.......!"
    )
  );
});

const handleSubscribers = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { ChannelId } = req.body;
  if (!userId || !ChannelId) {
    throw new ApiError(401, "UserId OR ChannelId not found.....!");
  }
  const subStatus = await Subscription.findOne({
    subscriber: userId,
    channel: ChannelId,
  });

  console.log("Already Subscribers : ", subStatus);

  const subsModelId = new mongoose.Types.ObjectId(subStatus?._id);
  if (subStatus) {
    const resp = await Subscription.findByIdAndDelete(subsModelId);
    console.log("Subscriber Deleted");
    return res.json(new ApiResponse(201, resp, "Subscriber Deleted"));
  }

  const newSubscriber = await Subscription.create({
    channel: ChannelId,
    subscriber: userId,
  });
  console.log("newSubscriber created : ", newSubscriber);

  return res.json(
    new ApiResponse(
      201,
      newSubscriber || {},
      "Subscription Toggled Successfully....!"
    )
  );
});

const deleteUserAccount = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  if (!userId) {
    throw new ApiError(401, "UserID not Found.....!");
  }
  const user = await User.findByIdAndDelete(userId);
  console.log("USER from delete user Controller : ", user);
  if (!user) {
    throw new ApiError(401, "User not deleted");
  }
  const deleteAvatarFromCloudinary = await deleteFromCloudinary(
    user.avatar_cloudinary_public_id
  );
  const deleteCoverImageFromCloudinary = await deleteFromCloudinary(
    user.coverImage_cloudinary_public_id
  );
  if (!deleteAvatarFromCloudinary || !deleteCoverImageFromCloudinary) {
    throw new ApiError(
      402,
      "failed to delete avatar and cover images from Cloudinary"
    );
  }
  const deleteVideo = await Video.deleteMany({ owner: userId });
  const deleteComments = await Comment.deleteMany({ userId: userId });
  const deleteLikes = await Like.deleteMany({ userId: userId });
  const deleteSubscription = await Subscription.deleteMany({
    $or: [{ channel: userId }, { subscriber: userId }],
  });

  if (!deleteComments || !deleteVideo || !deleteLikes || !deleteSubscription) {
    throw new ApiError(
      401,
      "All the Likes , comments , videos and subscription activity are not deleted Yet......!"
    );
  }
  return res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(
      new ApiResponse(
        201,
        user,
        `${user.username} with ${user._id} is deleted Successfully.....!`
      )
    );
});

const VideosFromSubscription = AsyncHandler(async (req, res) => {
  const userID = req?.body?.userId ?? req?.params?.userId;
  const userId = new mongoose.Types.ObjectId(userID);
  if (!userId) {
    throw new ApiError(401, "User ID not found for subscription . . . . !");
  }

  const subscription = await User.aggregate([
    {
      $match: {
        _id: userId,
      },
    },
    // Channels whom I subscribed
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        pipeline: [
          {
            $lookup: {
              from: "users",
              foreignField: "_id",
              localField: "channel",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
              as: "Channel",
            },
          },
          {
            $unwind: "$Channel",
          },
        ],
        as: "Channels",
      },
    },
    // videos uplaoded by channels subscribed by ME
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        pipeline: [
          {
            $lookup: {
              from: "videos",
              localField: "channel",
              foreignField: "owner",
              pipeline: [
                {
                  $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    pipeline: [
                      {
                        $project: {
                          username: 1,
                          fullname: 1,
                          avatar: 1,
                        },
                      },
                    ],
                    as: "Uploader",
                  },
                },
                {
                  $unwind: "$Uploader",
                },
              ],
              as: "video",
            },
          },
          {
            $unwind: "$video",
          },
          {
            $addFields: {
              video: "$video",
            },
          },
        ],
        as: "videos",
      },
    },
    // projecting the channel and video uploaded by them
    {
      $project: {
        Channels: 1,
        videos: 1,
      },
    },
  ]);
  return res.json(
    new ApiResponse(
      201,
      subscription[0],
      "Channels are fetched successfully . . . . !"
    )
  );
});

export {
  RegisterUser,
  loginUser,
  logout,
  getUser,
  changePassword,
  newRefreshToken,
  updateAccount,
  changeAvatar,
  changeCoverImage,
  getUserProfile,
  watchHistory,
  handleSubscribers,
  deleteUserAccount,
  VideosFromSubscription,
};
