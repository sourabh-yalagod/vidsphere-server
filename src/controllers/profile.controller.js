import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utilities/ApiError.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { AsyncHandler } from "../utilities/AsyncHandler.js";

// const getUserInfo = AsyncHandler(async (req, res) => {
//   const { userId } = req.params;
//   console.log(userId);
//   if (!userId) {
//     throw new ApiError(401, "Params not Found...!");
//   }
//   const profileContent = await Video.aggregate([
//     {
//       $match: {
//         owner: new mongoose.Types.ObjectId(userId),
//       },
//     },
//     {
//       $lookup: {
//         from: "users",
//         foreignField: "_id",
//         localField: "owner",
//         pipeline: [
//           {
//             $project: {
//               fullname: 1,
//               username: 1,
//               avatar: 1,
//               coverImage: 1,
//               email: 1,
//             },
//           },
//         ],
//         as: "Owner",
//       },
//     },
//     {
//       $project: {
//         _id: 1,
//         title: 1,
//         description: 1,
//         thumbnail: 1,
//         videoFile: 1,
//         Owner: 1,
//       },
//     },
//     {
//       $unwind: "$Owner",
//     },
//   ]);
//   const Likes = await Like.aggregate([
//     {
//       $match: {
//         video: new mongoose.Types.ObjectId(userId),
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         TotalLikes: {
//           $sum: 1,
//         },
//       },
//     },
//     {
//       $unwind: "$TotalLikes",
//     },
//   ]);
//   const Comments = await Comment.aggregate([
//     {
//       $match: {
//         owner: new mongoose.Types.ObjectId(userId),
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         TotalComments: {
//           $sum: 1,
//         },
//       },
//     },
//     {
//       $unwind: "$TotalComments",
//     },
//   ]);
//   const Subscriptions = await User.aggregate([
//     {
//       $match: {
//         _id: new mongoose.Types.ObjectId(userId),
//       },
//     },
//     {
//       $lookup: {
//         from: "subscriptions",
//         localField: "_id",
//         foreignField: "channel",
//         as: "subscribers",
//       },
//     },
//     {
//       $lookup: {
//         from: "subscriptions",
//         localField: "_id",
//         foreignField: "subscriber",
//         as: "subscribedTo",
//       },
//     },

//     {
//       $addFields: {
//         subscriberCount: {
//           $size: "$subscribers",
//         },
//         chennelSubscribed: {
//           $size: "$subscribedTo",
//         },
//         isSubscribed: {
//           $cond: {
//             if: { $in: [req?.user?._id, "$subscribers.subscriber"] },
//             then: true,
//             else: false,
//           },
//         },
//       },
//     },
//     {
//       $project: {
//         fullname: 1,
//         username: 1,
//         avatar: 1,
//         coverImage: 1,
//         subscriberCount: 1,
//         chennelSubscribed: 1,
//         isSubscribed: 1,
//         email: 1,
//       },
//     },
//   ]);
//   return res.json(
//     new ApiResponse(
//       201,
//       { profileContent, Likes, Comments ,Subscriptions},
//       "Fetched successfully"
//     )
//   );
// });

const getUserInfo = AsyncHandler(async (req, res) => {
  const { userId } = req.params;
  const userID = new mongoose.Types.ObjectId(userId);
  if (!userID) {
    throw new ApiError(401, "User ID not found from Params....!");
  }
  const userProfileDetails = await User.aggregate([
    // subscription
    {
      $match: {
        _id: userID,
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
    // fields added related to subscription
    {
      $addFields: {
        subscribers: {
          $size: "$subscribers",
        },
        subscriberedTo: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        pipeline:[
          {
            $sort:{
              createdAt:-1
            }
          }
        ],
        as: "videos",
      },
    },
    // likes
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "userId",
        pipeline: [
          {
            $group: {
              _id: null,
              totallikes: {
                $sum: 1,
              },
            },
          },
        ],
        as: "likes",
      },
    },
    // comments
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "userId",
        pipeline: [
          {
            $group: {
              _id: null,
              totalComments: {
                $sum: 1,
              },
            },
          },
        ],
        as: "comments",
      },
    },
    // playlist statics
    {
      $lookup: {
        from: "playlists",
        localField: "_id",
        foreignField: "userId",
        as: "playlist",
      },
    },
    {
      $addFields: {
        playlist: "$playlist",
      },
    },
    // projecting all the values
    {
      $project: {
        fullname: 1,
        username: 1,
        createdAt: 1,
        email: 1,
        subscribers: 1,
        subscriberedTo: 1,
        isSubscribed: 1,
        videos: 1,
        coverImage: 1,
        avatar: 1,
        likes: 1,
        comments: 1,
        playlist: 1,
      },
    },
  ]);
  console.log("userProfileDetails : ", userProfileDetails);
  return res.json(
    new ApiResponse(
      200,
      userProfileDetails[0],
      "user profile detail is fetched successfully.....!"
    )
  );
});

export { getUserInfo };

// const getUserInfo = AsyncHandler(async (req, res) => {
//   const { userId } = req.params;
//   const userID = new mongoose.Types.ObjectId(userId);
//   if (!userID) {
//     throw new ApiError(401, "User ID not found from Params....!");
//   }
//   console.log("User Profile UserID : ", userID);
//   const userProfileDetails = await User.aggregate([
//     // subscription
//     {
//       $match: {
//         _id: userID,
//       },
//     },
//     {
//       $lookup: {
//         from: "subscriptions",
//         localField: "_id",
//         foreignField: "channel",
//         as: "subscribers",
//       },
//     },
//     {
//       $lookup: {
//         from: "subscriptions",
//         localField: "_id",
//         foreignField: "subscriber",
//         as: "subscribedTo",
//       },
//     },
//     // fields added related to subscription
//     {
//       $addFields: {
//         subscribers: {
//           $size: "$subscribers",
//         },
//         subscriberedTo: {
//           $size: "$subscribedTo",
//         },
//         isSubscribed: {
//           $cond: {
//             if: { $in: [req.user._id, "$subscribers.subscriber"] },
//             then: true,
//             else: false,
//           },
//         },
//       },
//     },
//     {
//       $lookup: {
//         from: "videos",
//         localField: "_id",
//         foreignField: "owner",
//         as: "videos",
//       },
//     },
//     // likes
//     {
//       $lookup: {
//         from: "likes",
//         localField: "_id",
//         foreignField: "userId",
//         pipeline: [
//           {
//             $group: {
//               _id: null,
//               totallikes: {
//                 $sum: 1,
//               },
//             },
//           },
//         ],
//         as: "likes",
//       },
//     },
//     // comments
//     {
//       $lookup: {
//         from: "comments",
//         localField: "_id",
//         foreignField: "userId",
//         pipeline: [
//           {
//             $group: {
//               _id: null,
//               totalComments: {
//                 $sum: 1,
//               },
//             },
//           },
//         ],
//         as: "comments",
//       },
//     },
//     // projecting all the values
//     {
//       $project: {
//         fullname: 1,
//         username: 1,
//         createdAt: 1,
//         email: 1,
//         subscribers: 1,
//         subscriberedTo: 1,
//         isSubscribed: 1,
//         videos: 1,
//         coverImage: 1,
//         avatar: 1,
//         likes: 1,
//         comments: 1,
//       },
//     },
//   ]);
//   console.log("userProfileDetails : ", userProfileDetails);
//   return res.json(
//     new ApiResponse(
//       200,
//       userProfileDetails[0],
//       "user profile detail is fetched successfully.....!"
//     )
//   );
// });
