import { onMessageEvent, onNotificationEvent, onRemoveUserMsg, onRemoveSingleMsg, onRemoveAllMsg, onSharedChatMsg } from "../client/dom.js";

declare global {
  export interface Window {
    onMessageEvent: typeof onMessageEvent;
    onNotificationEvent: typeof onNotificationEvent;
    onRemoveUserMsg: typeof onRemoveUserMsg;
    onRemoveSingleMsg: typeof onRemoveSingleMsg;
    onRemoveAllMsg: typeof onRemoveAllMsg;
    onSharedChatMsg: typeof onSharedChatMsg;
    IS_PRODUCTION: boolean;
  }
}