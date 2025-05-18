const userServices = require('../services/userService');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await userServices.findAllUsers();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
}

exports.getUserById = async (req, res) => {
    const { id } = req.params;
    console.log('User ID:', id);
    
    try {
        const user = await userServices.findUserById(id);
        console.log('User:', user);
        
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Failed to fetch user' });
    }
}

exports.createUser = async (req, res) => {
    const body = req.body;
    console.log('User Body:', body);
    
    try {
        const user = await userServices.createUser(body);
        console.log('Created User:', user);
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json(error.message || { message: 'Failed to create user' });
    }
}

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    try {
        const user = await userServices.updateUser(id, { name, email });
        res.status(200).json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Failed to update user' });
    }
}

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await userServices.deleteUser(id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
}

exports.getUserByEmail = async (req, res) => {
    const { email } = req.params;
    console.log('User Email:', email);
    
    try {
        const user = await userServices.findUserByEmail(email);
        console.log('User:', user);
        
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user by email:', error);
        res.status(500).json({ message: 'Failed to fetch user by email' });
    }
}

exports.getUserByName = async (req, res) => {
    const { name } = req.params;
    console.log('User Name:', name);
    
    try {
        const user = await userServices.findUserByName(name);
        console.log('User:', user);
        
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user by name:', error);
        res.status(500).json({ message: 'Failed to fetch user by name' });
    }
}