import { TicTacToeMatch } from "../match/Match";

export const matchInit: nkruntime.MatchInitFunction = function(
    ctx, logger, nk, params
){
    const match = new TicTacToeMatch();
    logger.info("Tic-tac-toe match created...");
    return {
        state: match,
        tickRate: 1,
        label: "tic-tac-toe"
    }
};

export const matchJoinAttempt: nkruntime.MatchJoinAttemptFunction = function(
    ctx, logger, nk, dispatcher, tick, state, presence, metadata
){
    const match = TicTacToeMatch.fromState(state);
    const accept = match.canJoin(presence.userId);
    if(accept){
        logger.info(`Accepting join for user: ${presence.userId}`);
    }
    else{
        logger.info(`Rejecting join for user: ${presence.userId}`);
    }
    
    return {state: match, accept};
};

export const matchJoin: nkruntime.MatchJoinFunction = function(
    ctx, logger, nk, dispatcher, tick, state, presences
){
    const match = TicTacToeMatch.fromState(state);
    
    for(const presence of presences){
        if(match.players.indexOf(presence.userId) === -1){
            match.addPlayer(presence.userId);
            logger.info('New player joined ' + presence.userId);
        }
        else{
            logger.info("Player reconnected: " + presence.userId);
            delete match.disconnectionTicks[presence.userId];
        }
    }
    if(match.isReady() && !match.gameOver){
        dispatcher.broadcastMessage(1, JSON.stringify({
            type: "game_start",
            state: match.toSerializable()
        }), null, null)
    }
    return {state: match};
};

export const matchLeave: nkruntime.MatchLeaveFunction = function(
    ctx, logger, nk, dispatcher, tick, state, presences
){
    const match = TicTacToeMatch.fromState(state);
    for(const presence of presences){
        if(match.players.indexOf(presence.userId) !== -1  && !match.gameOver){
            logger.info(`Player disconnected (attempting to reconnect...): ${presence.userId}`);
            match.disconnectionTicks[presence.userId] = tick;
        }
    }
    if(!match.gameOver){
        dispatcher.broadcastMessage(1, JSON.stringify({
            type: "player_disconnected",
            state: match.toSerializable()
        }), null, null);
    }
    return {state: match};
}

export const matchLoop: nkruntime.MatchLoopFunction = function(
    ctx, logger, nk, dispatcher, tick, state, messages
){
    const match = TicTacToeMatch.fromState(state);
    if(!match.gameOver && match.players.length === 2){
        for(const userId of match.players){
            const dropTick = match.disconnectionTicks[userId];
            if(dropTick !== undefined){
                if(tick - dropTick > match.gracePeriod){
                    logger.info(`Unable to reconnect to player ${userId}. Forfeiting match...`);
                    match.winner = match.players.find(p => p !== userId)!;
                    match.gameOver = true;
                    nk.leaderboardRecordWrite("tictactoe_wins", match.winner, undefined, 1, 0);
                    nk.leaderboardRecordWrite("tictactoe_wins", userId, undefined, 0, 1);
                    dispatcher.broadcastMessage(1, JSON.stringify({
                        type: 'game_update',
                        state: match.toSerializable()
                    }), null, null)
                }
            }
        }
    }
    
    for(const msg of messages){
        const data = JSON.parse(nk.binaryToString(msg.data));
        if(data.type !== "move") continue;

        const moved = match.applyMove(msg.sender.userId, data.position);
        if(moved){
            dispatcher.broadcastMessage(1, JSON.stringify({
                type: "game_update",
                state: match.toSerializable(),
            }), null, null);
            if(match.gameOver && match.players.length === 2){
                const [p1, p2] = match.players;
                if(match.winner){
                    const loser = match.players.find(p => p !== match.winner)!;
                    nk.leaderboardRecordWrite("tictactoe_wins", match.winner, undefined, 1, 0);
                    nk.leaderboardRecordWrite("tictactoe_wins", loser,undefined, 0, 1);                    
                }
                else{
                    nk.leaderboardRecordWrite("tictactoe_wins", p1, undefined, 0, 0);
                    nk.leaderboardRecordWrite("tictactoe_wins", p2, undefined, 0, 0);
                }
            }
        }
    }
    return {state: match};
}

export const matchTerminate: nkruntime.MatchTerminateFunction = function(
    ctx, logger, nk, dispatcher, tick, state, graceSeconds
){
    return {state};
};

export const matchSignal: nkruntime.MatchSignalFunction = function(
    ctx, logger, nk, dispatcher, tick, state
){
    return {state};
}