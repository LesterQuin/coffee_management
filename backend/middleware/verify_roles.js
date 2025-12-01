export const verifyRoles = (...allowedRoles) => {
    return (req, res, next) => {
        
        if (!req?.role) {
            return res.status(401).json({ 
                success: false, 
                message: "User role not found. Access denied." 
            });
        }
        
        const rolesArray = [...allowedRoles];
        console.log("Allowed roles: ", rolesArray);
        console.log("Req: ", req.role);

        const result = rolesArray.includes(req.role);
        console.log("Response result: ", result)
        if (!result) {
            return res.status(403).json({ 
                success: false, 
                message: "You do not have permission to access this resource." 
            });
        }
        next()
    };
}   