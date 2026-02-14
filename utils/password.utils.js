import bcrypt from "bcryptjs";

const comparePassword = async (plainPassword , hashedPassword) =>{
    return await bcrypt.compare(plainPassword,hashedPassword);
}


const generateHashedPassword = async (plainPassword) => {
    const hashedPassword = await bcrypt.hash(plainPassword,10);
    return hashedPassword;
}

export {comparePassword , generateHashedPassword};