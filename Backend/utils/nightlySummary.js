import cron from 'node-cron';
import userModel from '../models/userModel.js';
import Task from '../models/taskModel.js';
import FocusSession from '../models/focusSessionModel.js';
import { sendMail } from './mailer.js';

function formatMinutes(mins) {
    if (!mins) return '0m';
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}

function buildEmailHTML(userName, completedTasks, pendingTasks, focusedMinutes, totalEstimatedMinutes, dateStr) {
    const completedRows = completedTasks.length > 0
        ? completedTasks.map(t => `
            <tr>
                <td style="padding:10px 14px;border-bottom:1px solid #2a2a3a;color:#a3e635;font-size:14px;">✅ ${t.title}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #2a2a3a;color:#94a3b8;font-size:13px;text-align:center;">${t.priority}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #2a2a3a;color:#94a3b8;font-size:13px;text-align:center;">${t.estimatedMinutes || 0}m</td>
            </tr>`).join('')
        : `<tr><td colspan="3" style="padding:16px;text-align:center;color:#6b7280;font-style:italic;">No tasks completed today</td></tr>`;

    const pendingRows = pendingTasks.length > 0
        ? pendingTasks.map(t => `
            <tr>
                <td style="padding:10px 14px;border-bottom:1px solid #2a2a3a;color:#fbbf24;font-size:14px;">⏳ ${t.title}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #2a2a3a;color:#94a3b8;font-size:13px;text-align:center;">${t.priority}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #2a2a3a;color:#94a3b8;font-size:13px;text-align:center;">${t.estimatedMinutes || 0}m</td>
            </tr>`).join('')
        : `<tr><td colspan="3" style="padding:16px;text-align:center;color:#6b7280;font-style:italic;">All tasks completed! 🎉</td></tr>`;

    const focusPercent = totalEstimatedMinutes > 0 ? Math.round((focusedMinutes / totalEstimatedMinutes) * 100) : 0;
    const progressBarWidth = Math.min(focusPercent, 100);

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a12;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

        <!-- Header -->
        <div style="text-align:center;padding:28px 24px;background:linear-gradient(135deg,#1a1a2e 0%,#16162a 100%);border-radius:16px 16px 0 0;border:1px solid #2a2a3a;border-bottom:none;">
            <div style="font-size:28px;margin-bottom:8px;">🌙</div>
            <h1 style="margin:0;color:#e4e4ed;font-size:22px;font-weight:600;">Your Daily Recap</h1>
            <p style="margin:6px 0 0;color:#7c7c8a;font-size:13px;">${dateStr} · Taskora</p>
        </div>

        <!-- Focus Summary Card -->
        <div style="padding:24px;background:#12121c;border-left:1px solid #2a2a3a;border-right:1px solid #2a2a3a;">
            <div style="background:linear-gradient(135deg,#1e1e30,#1a1a28);border:1px solid #2a2a3a;border-radius:12px;padding:20px;">
                <p style="margin:0 0 4px;color:#7c7c8a;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Focus Summary</p>
                <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:12px;">
                    <span style="font-size:32px;font-weight:700;color:#e4e4ed;">${formatMinutes(focusedMinutes)}</span>
                    <span style="font-size:14px;color:#6b7280;">/ ${formatMinutes(totalEstimatedMinutes)} goal</span>
                </div>
                <!-- Progress bar -->
                <div style="width:100%;height:10px;background:#1a1a2e;border-radius:99px;overflow:hidden;">
                    <div style="width:${progressBarWidth}%;height:100%;background:linear-gradient(90deg,#7c3aed,#8b5cf6,#a78bfa);border-radius:99px;transition:width 0.5s;"></div>
                </div>
                <p style="margin:8px 0 0;color:#6b7280;font-size:12px;">${focusPercent}% of your daily goal</p>
            </div>

            <!-- Quick Stats -->
            <div style="margin-top:16px;display:flex;gap:12px;">
                <div style="flex:1;background:#1a1a2e;border:1px solid #2a2a3a;border-radius:10px;padding:14px;text-align:center;">
                    <p style="margin:0;font-size:24px;font-weight:700;color:#a3e635;">${completedTasks.length}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Completed</p>
                </div>
                <div style="flex:1;background:#1a1a2e;border:1px solid #2a2a3a;border-radius:10px;padding:14px;text-align:center;">
                    <p style="margin:0;font-size:24px;font-weight:700;color:#fbbf24;">${pendingTasks.length}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Pending</p>
                </div>
                <div style="flex:1;background:#1a1a2e;border:1px solid #2a2a3a;border-radius:10px;padding:14px;text-align:center;">
                    <p style="margin:0;font-size:24px;font-weight:700;color:#8b5cf6;">${completedTasks.length + pendingTasks.length}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Total</p>
                </div>
            </div>
        </div>

        <!-- Completed Tasks -->
        <div style="padding:24px;background:#12121c;border-left:1px solid #2a2a3a;border-right:1px solid #2a2a3a;">
            <h2 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#a3e635;">✅ Completed Tasks</h2>
            <table style="width:100%;border-collapse:collapse;background:#1a1a2e;border-radius:10px;overflow:hidden;">
                <thead>
                    <tr style="background:#16162a;">
                        <th style="padding:10px 14px;text-align:left;color:#7c7c8a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #2a2a3a;">Task</th>
                        <th style="padding:10px 14px;text-align:center;color:#7c7c8a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #2a2a3a;">Priority</th>
                        <th style="padding:10px 14px;text-align:center;color:#7c7c8a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #2a2a3a;">Est. Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${completedRows}
                </tbody>
            </table>
        </div>

        <!-- Pending Tasks -->
        <div style="padding:0 24px 24px;background:#12121c;border-left:1px solid #2a2a3a;border-right:1px solid #2a2a3a;">
            <h2 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#fbbf24;">⏳ Pending Tasks</h2>
            <table style="width:100%;border-collapse:collapse;background:#1a1a2e;border-radius:10px;overflow:hidden;">
                <thead>
                    <tr style="background:#16162a;">
                        <th style="padding:10px 14px;text-align:left;color:#7c7c8a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #2a2a3a;">Task</th>
                        <th style="padding:10px 14px;text-align:center;color:#7c7c8a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #2a2a3a;">Priority</th>
                        <th style="padding:10px 14px;text-align:center;color:#7c7c8a;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #2a2a3a;">Est. Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${pendingRows}
                </tbody>
            </table>
        </div>

        <!-- Footer -->
        <div style="padding:20px 24px;background:#16162a;border-radius:0 0 16px 16px;border:1px solid #2a2a3a;border-top:none;text-align:center;">
            <p style="margin:0;font-size:12px;color:#4a4a5a;">Sent with 💜 by <strong style="color:#8b5cf6;">Taskora</strong></p>
            <p style="margin:4px 0 0;font-size:11px;color:#3a3a4a;">Tomorrow is a new start. Keep pushing, ${userName}!</p>
        </div>

    </div>
</body>
</html>`;
}

async function sendNightlySummaryToAllUsers() {
    console.log('🌙 Running nightly email summary job...');

    try {
        const users = await userModel.find({}, 'name email');

        if (!users.length) {
            console.log('🌙 No users found, skipping...');
            return;
        }

        // Get today's date range (start of day to end of day)
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

        for (const user of users) {
            try {
                // Fetch all tasks for this user
                const allTasks = await Task.find({ owner: user._id });
                const completedTasks = allTasks.filter(t => t.completed);
                const pendingTasks = allTasks.filter(t => !t.completed);

                // Fetch today's focus sessions for this user
                const todaySessions = await FocusSession.find({
                    userId: user._id,
                    startTime: { $gte: startOfDay, $lt: endOfDay },
                });
                const sessionMinutes = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
                const completedTaskMinutes = completedTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
                const focusedMinutes = sessionMinutes + completedTaskMinutes;

                // Total estimated minutes from ALL tasks (the daily goal)
                const totalEstimatedMinutes = allTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

                const html = buildEmailHTML(
                    user.name.split(' ')[0],
                    completedTasks,
                    pendingTasks,
                    focusedMinutes,
                    totalEstimatedMinutes,
                    dateStr
                );

                await sendMail(
                    user.email,
                    `🌙 Your Taskora Daily Recap — ${dateStr}`,
                    html
                );
            } catch (userErr) {
                console.error(`✉ Failed to process email for ${user.email}:`, userErr.message);
            }
        }

        console.log('🌙 Nightly email job completed.');
    } catch (err) {
        console.error('🌙 Nightly email job failed:', err.message);
    }
}

/**
 * Schedule the nightly email cron job.
 * Runs every day at 11:30 PM server time.
 * Cron format: second(optional) minute hour dayOfMonth month dayOfWeek
 *   "30 23 * * *" = at 23:30 every day
 */
export function scheduleNightlyEmail() {
    cron.schedule('30 23 * * *', () => {
        sendNightlySummaryToAllUsers();
    }, {
        timezone: "Asia/Kolkata"
    });

    console.log('⏰ Nightly email summary cron job scheduled for 11:30 PM IST');
}

/**
 * Send the nightly summary to a SINGLE user (for testing / manual trigger).
 * @param {string} userId - MongoDB user _id
 */
export async function sendNightlySummaryToUser(userId) {
    try {
        const user = await userModel.findById(userId, 'name email');
        if (!user) {
            console.log('🌙 User not found, skipping...');
            return;
        }

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

        const allTasks = await Task.find({ owner: user._id });
        const completedTasks = allTasks.filter(t => t.completed);
        const pendingTasks = allTasks.filter(t => !t.completed);

        const todaySessions = await FocusSession.find({
            userId: user._id,
            startTime: { $gte: startOfDay, $lt: endOfDay },
        });
        const sessionMinutes = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const completedTaskMinutes = completedTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
        const focusedMinutes = sessionMinutes + completedTaskMinutes;
        const totalEstimatedMinutes = allTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

        const html = buildEmailHTML(
            user.name.split(' ')[0],
            completedTasks,
            pendingTasks,
            focusedMinutes,
            totalEstimatedMinutes,
            dateStr
        );

        await sendMail(
            user.email,
            `🌙 Your Taskora Daily Recap — ${dateStr}`,
            html
        );

        console.log(`🌙 Summary email sent to ${user.email}`);
    } catch (err) {
        console.error('🌙 Failed to send summary to user:', err.message);
        throw err;
    }
}

// Export for cron job
export { sendNightlySummaryToAllUsers };
