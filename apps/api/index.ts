import express from "express"
import {prisma} from "@repo/db"
import { AuthInput } from "./types";
import jwt from "jsonwebtoken"
import { authMiddleware } from "./middleware";
import type { Request, Response } from "express";

const app = express();
app.use(express.json())

// signup endpoint
app.post('/user/signup',async (req:Request,res:Response) => { 
    try {
        
        const data = AuthInput.safeParse(req.body);
        if(!data.success){
            res.status(403).json({message:"data was in incorrect format"})
        }
        const username= data?.data?.username!
        const password = data?.data?.password!

        const user = await prisma.user.create({
            data:{
                username,
                password
            }
        })

        res.json({id:user.id})

    } catch (error) {
        console.log({error})
        res.json({error})
    }
 })


//  signin endpoint 

app.post ("/user/signin",async (req:Request,res:Response) => { 
    try {
        const data = AuthInput.safeParse(req.body)
        if(!data.success) res.status(403).json({message: " data was in incorrect format"})

        const user = await prisma.user.findFirst({
            where : {
                username : data.data?.username,
                password: data.data?.password
            }
        })

        if(!user)res.status(401).json({message:"username or password was incorrect"})

        const jwtToken = jwt.sign({
            id:user?.id
        },process.env.JWT_SECRET!)

        res.json({
            jwt:jwtToken
        })
        
    } catch (error) {
        console.log({error})
        res.json({error})
    }

 })

// endpoint to add website 
app.post("/website",authMiddleware,async(req:Request,res:Response) => { 
    if(!req.body.url){
        res.status(411).json({});
        return;
    }
    const user_id = req.user_id!

    const website = await prisma.website.create({
        data:{
            url:req.body.url,
            user_id
        }
    })

    res.json({id:website.id})
 })


//  endpoint to get the info of the website 
app.get("/status/:websiteId", authMiddleware,async(req:Request,res:Response) => { 
    try {
        const websiteInfo  = await prisma.website.findFirst({
            where:{
                user_id:req.body.user_id,
                id:Array.isArray(req.params.websiteId)?req.params.websiteId[0]:req.params.websiteId
            },
            include :{
                ticks:{
                    orderBy:[{
                        created_at:'desc'
                    }],
                    take:1
                }
            }
        })

        if(!websiteInfo) res.json({message: "couldn't find the website info"})
    } catch (error) {
        
    }
})

app.listen(process.env.PORT || 3000 , () => { 
console.log("application is running")
})