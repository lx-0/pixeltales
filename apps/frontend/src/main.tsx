import { Logger } from '@yesterday-ai/logger-frontend';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './globals.css';
import {
  DEBUG,
  DEBUG_APP,
  DEBUG_API,
  DEBUG_AUTH,
  DEBUG_WEBSOCKET,
  DEBUG_SCENE,
  DEBUG_SCENE_STATE,
  DEBUG_UI_CONTROLS,
  DEBUG_SPEECH_BUBBLES,
  DEBUG_CHARACTER_MANAGER,
  DEBUG_CHAT_MESSAGES_UI,
} from './config';

/** Contexts that should be excluded from debug logging */
export const DEBUG_BLACKLIST: Set<string> = new Set([
  ...(DEBUG && DEBUG_APP ? [] : ['App']),
  ...(DEBUG && DEBUG_API ? [] : ['AuthApi', 'UserApi', 'ScenesApi', 'ConfigApi', 'SpritesheetApi']),
  ...(DEBUG && DEBUG_AUTH ? [] : ['useAuth', 'AuthService', 'AuthApi']),
  ...(DEBUG && DEBUG_WEBSOCKET ? [] : ['EventManager', '📡']),
  ...(DEBUG && DEBUG_SCENE ? [] : ['MainScene']),
  ...(DEBUG && DEBUG_SCENE_STATE ? [] : ['SceneManager', 'StateManager']),
  ...(DEBUG && DEBUG_UI_CONTROLS ? [] : ['UIControlsManager', 'UIScene']),
  ...(DEBUG && DEBUG_SPEECH_BUBBLES ? [] : ['SpeechBubbleManager']),
  ...(DEBUG && DEBUG_CHARACTER_MANAGER ? [] : ['CharacterManager']),
  ...(DEBUG && DEBUG_CHAT_MESSAGES_UI ? [] : ['ChatMessages:ui']),
]);

/** Contexts that should be excluded from info logging */
export const INFO_BLACKLIST: Set<string> = new Set([
  ...(DEBUG && DEBUG_APP ? [] : ['App']),
  ...(DEBUG && DEBUG_API ? [] : ['AuthApi', 'UserApi', 'ScenesApi', 'ConfigApi', 'SpritesheetApi']),
  ...(DEBUG && DEBUG_AUTH ? [] : ['useAuth', 'AuthService', 'AuthApi']),
  ...(DEBUG && DEBUG_WEBSOCKET ? [] : ['EventManager', '📡']),
  ...(DEBUG && DEBUG_SCENE ? [] : ['MainScene']),
  ...(DEBUG && DEBUG_SCENE_STATE ? [] : ['SceneManager', 'StateManager']),
  ...(DEBUG && DEBUG_UI_CONTROLS ? [] : ['UIControlsManager', 'UIScene']),
  ...(DEBUG && DEBUG_SPEECH_BUBBLES ? [] : ['SpeechBubbleManager']),
  ...(DEBUG && DEBUG_CHARACTER_MANAGER ? [] : ['CharacterManager']),
  ...(DEBUG && DEBUG_CHAT_MESSAGES_UI ? [] : ['ChatMessages:ui']),
]);

Logger.setDebugBlacklist(DEBUG_BLACKLIST);
Logger.setInfoBlacklist(INFO_BLACKLIST);

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
