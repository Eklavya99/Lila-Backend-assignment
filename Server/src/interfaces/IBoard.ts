export interface IBoard {
    cells: string[];
    isValidMove(position: number): boolean;
    applyMove(position: number, mark: string): void;
    getWinnersMark(): string | null;
    isMatchDraw(): boolean;
}