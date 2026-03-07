import { describe, it, expect, beforeAll } from "bun:test";
import axios from "axios";
import { createUser } from "./testUtils";


let BASE_URL = "http://localhost:3000";

describe("Website gets created", () => {
    let token: string,id:string
    beforeAll(async () => { 
        const data = await createUser();
        token = data.jwt as string;
        id = data.id
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

describe("Can fetch website", () => {
    let token1: string, userId1: string;
    let token2: string, userId2: string;

    beforeAll(async () => {
        const user1 = await createUser();
        const user2 = await createUser();
        token1 = user1.jwt;
        userId1 = user1.id;
        token2 = user2.jwt;
        userId2 = user2.id;
    });

    it("Is able to fetch a website that the user created", async () => {
        try {
            
            const websiteResponse = await axios.post(`${BASE_URL}/website`, {
                url: "https://google.com",
                user_id:userId1

            }, {
                headers: {
                    Authorization: token1
                }
            })
            
            const getWebsiteResponse = await axios.get(`${BASE_URL}/website/${websiteResponse.data.id}`, {
                headers: {
                    Authorization: token1
                }
            })
            
            expect(getWebsiteResponse.data.websiteInfo.id).toBe(websiteResponse.data.id)
            expect(getWebsiteResponse.data.websiteInfo.userId).toBe(userId1)
        } catch (error) {
            console.log("Error in test",error)
        }
    })

    it("Cant access website created by other user", async () => {
        const websiteResponse = await axios.post(`${BASE_URL}/website`, {
            url: "https://google.com", 
            user_id:userId1
        }, {
            headers: {
                Authorization: token1
            }
        })

        try {
            await axios.get(`${BASE_URL}/website/${websiteResponse.data.id}`, {
                headers: {
                    Authorization: token2
                }
            })
            expect(false, "Should be able to access website of a diff user")
        } catch(error) {
            console.log("Error in test",error)
        }
    })
})