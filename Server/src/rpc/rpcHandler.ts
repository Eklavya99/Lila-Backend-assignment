export const matchMakerMatched: nkruntime.MatchmakerMatchedFunction = function(
    ctx, logger, nk, matches
){
    const matchId = nk.matchCreate("tic-tac-toe", {});
    return matchId;
}

export function createMatch(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    payload: string
): string{
    const matchId = nk.matchCreate("tic-tac-toe", {});
    return JSON.stringify({matchId});
}

export function getLeaderBoard(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    payload: string
): string{
    const records = nk.leaderboardRecordsList("tictactoe_wins", [], 10, undefined, 0);
    const userIds = records.records?.map(r => r.ownerId) ?? [];
    const users = userIds.length > 0 ? nk.usersGetId(userIds) : [];
    const usernamesMap: Record<string, string> = {};
    for(const user of users){
        usernamesMap[user.userId] = user.username;
    }
    
    const result = records.records?.map(r => ({
        username: usernamesMap[r.ownerId] ?? "unknown",
        wins: r.score,
        losses: r.subscore
    })) ?? [];
    return JSON.stringify(result);
}