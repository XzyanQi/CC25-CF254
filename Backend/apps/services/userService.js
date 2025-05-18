const userRepository = require("../repositories/userRepository");
const authService = require("./authService");
exports.findAllUsers = async () => {
    try {
        return await userRepository.findAllUsers();
    } catch (error) {
        throw new Error("Error fetching users: " + error.message);
    }
}

exports.findUserById = async (id) => {
    try {
        return await userRepository.findUserById(id);
    } catch (error) {
        throw new Error("Error fetching user: " + error.message);
    }
}

exports.createUser = async (data) => {
    try {
        console.log(data);
        
        const { name, email, password } = data;
        const encryptedPassword = await authService.encryptedPassword(password);
        console.log(encryptedPassword);
        console.log(name, email, password);
        
        const user = await userRepository.createUser({
            name,
            email,
            password: encryptedPassword,
        })        
        console.log(user);
        
        return user;
    } catch (error) {
        throw new Error(error.message || "Error creating user");
    }
}

exports.updateUser = async (id, data) => {
    try {
        return await userRepository.updateUser(id, data);
    } catch (error) {
        throw new Error("Error updating user: " + error.message);
    }
}

exports.deleteUser = async (id) => {
    try {
        return await userRepository.deleteUser(id);
    } catch (error) {
        throw new Error("Error deleting user: " + error.message);
    }
}

exports.findUserByEmail = async (email) => {
    try {
        const data = await userRepository.findUserByEmail(email);
        if (!data) {
            throw new Error("User not found");
        }
        return data
    } catch (error) {
        throw new Error("Error fetching user by email: " + error.message);
    }
}

exports.findUserByName = async (name) => {
    try {
        return await userRepository.findUserByName(name);
    } catch (error) {
        throw new Error("Error fetching user by name: " + error.message);
    }
}