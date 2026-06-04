import { TaskPriority, TaskStatus, UserRole } from "@prisma/client";
import ApiError from "../../errors/apiError";
import { prisma } from "../../prisma/prisma";
import { PrismaQueryBuilder } from "../../utils/QueryBuilder";
import { ActivityLogService } from "../activityLog/activityLog.service";

const createTask = async (payload: {
  title: string;
  description: string;
  dueDate: string;
  priority?: TaskPriority;
  projectId: string;
  assignedMemberId?: string;
}) => {
  const { title, description, dueDate, priority, projectId, assignedMemberId } = payload;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(dueDate) < today) {
    throw new ApiError(400, "Please select a valid deadline.");
  }

  const existingTask = await prisma.task.findFirst({
    where: {
      projectId,
      title: { equals: title, mode: "insensitive" },
    },
  });
  if (existingTask) {
    throw new ApiError(400, "This task already exists in the project.");
  }

  let memberName = "";
  if (assignedMemberId) {
    const member = await prisma.user.findUnique({
      where: { id: assignedMemberId },
    });
    if (!member) {
      throw new ApiError(404, "Assigned member user not found");
    }

    if (!project.memberIds.includes(assignedMemberId)) {
      throw new ApiError(400, "User is not a member of this project.");
    }
    memberName = member.name;
  }

  const result = await prisma.task.create({
    data: {
      title,
      description,
      dueDate: new Date(dueDate),
      priority: priority || TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      projectId,
      assignedMemberId: assignedMemberId || null,
    },
    include: {
      assignedMember: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Log activity
  await ActivityLogService.createLog(`Task "${title}" created under project "${project.name}"`);
  if (assignedMemberId) {
    await ActivityLogService.createLog(`Task "${title}" assigned to ${memberName}`);
  }

  return result;
};

const getAllTasks = async (query: Record<string, any>, user: { userId: string; role: string }) => {
  const qb = new PrismaQueryBuilder(query)
    .filter()
    .search(["title", "description"])
    .sort()
    .fields()
    .paginate();


  if (user.role === UserRole.TEAM_MEMBER) {
    qb.where = {
      ...qb.where,
      project: {
        memberIds: { has: user.userId },
      },
    };
  }

  const prismaQuery = qb.build();

  if (query.sortBy === "priority") {
  }

  const queryOptions: any = {
    where: prismaQuery.where,
    orderBy: prismaQuery.orderBy,
    skip: prismaQuery.skip,
    take: prismaQuery.take,
  };

  if (prismaQuery.select) {
    queryOptions.select = prismaQuery.select;
  } else {
    queryOptions.include = {
      assignedMember: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    };
  }

  const [data, total] = await Promise.all([
    prisma.task.findMany(queryOptions),
    prisma.task.count({ where: prismaQuery.where }),
  ]);

  return {
    meta: qb.getMeta(total),
    data,
  };
};

const getTaskById = async (id: string, user: { userId: string; role: string }) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new ApiError(400, "Invalid task ID format");
  }

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignedMember: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          memberIds: true,
        },
      },
    },
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (user.role === UserRole.TEAM_MEMBER && !task.project.memberIds.includes(user.userId)) {
    throw new ApiError(403, "You do not have access to this task");
  }

  return task;
};

const updateTask = async (
  id: string,
  payload: {
    title?: string;
    description?: string;
    dueDate?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    assignedMemberId?: string | null;
  },
  user: { userId: string; role: string }
) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new ApiError(400, "Invalid task ID format");
  }

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: true,
    },
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (user.role === UserRole.TEAM_MEMBER) {

    if (task.assignedMemberId !== user.userId) {
      throw new ApiError(403, "You can only update tasks assigned to you!");
    }

    const keys = Object.keys(payload);
    if (keys.some((k) => k !== "status")) {
      throw new ApiError(403, "Team members can only update task status!");
    }
  }

  const { title, description, dueDate, priority, status, assignedMemberId } = payload;
  const updateData: any = {};


  if (task.status === TaskStatus.COMPLETED && assignedMemberId !== undefined && assignedMemberId !== task.assignedMemberId) {
    throw new ApiError(400, "Completed tasks cannot be reassigned.");
  }

  if (title && title !== task.title) {
    const existingTask = await prisma.task.findFirst({
      where: {
        projectId: task.projectId,
        title: { equals: title, mode: "insensitive" },
        id: { not: id },
      },
    });
    if (existingTask) {
      throw new ApiError(400, "This task already exists in the project.");
    }
    updateData.title = title;
  }

  if (dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(dueDate) < today) {
      throw new ApiError(400, "Please select a valid deadline.");
    }
    updateData.dueDate = new Date(dueDate);
  }

  if (description) updateData.description = description;
  if (priority) updateData.priority = priority;
  if (status) updateData.status = status;

  let assignedMemberName = "";
  if (assignedMemberId !== undefined) {
    if (assignedMemberId === null) {
      updateData.assignedMember = { disconnect: true };
    } else {
      if (!/^[0-9a-fA-F]{24}$/.test(assignedMemberId)) {
        throw new ApiError(400, "Invalid member ID format");
      }
      const member = await prisma.user.findUnique({
        where: { id: assignedMemberId },
      });

      if (!member) {
        throw new ApiError(404, "Assigned member user not found");
      }

      if (!task.project.memberIds.includes(assignedMemberId)) {
        throw new ApiError(400, "User is not a member of this project.");
      }
      assignedMemberName = member.name;
      updateData.assignedMember = { connect: { id: assignedMemberId } };
    }
  }

  const result = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      assignedMember: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Log activities
  if (status && status !== task.status) {
    if (status === TaskStatus.COMPLETED) {
      await ActivityLogService.createLog(`Task "${result.title}" marked as Completed`);
    } else {
      await ActivityLogService.createLog(`Task "${result.title}" status updated to "${status}"`);
    }
  }

  if (assignedMemberId !== undefined && assignedMemberId !== task.assignedMemberId) {
    if (assignedMemberId === null) {
      await ActivityLogService.createLog(`Task "${result.title}" is now unassigned`);
    } else {
      await ActivityLogService.createLog(`Task "${result.title}" assigned to ${assignedMemberName}`);
    }
  }

  if (!status && assignedMemberId === undefined) {
    await ActivityLogService.createLog(`Task "${result.title}" updated`);
  }

  return result;
};

const deleteTask = async (id: string) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new ApiError(400, "Invalid task ID format");
  }

  const task = await prisma.task.findUnique({
    where: { id },
  });

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const result = await prisma.task.delete({
    where: { id },
  });

  // Log activity
  await ActivityLogService.createLog(`Task "${task.title}" deleted`);

  return result;
};

export const TaskService = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
