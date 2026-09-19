import type { ChallengeDef } from '../../types';

export const CHALLENGES: ChallengeDef[] = [
  {
    id: 'rope-rush',
    name: 'Rope Rush',
    category: 'FITTER',
    difficulty: 'L1–L5',
    duration: '60s',
    description: 'Complete as many jumps as possible in 60 seconds. Tap the jump button for every jump.',
    unit: 'jumps',
  },
  {
    id: 'reaction-rush',
    name: 'Reaction Rush',
    category: 'FASTER',
    difficulty: 'Adaptive',
    duration: '~45s',
    description: 'Tap the glowing pod as fast as you can. 10 rounds — speed plus accuracy counts.',
    unit: 'sec',
  },
  {
    id: 'agility-command',
    name: 'Agility Command',
    category: 'CHAMPS',
    difficulty: 'Progressive',
    duration: '~60s',
    description: 'Follow the station sequence in order. 3 rounds, sequences get longer.',
    unit: 'sec',
  },
];
