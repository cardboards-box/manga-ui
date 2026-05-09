import type { EnumDescription } from '../api/composites';

export enum FcmError {
    InvalidTopic = 0,
    UnhandledException = 1,
    FCM_ApnsAuthError = 2,
    FCM_InvalidArgument = 3,
    FCM_QuotaExceeded = 4,
    FCM_SenderIdMismatch = 5,
    FCM_Unregistered = 6,
    FCM_TooManyTopics = 7,
}

export const FCM_ERROR_DESCRIPTIONS: EnumDescription<FcmError>[] = [
    {
        value: FcmError.InvalidTopic,
        name: 'Invalid Topic',
        description: 'The topic specified was invalid. Corrective action: Remove topic'
    }, {
        value: FcmError.UnhandledException,
        name: 'Unhandled Exception',
        description: 'Indicates that an unhandled exception has occurred. Corrective action: Figure out what the exception means... duh?'
    }, {
        value: FcmError.FCM_ApnsAuthError,
        name: 'APNs Authentication Error',
        description: 'Apple Push Notification Service authentication error. Corrective action: Remove registration token'
    }, {
        value: FcmError.FCM_InvalidArgument,
        name: 'Invalid Argument',
        description: 'Indicates that an operation failed due to an invalid argument being provided. Corrective action: Fix notification being sent'
    }, {
        value: FcmError.FCM_QuotaExceeded,
        name: 'Quota Exceeded',
        description: 'Quota for sending messages has been exceeded. Corrective action: Resend request later'
    }, {
        value: FcmError.FCM_SenderIdMismatch,
        name: 'Sender ID Mismatch',
        description: "The sender app doesn't own the registration token. Corrective action: Remove registration token"
    }, {
        value: FcmError.FCM_Unregistered,
        name: 'Unregistered',
        description: 'Registration token was unregistered. Corrective action: Remove registration token'
    }, {
        value: FcmError.FCM_TooManyTopics,
        name: 'Too Many Topics',
        description: 'Registration token is subscribed to too many topics. Corrective action: Remove unused tokens'
    }
]
