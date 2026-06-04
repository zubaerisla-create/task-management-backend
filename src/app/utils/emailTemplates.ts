export const getTaskAssignmentEmailTemplate = (
  memberName: string,
  taskTitle: string,
  projectName: string,
  dueDate: string,
  priority: string,
  actionUrl: string = "http://localhost:3000/dashboard"
) => {
  const priorityLower = priority.toLowerCase();
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Task Assigned</title>
    <style>
        body { font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #e4e4e7; }
        .header { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #18181b; margin-bottom: 20px; font-weight: 600; }
        .message { font-size: 15px; color: #52525b; line-height: 1.6; margin-bottom: 30px; }
        .task-card { background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 24px; margin-bottom: 30px; }
        .task-detail { margin-bottom: 16px; }
        .task-detail:last-child { margin-bottom: 0; }
        .label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #a1a1aa; font-weight: 600; margin-bottom: 6px; display: block; }
        .value { font-size: 16px; color: #18181b; font-weight: 500; margin: 0; }
        .value.title { font-size: 18px; font-weight: 700; color: #8b5cf6; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
        .badge-high { background-color: #fee2e2; color: #ef4444; }
        .badge-medium { background-color: #fef3c7; color: #f59e0b; }
        .badge-low { background-color: #d1fae5; color: #10b981; }
        .btn-container { text-align: center; margin-top: 10px; }
        .btn { display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 99px; font-weight: 600; font-size: 15px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25); }
        .btn:hover { background-color: #7c3aed; box-shadow: 0 6px 16px rgba(139, 92, 246, 0.35); transform: translateY(-1px); }
        .footer { padding: 30px; text-align: center; border-top: 1px solid #f4f4f5; background-color: #fafafa; }
        .footer p { color: #a1a1aa; font-size: 13px; margin: 0; }
        @media only screen and (max-width: 600px) {
            .container { margin: 20px; border-radius: 12px; }
            .header { padding: 30px 20px; }
            .content { padding: 30px 20px; }
            .task-card { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Task Assigned</h1>
        </div>
        <div class="content">
            <div class="greeting">Hi ${memberName},</div>
            <div class="message">
                You have been assigned a new task in the project <strong>${projectName}</strong>. Here are the details of what needs to be done:
            </div>
            
            <div class="task-card">
                <div class="task-detail">
                    <span class="label">Task Title</span>
                    <p class="value title">${taskTitle}</p>
                </div>
                <div class="task-detail">
                    <span class="label">Project</span>
                    <p class="value">${projectName}</p>
                </div>
                <div class="task-detail">
                    <span class="label">Due Date</span>
                    <p class="value">${new Date(dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div class="task-detail">
                    <span class="label">Priority</span>
                    <div>
                      <span class="badge badge-${priorityLower}">${priorityLower}</span>
                    </div>
                </div>
            </div>

            <div class="btn-container">
                <a href="${actionUrl}" class="btn">View Task Details</a>
            </div>
        </div>
        <div class="footer">
            <p>This is an automated notification from CollabFlow.</p>
        </div>
    </div>
</body>
</html>
  `;
};
