import * as z from "zod";


const logInSchema = z.object({    
    email : z.email("Invalid email adddress"),
    password : z.string().min(6,"Password must be at least 6 characters long").max(20,"Password must be at most 20 characters long"),
})

export default logInSchema;