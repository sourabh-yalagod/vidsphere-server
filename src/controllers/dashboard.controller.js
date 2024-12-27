import { AsyncHandler } from "../utilities/AsyncHandler.js";
import { ApiError } from "../utilities/ApiError.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const PlatformAnalytics = AsyncHandler(async (req, res, next) => {
  const userid = req?.user?._id;
  const userId = new mongoose.Types.ObjectId(userid);
  if (!userId) {
    return next(
      new ApiError(401, "UserId not Found for platform analytics . . . . . . !")
    );
  }
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  const statistics = await User.aggregate([
    {
      $facet: {
        users: [{ $count: "totalUsers" }],
        videos: [
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "owner",
              as: "videos",
            },
          },
          { $unwind: "$videos" },
          { $group: { _id: null, totalVideos: { $sum: 1 } } },
        ],
        likes: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "userId",
              as: "likes",
            },
          },
          { $unwind: "$likes" },
          { $group: { _id: null, totalLikes: { $sum: 1 } } },
        ],
        comments: [
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "userId",
              as: "comments",
            },
          },
          { $unwind: "$comments" },
          { $group: { _id: null, totalComments: { $sum: 1 } } },
        ],
        WeeklyViews: [
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "owner",
              as: "videos",
            },
          },
          { $unwind: "$videos" },
          { $match: { "videos.createdAt": { $gte: oneWeekAgo } } },
          { $group: { _id: null, totalViews: { $sum: "$videos.views" } } },
        ],
        monthlyViews: [
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "owner",
              as: "videos",
            },
          },
          { $unwind: "$videos" },
          { $match: { "videos.createdAt": { $gte: oneMonthAgo } } },
          { $group: { _id: null, totalViews: { $sum: "$videos.views" } } },
        ],
        yearlyViews: [
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "owner",
              as: "videos",
            },
          },
          { $unwind: "$videos" },
          { $match: { "videos.createdAt": { $gte: oneYearAgo } } },
          { $group: { _id: null, totalViews: { $sum: "$videos.views" } } },
        ],
        weeklyComments: [
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "userId",
              as: "comments",
            },
          },
          { $unwind: "$comments" },
          { $match: { "comments.createdAt": { $gte: oneWeekAgo } } },
          { $group: { _id: null, totalComments: { $sum: 1 } } },
        ],
        monthlyComments: [
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "userId",
              as: "comments",
            },
          },
          { $unwind: "$comments" },
          { $match: { "comments.createdAt": { $gte: oneMonthAgo } } },
          { $group: { _id: null, totalComments: { $sum: 1 } } },
        ],
        yearlyComments: [
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "userId",
              as: "comments",
            },
          },
          { $unwind: "$comments" },
          { $match: { "comments.createdAt": { $gte: oneYearAgo } } },
          { $group: { _id: null, totalComments: { $sum: 1 } } },
        ],
        weeklyLikes: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "userId",
              as: "likes",
            },
          },
          { $unwind: "$likes" },
          { $match: { "likes.createdAt": { $gte: oneWeekAgo } } },
          { $group: { _id: null, totalLikes: { $sum: 1 } } },
        ],
        monthlyLikes: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "userId",
              as: "likes",
            },
          },
          { $unwind: "$likes" },
          { $match: { "likes.createdAt": { $gte: oneMonthAgo } } },
          { $group: { _id: null, totalLikes: { $sum: 1 } } },
        ],
        yearlyLikes: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "userId",
              as: "likes",
            },
          },
          { $unwind: "$likes" },
          { $match: { "likes.createdAt": { $gte: oneYearAgo } } },
          { $group: { _id: null, totalLikes: { $sum: 1 } } },
        ],
        recentComments: [
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "userId",
              as: "recentComments",
            },
          },
          {
            $unwind: "$recentComments",
          },
          {
            $sort: {
              "recentComments.createAt": -1,
            },
          },
          {
            $limit: 5,
          },
          {
            $replaceRoot: {
              newRoot: "$recentComments",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
              as: "Owner",
            },
          },
          {
            $unwind: "$Owner",
          },
          {
            $addFields: {
              Owner: "$Owner",
            },
          },
          {
            $project: {
              content: 1,
              Owner: 1,
              createdAt: 1,
            },
          },
        ],
        viralVideos: [
          {
            $lookup: {
              from: "videos",
              localField: "_id",
              foreignField: "owner",
              as: "viralVideos",
            },
          },
          {
            $unwind: "$viralVideos",
          },
          {
            $sort: {
              views: -1,
            },
          },
          {
            $limit: 5,
          },
          {
            $replaceRoot: {
              newRoot: "$viralVideos",
            },
          },
        ],
      },
    },
  ]);

  const usersCount = statistics[0].users[0]?.totalUsers || 0;
  const videosCount = statistics[0].videos[0]?.totalVideos || 0;
  const likesCount = statistics[0].likes[0]?.totalLikes || 0;
  const commentsCount = statistics[0].comments[0]?.totalComments || 0;

  const weeklyPerformance = {
    weeklyViews: statistics[0].WeeklyViews[0]?.totalViews,
    weeklyLikes: statistics[0].weeklyLikes[0]?.totalLikes,
    weeklyComments: statistics[0].weeklyComments[0]?.totalComments,
  };
  const monthlyPerformance = {
    monthlyViews: statistics[0].monthlyViews[0]?.totalViews,
    monthlyLikes: statistics[0].monthlyLikes[0]?.totalLikes,
    monthlyComments: statistics[0].monthlyComments[0]?.totalComments,
  };
  const yearlyPerformance = {
    yearlyLikes: statistics[0].yearlyLikes[0]?.totalLikes,
    yearlyComments: statistics[0].yearlyComments[0]?.totalComments,
    yearlyViews: statistics[0].yearlyViews[0]?.totalViews,
  };
  const payload = {
    comments: statistics[0].recentComments,
    viralVideos: statistics[0].viralVideos,
  };
  console.log(statistics);
  return res.json(
    new ApiResponse(
      202,
      {
        AggregateFigure: { usersCount, likesCount, commentsCount, videosCount },
        performance: {
          weeklyPerformance,
          monthlyPerformance,
          yearlyPerformance,
        },
        payload: payload,
      },
      "Statistic fetched successfully . . . . . . !"
    )
  );
});

export { PlatformAnalytics };
