const Admin = require('../models/Admin');
const ActivityLog = require('../models/ActivityLog');

const checkIPWhitelist = async (req, res, next) => {
    try {
        // Skip IP check if admin hasn't enabled IP whitelisting
        const admin = await Admin.findById(req.user._id);
        if (!admin.allowedIPs || admin.allowedIPs.length === 0) {
            return next();
        }

        const clientIP = req.ip || 
                        req.connection.remoteAddress || 
                        req.socket.remoteAddress || 
                        req.connection.socket.remoteAddress;

        const isAllowed = admin.allowedIPs.some(ip => ip.ip === clientIP);

        if (!isAllowed) {
            // Log unauthorized access attempt
            await new ActivityLog({
                adminId: admin._id,
                action: 'UNAUTHORIZED_IP_ACCESS',
                details: { ip: clientIP },
                ip: clientIP,
                userAgent: req.headers['user-agent'],
                status: 'blocked'
            }).save();

            return res.status(403).json({
                message: 'Access denied: IP not whitelisted',
                ip: clientIP
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

const logActivity = async (req, res, next) => {
    const oldJson = res.json;
    res.json = async function(data) {
        res.json = oldJson;
        
        try {
            const clientIP = req.ip || 
                            req.connection.remoteAddress || 
                            req.socket.remoteAddress || 
                            req.connection.socket.remoteAddress;

            const userAgent = require('ua-parser-js')(req.headers['user-agent']);
            
            await new ActivityLog({
                adminId: req.user ? req.user._id : null,
                action: req.method + ' ' + req.path,
                details: {
                    body: req.body,
                    query: req.query,
                    params: req.params
                },
                ip: clientIP,
                userAgent: req.headers['user-agent'],
                browser: `${userAgent.browser.name} ${userAgent.browser.version}`,
                os: `${userAgent.os.name} ${userAgent.os.version}`,
                status: res.statusCode >= 400 ? 'failed' : 'success'
            }).save();
        } catch (error) {
            console.error('Error logging activity:', error);
        }

        return res.json(data);
    };
    next();
};

module.exports = {
    checkIPWhitelist,
    logActivity
};