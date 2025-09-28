const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    ip: String,
    userAgent: String,
    browser: String,
    os: String,
    status: {
        type: String,
        enum: ['success', 'failed', 'blocked'],
        default: 'success'
    }
}, {
    timestamps: true
});

// Index for better query performance
activityLogSchema.index({ adminId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;