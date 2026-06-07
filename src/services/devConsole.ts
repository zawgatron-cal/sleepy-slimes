/**
 * Dev-only command parser and executors for spawning slimes and tweaking save data.
 */

import {
  MIN_SLIME_LEVEL,
  SLIME_VARIANT_LABELS,
  SlimeVariant,
  TIER_LABELS,
} from '@/src/constants/game';
import { SPECIES } from '@/src/data';
import { deleteSlime, insertSlime } from '@/src/db';
import type { Slime, Species } from '@/src/types';
import { useCandiesStore, useCollectionStore, useEquippedSlimeStore } from '@/src/stores';
import { parseSlimeLevel, isSlimeLevel } from '@/src/utils/slimeLevel';
import { parseEquippedNights } from '@/src/utils/slimeLevelUp';
import { generateSlimeSeed, randomShortId } from '@/src/utils/util';

export type DevConsoleLine = {
  text: string;
  tone?: 'info' | 'ok' | 'error';
};

export type DevConsoleResult = {
  ok: boolean;
  lines: DevConsoleLine[];
};

const ALL_SPECIES = Object.values(SPECIES);

const VARIANT_ALIASES: Record<string, SlimeVariant> = {
  standard: SlimeVariant.STANDARD,
  std: SlimeVariant.STANDARD,
  s: SlimeVariant.STANDARD,
  prismatic: SlimeVariant.PRISMATIC,
  prism: SlimeVariant.PRISMATIC,
  p: SlimeVariant.PRISMATIC,
  exotic: SlimeVariant.EXOTIC,
  e: SlimeVariant.EXOTIC,
  gold: SlimeVariant.GOLD,
  g: SlimeVariant.GOLD,
};

const HELP_LINES = [
  'grant <species> [variant] [level] [flags]',
  '  flags: --nights N --nick "name" --fav --equip --source sleep|fusion',
  '  variants: standard | prismatic | exotic | gold',
  'candy <amount>              set candy balance',
  'candy +<amount>             add candies',
  'equip <slime_id>            equip slime for sleep',
  'unequip                     clear equipped slime',
  'delete <slime_id>           remove slime from collection',
  'species [filter]            list species ids',
  'help                        show this message',
];

function line(text: string, tone: DevConsoleLine['tone'] = 'info'): DevConsoleLine {
  return { text, tone };
}

function resolveSpecies(token: string): Species | null {
  const q = token.trim().toLowerCase();
  if (!q) return null;

  const exact = ALL_SPECIES.find((s) => s.id === q);
  if (exact) return exact;

  const idPartial = ALL_SPECIES.filter((s) => s.id.includes(q));
  if (idPartial.length === 1) return idPartial[0]!;

  const nameMatches = ALL_SPECIES.filter((s) => s.name.toLowerCase().includes(q));
  if (nameMatches.length === 1) return nameMatches[0]!;

  return null;
}

function parseVariantToken(token: string): SlimeVariant | null {
  return VARIANT_ALIASES[token.toLowerCase()] ?? null;
}

type GrantOptions = {
  speciesId: string;
  variant: SlimeVariant;
  level: Slime['level'];
  equippedNights: number;
  nickname?: string;
  favorited: boolean;
  equip: boolean;
  source?: Slime['source'];
};

