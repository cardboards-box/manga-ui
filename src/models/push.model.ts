import type { DbObject } from "./db-object.model";

export enum DeviceType {
    Unknown = 0,
    Android = 1,
    iOS = 2,
    Web = 3,
}

export interface Push extends DbObject {
    deviceName: string;
    deviceId: string;
    deviceType: DeviceType;
    profileId: number;
}
