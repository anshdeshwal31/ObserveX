// mongoose
import { createClient } from "redis";
import {prisma} from "@repo/db"

interface websiteType{
    id:string ,
    url:string , 
    user_id:string ,
    time_added :Date ,

}

async function main() {
    const client = await createClient()
        .on("error", (err) => console.log("Redis Client Error", err))
        .connect();
    
    const websites = await prisma.website.findMany();

    websites.forEach(async (website:websiteType) =>{
        const res = await client.xAdd('observeX:website', '*', {
            url: website.url,
            id: website.id
        })

    })
    
    client.destroy()
}

main();