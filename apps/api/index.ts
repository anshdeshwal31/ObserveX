import express from "express"
import {prisma} from "@repo/db"

const app = express();
app.use(express.json())


app.post("/website",async(req,res) => { 
    if(!req.body.url){
        res.status(411).json({});
        return;
    }
    const website = await prisma.website.create({
        data:{
            url:req.body.url
        }
    })

    res.json({id:website.id})
 })

 app.get("/website/:websiteId", (req,res) => { 
    
  })

  app.listen(process.env.PORT || 3000 , () => { 
    console.log("application is running")
   })