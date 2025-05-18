const authService = require("../services/authService");

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await authService.login(email, password);

        res.status(200).json({
            status: "LOGIN SUCCESS",
            data: user,
        });
    } catch (err) {
        res.status(err.statusCode || 500).json({
            status: "LOGIN FAIL",
            message: err.message,
        });
    }
}

exports.logout = async (req, res) => {
    try {
        authService.logout(req, res);
    } catch (err) {
        res.status(err.statusCode || 500).json({
            status: "LOGOUT FAIL",
            message: err.message,
        });
    }
}

exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const response = await authService.resetPassword(email, newPassword);
        res.status(200).json({
            status: "RESET PASSWORD SUCCESS",
            message: response.message,
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "RESET PASSWORD FAIL",
            message: error.message,
        });
        
    }
}

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await authService.register(name, email, password);
        res.status(201).json({
            status: "REGISTER SUCCESS",
            data: user,
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "REGISTER FAIL",
            message: error.message,
        });
    }
}