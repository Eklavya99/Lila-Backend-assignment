import { IBoard } from "../interfaces/IBoard";

export class Board implements IBoard {
    cells: string[];
    private static possibleWins = [
        [0,1,2], [3,4,5], [6,7,8], [0,3,6],
        [1,4,7], [2,5,8], [0,4,8], [2,4,6]
    ];

    constructor() {
        this.cells = ["", "", "", "", "", "", "", "" , ""];
    }

    static fromState(cells: string[]): Board{
        const board = new Board();
        board.cells = cells;
        return board;
    }

    isValidMove(position: number): boolean {
        return position >= 0 && position <= 8 && this.cells[position] == "";
    }

    applyMove(position: number, mark: string): void {
        this.cells[position] = mark;
    }

    getWinnersMark(): string | null {
        for(const [i, j, k] of Board.possibleWins){
            if(this.cells[i] && this.cells[i] === this.cells[j] && this.cells[i] === this.cells[k]){
                return this.cells[i]
            }
        }
        return null
    }

    isMatchDraw(): boolean {
        return this.cells.every(cell => cell !== "") && this.getWinnersMark() === null; 
    }
}