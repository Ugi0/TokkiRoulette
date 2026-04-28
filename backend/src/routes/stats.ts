import {IncomingMessage, ServerResponse} from "http";

export default async function leaderboardResults(
    req: IncomingMessage,
    res: ServerResponse,
    url: URL
): Promise<IncomingMessage | ServerResponse | void> {

}

// Top losses, Top Winners
/*

I need to create a function that can get called with a request that asks for one of the databases sorts,
along with a time period like all time, or last month, it should then return a list of the users in sorted order
corresponding to the database type requested

*/
