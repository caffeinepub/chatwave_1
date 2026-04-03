# ChatWave — Vibrant UI & Liquid Animations Enhancement

## Current State
- Working mobile-first messaging app (ChatWave) with Internet Identity login
- Dark/light theme support via CSS custom properties
- Flat, minimal green-on-dark color scheme (#25d366 accent, near-black backgrounds)
- ChatsScreen: conversation list, new chat dialog, search
- ContactsScreen: list of all users, invite button
- ConversationScreen: messages with basic motion/react entry animation
- BottomNav: 4 tabs (chats, calls, contacts, profile)
- index.css uses OKLCH tokens for shadcn/ui

## Requested Changes (Diff)

### Add
- Liquid/fluid CSS animations: animated gradient blobs in backgrounds (SVG filter or CSS keyframe morphing shapes), wave-like transitions between screens, ripple on message send
- Rich color palette: vibrant purple-to-cyan gradient accent system, multi-stop gradients for sent bubbles, iridescent/holographic header gradients
- Floating action button with liquid press animation (scale + ripple effect)
- Message bubble entrance with spring physics feel (bounce in from correct side)
- Contacts quick-access inside ChatsScreen header (avatar strip of recent contacts above conversation list)
- Send button with liquid "pulse" animation on active state
- Animated gradient bottom nav bar with active tab liquid indicator
- Animated avatar ring (pulsing gradient halo) on active/online users in contacts list
- Smooth screen-level transitions (fade+slide) using motion/react

### Modify
- index.css: Replace flat green tokens with rich gradient system; add --chat-sent-start/end gradient vars; add liquid animation keyframes (blob morph, ripple, wave); keep OKLCH semantic tokens compatible
- ChatsScreen: Add recent contacts horizontal scroll strip at top; enhance empty state with animated gradient blob; header gradient background
- ContactsScreen: Add animated ring on avatar for online users; Chat button with gradient and hover liquid animation; header with gradient
- ConversationScreen: Sent bubbles use gradient fill; message entry animation with spring bounce; send button with liquid ripple effect; background subtle animated pattern
- BottomNav: Animated liquid active indicator pill; gradient icons for active tab
- App.tsx: Wrap screen transitions in motion/react AnimatePresence with slide+fade

### Remove
- Flat solid color header backgrounds (replace with gradient versions)
- Static green-only accent (replace with gradient accent system)

## Implementation Plan
1. Update `index.css` — add gradient CSS vars, liquid animation keyframes (blob, ripple, wave), animated background pattern utility classes
2. Update `ChatsScreen.tsx` — add contacts horizontal strip (using call history principals), gradient header, animated FAB, enhanced empty state
3. Update `ContactsScreen.tsx` — gradient header, animated avatar rings, gradient chat button with ripple
4. Update `ConversationScreen.tsx` — gradient sent bubbles, spring message animations, liquid send button ripple, subtle animated background
5. Update `BottomNav.tsx` — liquid active indicator, gradient active icons
6. Update `App.tsx` — screen-level AnimatePresence transitions
