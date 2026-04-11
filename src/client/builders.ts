import type { EmittedChatMessage, EmittedChatNotification, EmittedChatShared } from "../types/emittedMessages.js";
import { fixColor } from "./color.js";
import { globalData } from "./script.js";
import { container, incrementTotalMessages, getTotalMessages } from "./dom.js";
import { TwitchChannelWatchStreakNotice } from "../types/twitch/UserNotice.js";

const buildUserBox = async (data: EmittedChatMessage['data']): Promise<string> => {
  const { badges, user, redemption, sharedChat } = data;
  let badge = '';

  if (sharedChat) {
    badge += `<img alt="" src="${sharedChat.fromChannelProfileImageUrl}" class="badge shared-chat-source" title="${sharedChat.fromChannelDisplayName}">`;
  }
  if (user.pronouns) {
    badge += `<span class="pronoun">${user.pronouns}</span>`;
  }
  if (badges && badges.length > 0) {
    badge += '<span class="badges">';
    badges.forEach(b => {
      badge += `<img alt="" src="${b.url}" class="badge ${b.title}"> `;
    });
    badge += '</span>';
  }
  const redemptionHtml = redemption ? `<span class="redemption">Redeemed <span class="title">${redemption.title}</span> <span class="cost">${redemption.cost}</span></span>` : '';

  return `<span class="user-box">${badge} <span style="color: ${fixColor(user.color)}">${user.displayName}</span>${redemptionHtml}</span>`;
};

export const buildNewMessage = async (data: EmittedChatMessage['data']): Promise<HTMLElement | undefined> => {
  if (data.message.startsWith("!") && globalData.hideCommands) return;
  if (globalData.ignoredUsers.includes(data.user.displayName)) return;
  if (container.querySelector(`[data-msgId="${data.id}"]`)) return;

  incrementTotalMessages();

  const highlight = data.isHighlight ? 'highlight' : '';
  const message = `<span class="user-message ${highlight}">${data.message}</span>`;
  const user = await buildUserBox(data);

  const html = document.createElement('div');
  html.setAttribute('data-userId', data.user.id);
  html.setAttribute('data-msgId', data.id);
  html.setAttribute('id', `msg-${getTotalMessages()}`);
  html.classList.add('message-row');
  html.innerHTML = user + message;

  return html;
};

export const buildSharedChat = async (data: EmittedChatShared['data']): Promise<HTMLElement | undefined> => {
  const elements: string[] = [];
  incrementTotalMessages();

  data.participants.forEach((participant) => {
    const img = `<img alt="" src="${participant.profileImageUrl}" class="profile" title="${participant.displayName}"> `;
    elements.push(img);
  });

  const innerHtml = `<div class="profile-group">${elements.join('')}</div><span>Shared Chat started!</span>`;

  const html = document.createElement('div');
  html.classList.add('message-row');
  html.classList.add('shared-chat-message');
  html.setAttribute('id', `msg-${getTotalMessages()}`);
  html.innerHTML = innerHtml;

  return html;
};

export const buildWatchStreak = async (data: EmittedChatNotification['data']): Promise<HTMLElement | undefined> => {
  incrementTotalMessages();

  const innerHtml = `<div class="watch-streak-message"><svg width="24" height="24" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M5.295 8.05 10 2l3 4 2-3 3.8 5.067a11 11 0 0 1 2.2 6.6A7.333 7.333 0 0 1 13.667 22h-3.405A7.262 7.262 0 0 1 3 14.738c0-2.423.807-4.776 2.295-6.688Zm7.801 1.411 2-3L17.2 9.267a9 9 0 0 1 1.8 5.4 5.334 5.334 0 0 1-4.826 5.31 3 3 0 0 0 .174-3.748L12 13l-2.348 3.229a3 3 0 0 0 .18 3.754A5.263 5.263 0 0 1 5 14.738c0-1.978.66-3.9 1.873-5.46l3.098-3.983 3.125 4.166Z" clip-rule="evenodd"></path></svg><span class="notice-user" style="color: ${fixColor(data.user.color)}">${data.user.displayName}</span> hit a <span class="streak-count" data-streak="${data.streak}">${data.streak} stream</span> Watch Streak!</div>`;

  const html = document.createElement('div');
  html.classList.add('message-row');
  html.classList.add('notice-message');
  html.setAttribute('data-userId', data.user.id);
  html.setAttribute('data-msgId', data.id);
  html.setAttribute('id', `msg-${getTotalMessages()}`);
  html.innerHTML = innerHtml;

  return html;
};