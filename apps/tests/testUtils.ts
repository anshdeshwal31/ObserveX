type ClerkTestUser = {
    id: string;
    jwt: string;
};

function getEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(
            `Missing ${name}. Set it in your environment to run Clerk-auth tests.`
        );
    }
    return value;
}

export function getTestUser(slot: 1 | 2 = 1): ClerkTestUser {
    const idKey = slot === 1 ? "CLERK_TEST_USER_ID" : "CLERK_TEST_USER_ID_2";
    const jwtKey = slot === 1 ? "CLERK_TEST_JWT" : "CLERK_TEST_JWT_2";

    return {
        id: getEnv(idKey),
        jwt: getEnv(jwtKey),
    };
}