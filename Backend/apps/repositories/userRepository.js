const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

exports.findAllUsers = async () => await prisma.user.findMany({});

exports.findUserById = async (id) => await prisma.user.findUnique({
    where: { id },
});

exports.createUser = async (data) => await prisma.user.create({
    data: data,
});

exports.updateUser = async (id, data) => await prisma.user.update({
    where: { id },
    data: { ...data },
});

exports.deleteUser = async (id) => await prisma.user.delete({
    where: { id },
});

exports.findUserByEmail = async (email) => await prisma.user.findUnique({
    where: { email },
});

exports.findUserByName = async (name) => await prisma.user.findUnique({
    where: { name },
});