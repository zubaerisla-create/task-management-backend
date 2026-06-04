import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ActivityLogService } from "./activityLog.service";

const getLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await ActivityLogService.getLogs();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Recent activity logs retrieved successfully",
    data: result,
  });
});

export const ActivityLogController = {
  getLogs,
};
