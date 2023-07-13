export interface DbObject {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}