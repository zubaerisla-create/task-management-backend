import { ProjectStatus, UserRole } from "@prisma/client";
import ApiError from "../../errors/apiError";
import { prisma } from "../../prisma/prisma";
import { PrismaQueryBuilder } from "../../utils/QueryBuilder";
import { ActivityLogService } from "../activityLog/activityLog.service";

const createProject = async (payload: {
  name: string;
  description: string;
  deadline: string;
  memberIds?: string[];
}) => {
  const { name, description, deadline, memberIds } = payload;

  const result = await prisma.project.create({
    data: {
      name,
      description,
      deadline: new Date(deadline),
      status: ProjectStatus.ACTIVE,
      members: memberIds && memberIds.length > 0
        ? { connect: memberIds.map((id) => ({ id })) }
        : undefined,
    },
    include: {
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  // Log activity
  await ActivityLogService.createLog(`Project "${name}" created`);

  return result;
};

const getAllProjects = async (query: Record<string, any>, user: { userId: string; role: string }) => {
  const qb = new PrismaQueryBuilder(query)
    .filter()
    .search(["name", "description"])
    .sort()
    .fields()
    .paginate();

  // Role-based filtering
  if (user.role === UserRole.TEAM_MEMBER) {
    qb.where = {
      ...qb.where,
      memberIds: { has: user.userId },
    };
  }

  const prismaQuery = qb.build();

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
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    };
  }

  const [data, total] = await Promise.all([
    prisma.project.findMany(queryOptions),
    prisma.project.count({ where: prismaQuery.where }),
  ]);

  return {
    meta: qb.getMeta(total),
    data,
  };
};

const getProjectById = async (id: string, user: { userId: string; role: string }) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new ApiError(400, "Invalid project ID format");
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Enforce access control for TEAM_MEMBER
  if (user.role === UserRole.TEAM_MEMBER && !project.memberIds.includes(user.userId)) {
    throw new ApiError(403, "You do not have access to this project");
  }

  return project;
};

const updateProject = async (
  id: string,
  payload: {
    name?: string;
    description?: string;
    deadline?: string;
    status?: ProjectStatus;
    memberIds?: string[];
  }
) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new ApiError(400, "Invalid project ID format");
  }

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const { name, description, deadline, status, memberIds } = payload;

  const updateData: any = {};
  if (name) updateData.name = name;
  if (description) updateData.description = description;
  if (deadline) updateData.deadline = new Date(deadline);
  if (status) updateData.status = status;

  if (memberIds) {
    updateData.members = {
      set: memberIds.map((memberId) => ({ id: memberId })),
    };
  }

  const result = await prisma.project.update({
    where: { id },
    data: updateData,
    include: {
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  // Log activity
  await ActivityLogService.createLog(`Project "${result.name}" updated`);

  return result;
};

const deleteProject = async (id: string) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new ApiError(400, "Invalid project ID format");
  }

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const result = await prisma.project.delete({
    where: { id },
  });

  // Log activity
  await ActivityLogService.createLog(`Project "${project.name}" deleted`);

  return result;
};

const addMember = async (projectId: string, memberId: string) => {
  if (!/^[0-9a-fA-F]{24}$/.test(projectId) || !/^[0-9a-fA-F]{24}$/.test(memberId)) {
    throw new ApiError(400, "Invalid ID format");
  }

  const [project, member] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.user.findUnique({ where: { id: memberId } }),
  ]);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }
  if (!member) {
    throw new ApiError(404, "User not found");
  }

  if (project.memberIds.includes(memberId)) {
    throw new ApiError(400, "User is already a member of this project");
  }

  const result = await prisma.project.update({
    where: { id: projectId },
    data: {
      members: {
        connect: { id: memberId },
      },
    },
    include: {
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  // Log activity
  await ActivityLogService.createLog(`Member "${member.name}" added to "${project.name}"`);

  return result;
};

const removeMember = async (projectId: string, memberId: string) => {
  if (!/^[0-9a-fA-F]{24}$/.test(projectId) || !/^[0-9a-fA-F]{24}$/.test(memberId)) {
    throw new ApiError(400, "Invalid ID format");
  }

  const [project, member] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.user.findUnique({ where: { id: memberId } }),
  ]);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }
  if (!member) {
    throw new ApiError(404, "User not found");
  }

  if (!project.memberIds.includes(memberId)) {
    throw new ApiError(400, "User is not a member of this project");
  }

  // Unassign tasks of this user under this project
  await prisma.task.updateMany({
    where: {
      projectId,
      assignedMemberId: memberId,
    },
    data: {
      assignedMemberId: null,
    },
  });

  const result = await prisma.project.update({
    where: { id: projectId },
    data: {
      members: {
        disconnect: { id: memberId },
      },
    },
    include: {
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  // Log activity
  await ActivityLogService.createLog(`Member "${member.name}" removed from "${project.name}"`);

  return result;
};

export const ProjectService = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
