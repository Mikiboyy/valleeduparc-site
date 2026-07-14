function requireLogin(req, res, next) {
    if (!req.session.admin) {
        return res.redirect('/admin-vdp/login');
    }

    res.locals.adminUser = req.session.admin;
    next();
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.session.admin) {
            return res.redirect('/admin-vdp/login');
        }

        if (req.session.admin.role === 'admin') {
            return next();
        }

        if (!roles.includes(req.session.admin.role)) {
            return res.status(403).render('admin/forbidden', {
                title: 'Accès refusé'
            });
        }

        next();
    };
}

function canAccess(role, allowedRoles) {
    return role === 'admin' || allowedRoles.includes(role);
}

module.exports = {
    requireLogin,
    requireRole,
    canAccess
};