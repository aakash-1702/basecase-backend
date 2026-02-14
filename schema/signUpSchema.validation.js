import * as z from "zod";


const signUpSchema = z.object({
    name : z.string().min(2,"Name must be at least 2 characters long").max(20,"Name must be at most 20 characters long"),  
    email : z.email("Invalid email adddress"),
    password : z.string().min(6,"Password must be at least 6 characters long").max(20,"Password must be at most 20 characters long"),
})

export default signUpSchema;