function parseGrantArgs(tokens: string[]): { options?: GrantOptions; error?: string } {
  if (tokens.length === 0) {
    return { error: 'Usage: grant <species> [variant] [level] [--nights N] [--nick name] [--fav] [--equip]' };
  }

  const species = resolveSpecies(tokens[0]!);
  if (!species) {
    return { error: `Unknown species "${tokens[0]}". Try "species" to list ids.` };
  }

  let variant = SlimeVariant.STANDARD;
  let level: Slime['level'] = MIN_SLIME_LEVEL;
  let equippedNights = 0;
  let nickname: string | undefined;
  let favorited = false;
  let equip = false;
  let source: Slime['source'] | undefined;

  let i = 1;
  while (i < tokens.length && !tokens[i]!.startsWith('--')) {
    const token = tokens[i]!;
    const asVariant = parseVariantToken(token);
    if (asVariant) {
      variant = asVariant;
      i += 1;
      continue;
    }
    const asLevel = parseInt(token, 10);
    if (isSlimeLevel(asLevel)) {
      level = asLevel;
      i += 1;
      continue;
    }
    return { error: `Unexpected token "${token}". Expected variant, level 1–5, or flag.` };
  }

  while (i < tokens.length) {
    const flag = tokens[i]!;
    if (flag === '--fav' || flag === '--favorite') {
      favorited = true;
      i += 1;
      continue;
    }
    if (flag === '--equip') {
      equip = true;
      i += 1;
      continue;
    }
    if (flag === '--nights') {
      const n = parseInt(tokens[i + 1] ?? '', 10);
      if (!Number.isFinite(n) || n < 0) {
        return { error: '--nights requires a non-negative number' };
      }
      equippedNights = parseEquippedNights(n);
      i += 2;
      continue;
    }
    if (flag === '--nick' || flag === '--nickname') {
      const name = tokens[i + 1];
      if (!name) return { error: '--nick requires a value' };
      nickname = name;
      i += 2;
      continue;
    }
    if (flag === '--source') {
      const src = tokens[i + 1];
      if (src !== 'sleep' && src !== 'fusion') {
        return { error: '--source must be sleep or fusion' };
      }
      source = src;
      i += 2;
      continue;
    }
    return { error: `Unknown flag "${flag}"` };
  }

  return {
    options: {
      speciesId: species.id,
      variant,
      level,
      equippedNights,
      nickname,
      favorited,
      equip,
      source,
    },
  };
}

function createDevSlime(options: GrantOptions): Slime {
  const now = Date.now();
  return {
    id: `dev_${now}_${randomShortId()}`,
    speciesId: options.speciesId,
    variant: options.variant,
    level: parseSlimeLevel(options.level),
    equippedNights: options.equippedNights,
    nickname: options.nickname,
    favorited: options.favorited,
    seed: generateSlimeSeed(),
    acquiredAt: now,
    source: options.source,
  };
}

async function cmdGrant(tokens: string[]): Promise<DevConsoleResult> {
  const parsed = parseGrantArgs(tokens);
  if (parsed.error) {
    return { ok: false, lines: [line(parsed.error, 'error')] };
  }

  const species = ALL_SPECIES.find((s) => s.id === parsed.options!.speciesId)!;
  const slime = createDevSlime(parsed.options!);

  await insertSlime(slime);
  useCollectionStore.getState().addSlime(slime);
  if (parsed.options!.equip) {
    useEquippedSlimeStore.getState().setEquippedSlimeId(slime.id);
  }

  return {
    ok: true,
    lines: [
      line(`Granted ${species.name} (${species.id})`, 'ok'),
      line(
        `  id: ${slime.id} | ${SLIME_VARIANT_LABELS[slime.variant]} | L${slime.level} | nights ${slime.equippedNights}${
          slime.nickname ? ` | nick "${slime.nickname}"` : ''
        }${slime.favorited ? ' | ★' : ''}${parsed.options!.equip ? ' | equipped' : ''}`
      ),
    ],
  };
}

async function cmdCandy(tokens: string[]): Promise<DevConsoleResult> {
  if (tokens.length === 0) {
    return { ok: false, lines: [line('Usage: candy <amount> or candy +<amount>', 'error')] };
  }

  const raw = tokens[0]!;
  if (raw.startsWith('+')) {
    const add = parseInt(raw.slice(1), 10);
    if (!Number.isFinite(add)) {
      return { ok: false, lines: [line('Invalid candy amount', 'error')] };
    }
    useCandiesStore.getState().add(add);
    return {
      ok: true,
      lines: [line(`Added ${add} candies → ${useCandiesStore.getState().total}`, 'ok')],
    };
  }

  const total = parseInt(raw, 10);
  if (!Number.isFinite(total) || total < 0) {
    return { ok: false, lines: [line('Candy amount must be a non-negative integer', 'error')] };
  }
  useCandiesStore.getState().setTotal(total);
  return { ok: true, lines: [line(`Candy balance set to ${total}`, 'ok')] };
}

