import { IMatch } from "../interfaces/IMatch";
import { Board } from "../models/Board";

export class TicTacToeMatch implements IMatch {
    board: Board;
    players: string[];
    marks: Record<string, string>;
    currentTurn: string;
    winner: string | null;
    gameOver: boolean;
    disconnectionTicks: Record<string, number>;
    gracePeriod: number = 15;

    constructor() {
        this.board = new Board();
        this.players = [];
        this.marks = {};
        this.currentTurn = "";
        this.winner = null;
        this.gameOver = false;
        this.disconnectionTicks = {};
    }

    static fromState(state: any): TicTacToeMatch {
        const match = new TicTacToeMatch();
        match.players = state.players;
        match.marks = state.marks;
        match.currentTurn = state.currentTurn;
        match.winner = state.winner;
        match.gameOver = state.gameOver;
        match.disconnectionTicks = state.disconnectionTicks || {};
        match.gracePeriod = state.gracePeriod || 15;
        match.board = Board.fromState(state.board?.cells || ["", "", "", "", "", "", "", "", ""]);
        return match;
    }

    canJoin(userId?: string): boolean {
        if(userId && this.players.indexOf(userId) !== -1){
            return true;
        }
        return this.players.length < 2;
    }

    addPlayer(userId: string): void {
        this.marks[userId] = this.players.length === 0 ? "X" : "O";
        this.players.push(userId);
        if(this.players.length == 2){
            this.currentTurn = this.players[0];        
        }
    }

    isReady(): boolean {
        return this.players.length === 2;
    }

    applyMove(userId: string, position: number): boolean {
        if(this.gameOver) return false;
        if(userId !== this.currentTurn) return false;
        if(!this.board.isValidMove(position)) return false;

        this.board.applyMove(position, this.marks[userId]);

        const winnersMark = this.board.getWinnersMark();
        if(winnersMark){
            this.winner = userId;
            this.gameOver = true;
        }
        else if(this.board.isMatchDraw()){
            this.gameOver = true;
        }
        else{
            this.currentTurn = this.players.find(p => p !== userId)!;
        }
        return true
    }

    toSerializable(): object {
        return {
            board: this.board.cells,
            players: this.players,
            marks: this.marks,
            currentTurn: this.currentTurn,
            winner: this.winner,
            gameOver: this.gameOver,
            disconnectionTicks: this.disconnectionTicks
        };
    }
}