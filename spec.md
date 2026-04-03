# ChatWave

## Current State
- Chats tab has a "+" button that opens a dialog requiring the user to enter a full Principal ID to start a new chat
- The Contacts tab lists all registered users but the "Chat" button shows a toast saying to go to the Chats tab and enter their Principal ID -- it does not actually open a conversation
- Conversations in ChatsScreen are derived from call history, not from a dedicated contacts/connections list
- Internet Identity handles session persistence already (remembers login across browser sessions)

## Requested Changes (Diff)

### Add
- Username/display name search in the "New Chat" dialog (instead of only accepting a raw Principal ID)
- When user types in the New Chat dialog, search all registered profiles by display name and show a dropdown of matches
- Allow user to select a contact from search results to start a chat immediately

### Modify
- ContactsScreen: "Chat" button for each contact should directly call `onOpenConversation` with that contact's profile/principal, instead of showing a toast
- ChatsScreen conversations list: after user connects with someone via the contacts tab, that conversation should appear in the chats list
- ChatsScreen conversations: also pull from messages history (not just call history) so any chat started via contacts or new chat shows up

### Remove
- The toast in ContactsScreen that says "To chat, enter their Principal ID in Chats > New Chat" -- replace with direct chat opening

## Implementation Plan
1. Fix ContactsScreen: pass `onOpenConversation` properly (it's already in props but the Chat button isn't using it) and wire the Chat button to call it directly with the contact's principal and profile
2. Fix ChatsScreen: the `getUserProfile` call uses the principal from call history, but contacts discovered via ContactsScreen don't have principals stored. Need to also fetch from messages to discover chat partners.
3. Update New Chat dialog in ChatsScreen to support display name search: call `actor.getAllProfiles()` to get all profiles, then filter by display name as user types, show selectable list below the input, and when selected, open the conversation
4. Keep Principal ID entry as a fallback in the New Chat dialog for power users
