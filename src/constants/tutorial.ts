/** Contextual onboarding — one step at a time, no tutorial walls. */

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

/** One string or multiple pages — tap → to advance, last page dismisses. */
export type TutorialDialogueCopy = string | readonly string[];

export const TUTORIAL_COPY = {
  welcome: [
    "Hiii! My name's Kate. I'm a scientist studying slimes here in Buttercup Meadows. Nice to meet you!",
    'A cool fact about slimes is that they sleep together! Another cool fact is that slimes have thousands of holes in their skin. Oops, sorry, didn\'t mean to freak you out...',
    'Anyways, sleep to collect slimes. The longer you sleep and the more consistent your sleep is, the more slimes will come.',
    'When you\'re ready to go to sleep, first select your sleep zone, and then press the sleep button.'
  ],
  collectionRarity: [
    'Each slime has a rarity, or tier — common slimes are easy to find, rare ones are harder.',
    'Check the label under their name to see their tier! You can also press on each slime to see more information about them.',
  ],
  buddyGuide: [
    'Equip a slime as your buddy and they\'ll sleep alongside you — their bonus applies every night.',
    'Each slime has their own level. Sleep with the slime equipped as your buddy to gain night experience, and after hitting the required number you can level it up with candies for better bonuses.',
    'Tap equip if you want this fella here as your buddy. You can always change it later!'
  ],
  fuseUnlock: [
    'Nice! You\'re getting the hang of this.',
    'I just unlocked the Fuse tab for you, just tap it when you\'re ready to make some new slimes!',
  ],
  fusionIntro: [
    'Candies are earned from sleep. Spend them here to fuse two slimes into a new one.',
    'Oh! It looks like the two slimes you just found can fuse into something new.',
    'Pick any pair you like and tap Fuse whenever you\'re ready — no rush. Happy fusing!',
  ],
  onboardingFinale: [
    'You fused your first new slime. Nice work!',
    'You\'ve got the basics now. Keep sleeping, collecting, and fusing. I\'ll let you explore on your own now!',
  ],
  slimepediaGuide: [
    'Wowww!!! You discovered an Ultra Rare slime! That means you can start unlocking new sleep zones to spawn different slimes!',
    'The Slimepedia lists every slime you\'ve discovered and all the fusion recipes you\'ve found. Here, let me show you where it is!',
  ],
  zoneUnlockModal: [
    'Each zone costs candies to unlock, and you\'ll need more Ultra Rare discoveries to unlock all of the zones!',
    'Keep on sleeping and collecting those slimes, and when you\'re ready, come back and tap Unlock!',
  ],
} as const;

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
