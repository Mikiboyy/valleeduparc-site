function requireLogin(req, res, next) {
    if (!req.session.admin) {
        return res.redirect('/admin-vdp/login');
    }

    res.locals.adminUser = req.session.admin;
    next();
}

function requireRole(...allowedRoles) {

    return (req, res, next) => {

        if (!req.session.admin) {
            return res.redirect('/admin-vdp/login');
        }

        const userRole = req.session.admin.role;

        // ADMIN = accès à tout
        if (userRole === 'admin') {
            return next();
        }

        // Vérification du rôle
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).render('admin/forbidden', {
                title: 'Accès refusé'
            });
        }

        next();
    };
}

function canAccess(userRole, allowedRoles) {

    if (userRole === 'admin') {
        return true;
    }

    return allowedRoles.includes(userRole);
}

module.exports = {
    requireLogin,
    requireRole,
    canAccess
};