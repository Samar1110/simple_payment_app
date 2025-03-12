const express=require("express")
const zod=require("zod")
const {User,Account}=require("../db")
const jwt=require("jsonwebtoken");
const JWT_KEY = require("../config")

const { authMiddleware } = require("../middleware");

const app=express();

const router=express.Router();

// ZOD
const userSchema = zod.object({
    username:zod.string().email().min(3).max(30),
    firstName:zod.string().min(3).max(30),
    lastName:zod.string().min(3).max(30),
    password:zod.string().min(3).max(30)
})

router.post("/signup",async (req,res)=>{

    const username=req.body.username;
    const password=req.body.password;
    const firstName=req.body.firstName;
    const lastName=req.body.lastName;

    if(!userSchema.safeParse(req.body).success){
        res.status(411).json({
            message:"Incorrect inputs"
        })
        return;
    }

    const userExist = await User.findOne({
        username:username
    })

    console.log(userExist)

    if(userExist){
        res.status(411).json({
            message:"Email already taken"
        })
        return;
    }


    try {
        
        const dbUser = await User.create({
            username:username,
            password:password,
            firstName:firstName,
            lastName:lastName
        }) 

        await Account.create({
            userId:dbUser._id,
            balance:1+Math.random()*1000
        })

        const token=jwt.sign({userId:dbUser._id},JWT_KEY)

        res.status(200).json({
            message:"User created successfully",
            token:token
        })

    } catch (error) {
        res.status(411).json({
            message:"Try Once Again"
        })
        return;
    }

})

// Zod
const schema2 = zod.object({
    password:zod.string().optional(),
    firstName:zod.string().optional(),
    lastName:zod.string().optional()
})

router.put("/",authMiddleware, async (req,res)=>{
    const {success} = schema2.safeParse(req.body)
    
    if(!success){
        return res.status(411).json({
            message: "Error while updating information"
        })
    }

    try {

        await User.updateOne({
            _id:req.userId
        },req.body)

        return res.status(200).json({
            message: "Updated successfully"
        })

    } catch (error) {
        return res.status(411).json({
            message: "Error while updating information"
        })
    }

})

// This filter similar to Like in sql queries
router.get("/bulk",authMiddleware,async (req,res)=>{
    const filter = req.query.filter || "";

    
    const users = await User.find({
        $or:[{
            firstName:{
                "$regex":filter
            }
        },{
            lastName:{
                '$regex':filter
            }
        }]
    })

    return res.status(200).json({
        user:users.map((user)=>{
            return ({
                username:user.username,
                firstName:user.firstName,
                lastName:user.lastName,
                _id:user._id
            })
        })
    })

})

module.exports=router;