async function cmdEquip(tokens: string[]): Promise<DevConsoleResult> {
  if (tokens.length === 0) {
    return { ok: false, lines: [line('Usage: equip <slime_id>', 'error')] };
  }
  const id = tokens[0]!;
  const slime = useCollectionStore.getState().getSlimeById(id);
  if (!slime) {
    return { ok: false, lines: [line(`No slime with id "${id}"`, 'error')] };
  }
  useEquippedSlimeStore.getState().setEquippedSlimeId(id);
  return { ok: true, lines: [line(`Equipped ${id}`, 'ok')] };
}

async function cmdUnequip(): Promise<DevConsoleResult> {
  useEquippedSlimeStore.getState().setEquippedSlimeId(null);
  return { ok: true, lines: [line('Unequipped slime', 'ok')] };
}

async function cmdDelete(tokens: string[]): Promise<DevConsoleResult> {
  if (tokens.length === 0) {
    return { ok: false, lines: [line('Usage: delete <slime_id>', 'error')] };
  }
  const id = tokens[0]!;
  const slime = useCollectionStore.getState().getSlimeById(id);
  if (!slime) {
    return { ok: false, lines: [line(`No slime with id "${id}"`, 'error')] };
  }

  await deleteSlime(id);
  useCollectionStore.getState().removeSlime(id);
  if (useEquippedSlimeStore.getState().equippedSlimeId === id) {
    useEquippedSlimeStore.getState().setEquippedSlimeId(null);
  }

  return { ok: true, lines: [line(`Deleted ${id}`, 'ok')] };
}

function cmdSpecies(tokens: string[]): DevConsoleResult {
  const filter = tokens[0]?.toLowerCase() ?? '';
  const rows = ALL_SPECIES.filter(
    (s) =>
      !filter ||
      s.id.includes(filter) ||
      s.name.toLowerCase().includes(filter) ||
      TIER_LABELS[s.tier].toLowerCase().includes(filter)
  );

  if (rows.length === 0) {
    return { ok: false, lines: [line(`No species match "${filter}"`, 'error')] };
  }

  return {
    ok: true,
    lines: rows.map((s) =>
      line(`${s.id} — ${s.name} (${TIER_LABELS[s.tier]})${s.fusionOnly ? ' [fusion]' : ''}`)
    ),
  };
}

function cmdHelp(): DevConsoleResult {
  return { ok: true, lines: HELP_LINES.map((text) => line(text)) };
}

/** Parse and run one dev console command. No-op outside __DEV__. */
export async function executeDevConsoleCommand(input: string): Promise<DevConsoleResult> {
  if (!__DEV__) {
    return { ok: false, lines: [line('Dev console is only available in development builds', 'error')] };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, lines: [line('Enter a command. Type "help" for syntax.', 'error')] };
  }

  const tokens = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((t) => t.replace(/^"|"$/g, '')) ?? [];
  const [cmd, ...args] = tokens;

  switch (cmd.toLowerCase()) {
    case 'help':
    case '?':
      return cmdHelp();
    case 'grant':
    case 'g':
    case 'spawn':
      return cmdGrant(args);
    case 'candy':
    case 'candies':
      return cmdCandy(args);
    case 'equip':
      return cmdEquip(args);
    case 'unequip':
      return cmdUnequip();
    case 'delete':
    case 'rm':
      return cmdDelete(args);
    case 'species':
    case 'list':
      return cmdSpecies(args);
    default:
      return { ok: false, lines: [line(`Unknown command "${cmd}". Type "help".`, 'error')] };
  }
}

export const DEV_CONSOLE_WELCOME = 'Sleepy Slimes dev console. Type "help" for commands.';

export const DEV_CONSOLE_EXAMPLES = [
  'grant grass_slime',
  'grant dreamer_slime gold 5 --equip --fav',
  'grant moon prismatic 3 --nights 2 --nick "Luna"',
  'candy 9999',
  'species meadow',
];
