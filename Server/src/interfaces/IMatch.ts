export interface IMatch {
    canJoin(): boolean;
    addPlayer(userId: string): void;
    isReady(): boolean;
    applyMove(userId: string, position: number): boolean;
    toSerializable(): object;
}