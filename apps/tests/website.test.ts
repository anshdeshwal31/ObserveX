import { describe, it, expect, beforeAll } from "bun:test";
import axios from "axios";
import { createUser } from "./testUtils";


let BASE_URL = "http://localhost:3000";

describe("Website gets created", () => {
    let token: string
    beforeAll(async () => { 
        const data = await createUser();
        token = data.jwt as string;
     })
    
    it("Website not created if url is not present", async () => {
        try {
            await axios.post(`${BASE_URL}/website`, {

            },
            {
                headers:{
                    Authorization:token
                }
            }
        );
            expect(false, "Website created when it shouldn't");
        } catch(e) {

        }

    })

    it("Website is created if url is present", async () => {
        try {
            console.log({token})
            const response = await axios.post(`${BASE_URL}/website`, {
                url: "https://google.com"
            },
            {
                headers:{
                    Authorization:token
                }
            }
            );
            expect(response.data.id).not.toBeNull();
        } catch (error) {
            console.log("THE ERROR IS: ", error)
        }

    })

    
    it("Website is not created if the header is not present", async () => {
        try {
            
            const response = await axios.post(`${BASE_URL}/website`, {
                url: "https://google.com"
                }
            );
            expect(false , "website shouldn't be created if header is not passed ")
            
        } catch (error) {
            
        }
    })
})