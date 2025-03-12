const express = require("express");
const { authMiddleware } = require("../middleware");
const { Account } = require("../db");
const zod = require("zod");
const { default: mongoose } = require("mongoose");

const router=express.Router();

router.get("/balance",authMiddleware,async (req,res)=>{
    // console.log("Reached Balance")
    try {
        const account = await Account.findOne({
            userId:req.userId
        })

        // console.log(account)

        return res.status(200).json({
            balance:account.balance
        })
        
    } catch (error) {
        return res.status(411).json({
            message:"Try Again"
        })
    }
})

//Zod
const schemaOne=zod.object({
    to:zod.string(),
    amount:zod.number()
})
router.post("/transfer",authMiddleware,async (req,res)=>{
    const {success} = schemaOne.safeParse(req.body);
    
    if(!success){
        return res.status(411).json({
            message:"Incorrect Input"
        })
    }

    const session = await mongoose.startSession();

    session.startTransaction();

    const {to,amount} = req.body;

    const account = await Account.findOne({
        userId:req.userId
    }).session(session);

    if(!account||account.balance<amount){
        await session.abortTransaction();
        return res.status(400).json({
            message:"Insufficient balance"
        })
    }

    const toAccount = await Account.findOne({
        userId:to
    }).session(session);

    if(!toAccount){
        await session.abortTransaction();
        return res.status(400).json({
            message:"Invalid account"
        })
    }

    // Perform Transaction
    await Account.updateOne({
        userId:req.userId
    },{
        $inc:{
            balance:-amount
        }}).session(session);

    await Account.updateOne({
        userId:to
    },{
        $inc:{
            balance:amount
        }}).session(session);

    // Commit the transaction
    await session.commitTransaction();

    return res.status(200).json({
        message:"Transfer successful"
    });
    
});

module.exports=router;