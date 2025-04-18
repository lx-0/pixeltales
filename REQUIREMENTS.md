# Requirements

Name des Projekts: Pixeltales

## Idea

```text
**Infinite Conversation**
* Infinite gpt talk. Two defined characters talk to each other in an endless conversation. The model is randomly selected. The history can be seen. View is rpg npc like. Text to speech. 2 sec pause between messages (after speech end).  Inspired by: https://youtu.be/g39AagVW0s0?t=261
```

## Design

Two (or more) characters, each with a name and a role description (system prompt).

**Example Characters:**

```text
Character 1:
Name: John
Visual: A man in his 30s with a beard and glasses.
Role: You are a man who is romantically interested in the woman you are talking to.

Character 2:
Name: Jane
Visual: A woman in her 20s with long hair and blue eyes.
Role: You are a woman who is not interested in love.
```

## Features

- Characters are represented as Agents
- Conversation is read via text to speech (needs library where an event is thrown when the speech finishes)
- Conversation is real-time and public (same for all visitors)
    - Conversation only continues, if a visitor is online
    - 5 sec pause between agent message responses (after speech finishes)
    - Conversation is orchestrated, controlled and triggered by the backend, so that the visitors are technically only observing the conversation
- The model of each character is defined when the conversation starts
- The history of each conversation can be seen (incl which models were used)
    - Conversation History Display:
        - The visitor should have two view modes: live and history. during live mode, the conversation is showing the latest state and is updated via socket messages. in history mode, the visitor can navigate through the conversation history (back and forth). The metadata (date time, model used) of the individual message displayed is also shown in history mode. during history navigation, the state changes are animated. the visitor can toggle between the two view modes via an in-game (phaser) toggle button (pause and play icons). @Phaser_Docs
- View is pixel art rpg npc scene like
    - e.g. two characters in a room, the conversation is displayed as speech bubbles above their heads
- At certain occasions the conversation is ended, the old conversation is archived and a new conversation starts
    - Occasions: all characters agree to end the conversation, or all characters end up in a farewell loop
    - when a conversation is ended, the characters are replaced with new ones
    - verified visitors can vote for scene proposals
        - Scene proposal:
            - Suggest role, scene, name, visual, model
        - NSFW filter / censurer on scene proposal
- Tools the Agents can use:
    - Set/read memory (key/value store)
    - Read current datetime (maybe not required, if datetime can be updated in system prompt)
    - Request end conversation (valid for 3min until the other agents agree)
    - Optional: Read current weather (fantasy location) *nice to have*
    - Optional: Check latest news (standard news api) *nice to have*
    - Optional: Walk to (x,y) (inside the scene) *nice to have*
- Context the Agents have:
    - The current conversation history (incl system prompt)
        - Core System Prompt
        - Character Role System Prompt
        - Metadata about the conversation (as system prompt messages, updated each request)
            - Current datetime
            - Conversation duration
        - Conversation history (as user/assistant messages, updated each request)
    - The current scene context derived from scene state (accessible map, character states, object states, visibility, communicatability etc.)
    - The list of available tools
- Future: connect own agent
    - MCP or Agent2Agent
        - <https://modelcontextprotocol.io/introduction>
        - <https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/>
- Future: llm character arena
- Metadata:
    - Conversation
        - Scenario
            - Scene
                - id
                - map
                    - Walkable
                - state?
                - image base64
                - Object List
                    - id
                    - state
                    - image base64
                - Suggested by
                - Created at
            - Character List
                - Model used
                - Role
                - Visual
                    - Description
                    - Base64
        - Total tokens grouped by model
    - Conversation message:
        - Tokens used

### Notes

IMPORTANT: The visitor at frontend is just an OBSERVER of the current scene. there is only ONE ACTIVE PUBLIC scene in the backend for all visitors. therefore make sure the frontend does not make game altering commands. all game altering commands are triggered from backend. the frontend just gets informed about the scene status and informs the backend, that there is a visitor.

### Technical Requirements

- model agnostic framework
- library for text to speech
- library for graphics

### MVP

- 2 defined characters
- 2 sec +x (determined via response length) pause between messages
- No text to speech
- Pixel art scene: room with two characters with speech bubbles above their heads
- No voting for prompt proposals
- No optional tools
- Conversation history is visible
- Model agnostic framework, llm requests routed through backend
- Strong typing
- sqlite local db

## Tech Stack

[**Tailwind CSS**](https://tailwindcss.com) wird für das Styling der Anwendung verwendet.

[**shadcn/ui**](https://ui.shadcn.com) stellt die Basis-UI-Komponenten bereit (basierend auf Radix UI und Tailwind CSS).

URL der Anwendung: <https://pixeltales.yesterday-ai.de>
