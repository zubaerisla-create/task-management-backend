import { prisma } from "../../prisma/prisma";

const createLog = async (message: string) => {
  return prisma.activityLog.create({
    data: {
      message,
    },
  });
};

const getLogs = async () => {
  return prisma.activityLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });
};

export const ActivityLogService = {
  createLog,
  getLogs,
};
