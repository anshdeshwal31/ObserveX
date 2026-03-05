import axios from "axios"
import { BACKEND_URL } from "./config"

const USER_NAME = Math.random().toString();

export async function createUser(): Promise<{
    id: string,
    jwt: string
}> {
    const res = await axios.post(`${BACKEND_URL}/user/signup`, {
        username: USER_NAME,
        password: "123123123"
    })

    const signinRes = await axios.post(`${BACKEND_URL}/user/signin`, {
        username: USER_NAME,
        password: "123123123"
    })

    // console.log({signinRes})
    // console.log("signinRes.data.jwt",signinRes.data.jwt)
    return {
        id: res.data.id,
        jwt: signinRes.data.jwt
    }
}