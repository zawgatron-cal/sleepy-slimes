/** Contextual onboarding — one step at a time, no tutorial walls. */

import type { KateExpression } from '@/src/constants/kateAssets';

export const TUTORIAL_STEPS = [
  'welcome',
  'zone_select',
  'start_sleep',
  'collection_rarity',
  'buddy_guide',
  'fuse_unlock',
  'fusion_guide',
  'onboarding_finale',
  'slimepedia_guide',
  'zone_unlock_guide',
] as const;

export type TutorialStepId = (typeof TUTORIAL_STEPS)[number];

export const TUTORIAL_NPC_NAME = 'Kate';

export type TutorialDialoguePage = {
  text: string;
  expression?: KateExpression;
};

/** One page or multiple — tap → to advance, last page dismisses. */
export type TutorialDialogueCopy = string | TutorialDialoguePage | readonly (string | TutorialDialoguePage)[];

export const TUTORIAL_COPY = {
  welcome: [
    {
      text: "Hiii! My name's Kate. I'm a scientist studying slimes here in Buttercup Meadows. Nice to meet you!",
      expression: 'happy',
    },
    {
      text: 'A cool fact about slimes is that they sleep together! Another cool fact is that slimes have thousands of holes in their skin. Oops, sorry, didn\'t mean to freak you out...',
      expression: 'embarassed',
    },
    {
      text: 'Anyways, sleep to collect slimes. The longer you sleep and the more consistent your sleep is, the more slimes will come.',
      expression: 'neutral',
    },
    {
      text: 'When you\'re ready to go to sleep, first select your sleep zone (you only have Buttercup Meadows unlocked), and then press the sleep button.',
      expression: 'neutral',
    },
  ],
  collectionRarity: [
    {
      text: 'Each slime has a rarity, or tier — common slimes are easy to find, rare ones are harder.',
      expression: 'neutral',
    },
    {
      text: 'Check the label under their name to see their tier! You can also press on each slime to see more information about them.',
      expression: 'neutral',
    },
  ],
  buddyGuide: [
    {
      text: 'Equip a slime as your buddy and they\'ll sleep alongside you — their bonus applies every night.',
      expression: 'neutral',
    },
    {
      text: 'Each slime has their own level. Sleep with the slime equipped as your buddy to gain night experience, and after hitting the required number you can level it up with candies for better bonuses.',
      expression: 'neutral',
    },
    {
      text: 'Tap equip if you want this fella here as your buddy. You can always change it later!',
      expression: 'happy',
    },
  ],
  fuseUnlock: [
    {
      text: 'Nice! You\'re getting the hang of this.',
      expression: 'happy',
    },
    {
      text: 'I just unlocked the Fuse tab for you, just tap it when you\'re ready to make some new slimes!',
      expression: 'happy',
    },
  ],
  fusionIntro: [
    {
      text: 'Candies are earned from sleep. Spend them here to fuse two slimes into a new one.',
      expression: 'neutral',
    },
    {
      text: 'Oh! It looks like the two slimes you just found can fuse into something new.',
      expression: 'shocked',
    },
    {
      text: 'Pick any pair you like and tap Fuse whenever you\'re ready — no rush. Happy fusing!',
      expression: 'happy',
    },
  ],
  onboardingFinale: [
    {
      text: 'You fused your first new slime. Nice work!',
      expression: 'happy',
    },
    {
      text: 'You\'ve got the basics now. Keep sleeping, collecting, and fusing. I\'ll let you explore on your own now!',
      expression: 'happy',
    },
  ],
  slimepediaGuide: [
    {
      text: 'Wowww!!! You discovered an Ultra Rare slime! That means you can start unlocking new sleep zones to spawn different slimes!',
      expression: 'elated',
    },
    {
      text: 'The Slimepedia lists every slime you\'ve discovered and all the fusion recipes you\'ve found. Here, let me show you where it is!',
      expression: 'happy',
    },
  ],
  zoneUnlockModal: [
    {
      text: 'Each zone costs candies to unlock, and you\'ll need more Ultra Rare discoveries to unlock all of the zones!',
      expression: 'neutral',
    },
    {
      text: 'Keep on sleeping and collecting those slimes, and when you\'re ready, come back and tap Unlock!',
      expression: 'happy',
    },
  ],
} as const satisfies Record<string, readonly TutorialDialoguePage[]>;

export const TUTORIAL_TAP = {
  zone: 'Tap to pick a zone',
  sleep: 'Tap to sleep',
  grassSlime: 'Tap your Grass Slime',
  equipBuddy: 'Tap Equip',
  fuseTab: 'Tap Fuse',
  fuse: 'Tap Fuse',
  moreMenu: 'Tap More',
  slimepedia: 'Open Slimepedia',
  slimepediaBack: 'Tap Back',
  zoneSwipeArrow: 'Swipe for more zones',
  lockedZone: 'Tap to see how to unlock',
} as const;

/** Guaranteed first valid sleep — grass + nimbus fuse into wind. */
export const TUTORIAL_FIRST_NIGHT_SPECIES_IDS = ['grass_slime', 'nimbus_slime'] as const;

/** Buddy tutorial targets the grass slime from the first sleep. */
export const TUTORIAL_BUDDY_SPECIES_ID = TUTORIAL_FIRST_NIGHT_SPECIES_IDS[0];
