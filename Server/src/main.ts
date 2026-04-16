/// <reference types="nakama-runtime" />
import {
  matchInit,
  matchJoinAttempt,
  matchJoin,
  matchLeave,
  matchLoop,
  matchTerminate,
  matchSignal
} from "./handler/matchHandler";

import {
  matchMakerMatched,
  createMatch,
  getLeaderBoard
} from "./rpc/rpcHandler";

// 1. We use 'let' instead of 'export function'
// 2. We explicitly type the arguments using 'nkruntime'
let InitModule: nkruntime.InitModule = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
) {
  nk.leaderboardCreate("tictactoe_wins", false, nkruntime.SortOrder.DESCENDING, nkruntime.Operator.INCREMENTAL);
  // Register Tic-Tac-Toe match handlers
  initializer.registerMatch("tic-tac-toe", {
    matchInit,
    matchJoinAttempt,
    matchJoin,
    matchLeave,
    matchLoop,
    matchTerminate,
    matchSignal
  });

  // Register your matchmaker and RPCs
  initializer.registerMatchmakerMatched(matchMakerMatched);
  initializer.registerRpc("create_match", createMatch);
  initializer.registerRpc("get_leaderboard", getLeaderBoard);

  logger.info("Tic-tac-toe module loaded successfully!");
};

// Bypasses TS strict checks for the Goja global binding hack
!(InitModule as any) && (InitModule as any).bind(null);