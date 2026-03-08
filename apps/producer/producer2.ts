import { createClient } from "redis"


interface websiteType {
    id:string , 
    message: {
        url:string , 
        id: string  

    }
}

const client = await createClient()
        .on("error", (err) => console.log("Redis Client Error", err))
        .connect();

export const addToStream2 = async (website:websiteType , status:string , response_time_ms:number , region_id:string  ) => { 
    const res = await client.xAdd('observeX:websiteResponse', '*',{
        websiteUrl : website.message.url,
        websiteId : website.message.id , 
        status ,
        response_time_ms:response_time_ms.toString() ,
        region_id
    })
 }
