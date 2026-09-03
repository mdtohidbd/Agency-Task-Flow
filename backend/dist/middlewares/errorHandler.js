export function errorHandler(err, req, res, _next) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    const code = err.code || 'INTERNAL_ERROR';
    console.error(`[Error] ${req.method} ${req.url} - ${code}: ${message}`, err.stack);
    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message
        }
    });
}
