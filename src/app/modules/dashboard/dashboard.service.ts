import { TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "../../prisma/prisma";

const getDashboardInsights = async () => {
  const now = new Date();

  // 1. KPI Counts
  const [totalProjects, totalTasks, completedTasks, pendingTasks, overdueTasks] = await Promise.all([
    prisma.project.count(),
    prisma.task.count(),
    prisma.task.count({ where: { status: TaskStatus.COMPLETED } }),
    prisma.task.count({ where: { status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] } } }),
    prisma.task.count({
      where: {
        status: { not: TaskStatus.COMPLETED },
        dueDate: { lt: now },
      },
    }),
  ]);

  // 2. Project Summaries
  const projects = await prisma.project.findMany({
    include: {
      _count: {
        select: { tasks: true },
      },
      tasks: {
        select: { status: true },
      },
    },
  });

  const projectSummary = projects.map((project) => {
    const totalProjectTasks = project._count.tasks;
    const completedProjectTasks = project.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const pendingProjectTasks = totalProjectTasks - completedProjectTasks;
    const progressPercentage = totalProjectTasks > 0 ? Math.round((completedProjectTasks / totalProjectTasks) * 100) : 0;

    const timeDiff = new Date(project.deadline).getTime() - now.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return {
      id: project.id,
      name: project.name,
      deadline: project.deadline,
      status: project.status,
      totalTasks: totalProjectTasks,
      completedTasks: completedProjectTasks,
      pendingTasks: pendingProjectTasks,
      progressPercentage,
      daysLeft: daysLeft > 0 ? daysLeft : 0,
      isOverdue: daysLeft < 0 && project.status !== "COMPLETED",
    };
  });

  const priorityDistribution = await prisma.task.groupBy({
    by: ["priority"],
    _count: { id: true },
  });

  const tasksByPriority = {
    HIGH: priorityDistribution.find((item) => item.priority === TaskPriority.HIGH)?._count.id || 0,
    MEDIUM: priorityDistribution.find((item) => item.priority === TaskPriority.MEDIUM)?._count.id || 0,
    LOW: priorityDistribution.find((item) => item.priority === TaskPriority.LOW)?._count.id || 0,
  };


  const statusDistribution = await prisma.task.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const taskStatusDistribution = {
    TODO: statusDistribution.find((item) => item.status === TaskStatus.TODO)?._count.id || 0,
    IN_PROGRESS: statusDistribution.find((item) => item.status === TaskStatus.IN_PROGRESS)?._count.id || 0,
    COMPLETED: statusDistribution.find((item) => item.status === TaskStatus.COMPLETED)?._count.id || 0,
  };

  const members = await prisma.user.findMany({
    include: {
      assignedTasks: {
        select: { status: true },
      },
    },
  });

  const memberWorkloadSummary = members.map((member) => {
    const totalAssigned = member.assignedTasks.length;
    const completed = member.assignedTasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const pending = totalAssigned - completed;

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      profilePicture: member.profilePicture,
      totalTasks: totalAssigned,
      completedTasks: completed,
      pendingTasks: pending,
    };
  });

  // 6. Recent Activities
  const recentActivities = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // 7. Upcoming Deadlines
  const upcomingDeadlines = await prisma.task.findMany({
    where: {
      status: { not: TaskStatus.COMPLETED },
      dueDate: { gte: now },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
    select: {
      id: true,
      title: true,
      dueDate: true,
      priority: true,
      project: { select: { name: true } },
    },
  });

  // 8. High Priority Pending Tasks
  const highPriorityTasks = await prisma.task.findMany({
    where: {
      priority: TaskPriority.HIGH,
      status: { not: TaskStatus.COMPLETED },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
    select: {
      id: true,
      title: true,
      dueDate: true,
      status: true,
      project: { select: { name: true } },
    },
  });

  return {
    kpi: {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
    },
    projectSummary,
    tasksByPriority,
    taskStatusDistribution,
    memberWorkloadSummary,
    recentActivities,
    upcomingDeadlines,
    highPriorityTasks,
  };
};

export const DashboardService = {
  getDashboardInsights,
};
