import jwt from 'jsonwebtoken';
import { db } from '../db/store.js';
export const JWT_SECRET = process.env.JWT_SECRET || 'agencysync-notepad-secret-key-2026';
export async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // For convenience in prototyping / demo mode if no auth token is provided, fall back to Mahim
        const defaultUser = await db.getUserById('user-mahim');
        if (defaultUser) {
            req.user = defaultUser;
            return next();
        }
        res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required'
            }
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.getUserById(decoded.id);
        if (!user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User belonging to token no longer exists'
                }
            });
            return;
        }
        req.user = user;
        next();
    }
    catch {
        res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid or expired authentication token'
            }
        });
    }
}
