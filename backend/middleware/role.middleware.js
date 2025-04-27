// Role-based access control middleware
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({
      success: false,
      message: "No user information found"
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Require Admin Role"
    });
  }
  next();
};

exports.isAgent = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({
      success: false,
      message: "No user information found"
    });
  }

  if (req.user.role !== 'agent') {
    return res.status(403).json({
      success: false,
      message: "Require Agent Role"
    });
  }
  next();
};

exports.isAdminOrAgent = (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({
      success: false,
      message: "No user information found"
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'agent') {
    return res.status(403).json({
      success: false,
      message: "Require Admin or Agent Role"
    });
  }
  next();
};