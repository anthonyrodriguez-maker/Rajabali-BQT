export const WEEKS = [
  'WE 04/04','WE 04/11','WE 04/18','WE 04/25',
  'WE 05/02','WE 05/09','WE 05/16','WE 05/23',
  'WE 05/30','WE 06/06','WE 06/13','WE 06/20'
];

export const NL_MAP = {
  GRG: 'Sid Patel',
  Omala: 'Patrick Stanfield',
  TRG: 'Lilia Segura',
  VRG: 'Christy Elliott',
};

export const NET_ORDER = ['GRG', 'Omala', 'TRG', 'VRG'];

export const STORES = [
  { store: 'Cedar Hill',     network: 'GRG',   nl: 'Sid Patel',        arl: 'Siddharth Patel',       avgScore: 2.82, networkRank: 1, networkTotal: 9,  weeklyScores: [3.2,2.8,1.8,3.33,2.07,1.87,1.6,3.07,3.33,3.14,3.86,3.73] },
  { store: 'Duncanville',    network: 'GRG',   nl: 'Sid Patel',        arl: 'Siddharth Patel',       avgScore: 2.91, networkRank: 2, networkTotal: 9,  weeklyScores: [4.36,3.86,2.33,2.87,1.73,2.67,2.57,2.64,2.33,3.36,3.23,3.0] },
  { store: 'Mansfield',      network: 'GRG',   nl: 'Sid Patel',        arl: 'Siddharth Patel',       avgScore: 3.21, networkRank: 3, networkTotal: 9,  weeklyScores: [3.71,2.21,3.2,3.47,2.93,3.0,3.07,3.64,2.87,3.14,3.21,4.0] },
  { store: 'Kerrville',      network: 'Omala', nl: 'Patrick Stanfield', arl: 'Bryce Cedio-Vierling',  avgScore: 2.33, networkRank: 1, networkTotal: 17, weeklyScores: [2.86,1.46,2.6,1.83,2.55,1.93,2.77,2.0,2.77,1.64,2.5,3.07] },
  { store: 'Potranco',       network: 'Omala', nl: 'Patrick Stanfield', arl: 'Christopher Pena',      avgScore: 2.44, networkRank: 2, networkTotal: 17, weeklyScores: [2.0,2.0,3.4,2.27,2.13,3.5,2.14,3.46,1.6,2.27,1.62,2.93] },
  { store: 'Shaenfield',     network: 'Omala', nl: 'Patrick Stanfield', arl: 'Tiffany Thompson',      avgScore: 2.45, networkRank: 3, networkTotal: 17, weeklyScores: [2.0,3.2,2.5,3.92,2.21,2.57,3.14,2.31,2.21,1.73,1.14,2.4] },
  { store: 'Huebner',        network: 'Omala', nl: 'Patrick Stanfield', arl: 'Bryce Cedio-Vierling',  avgScore: 2.47, networkRank: 4, networkTotal: 17, weeklyScores: [2.47,3.29,2.93,2.4,2.71,2.0,2.6,1.87,2.67,2.07,2.64,2.0] },
  { store: 'Dominion',       network: 'Omala', nl: 'Patrick Stanfield', arl: 'Christopher Pena',      avgScore: 2.73, networkRank: 5, networkTotal: 17, weeklyScores: [3.36,3.64,2.2,2.2,1.47,2.57,2.36,2.93,3.07,3.5,2.0,3.43] },
  { store: 'Barrington',     network: 'TRG',   nl: 'Lilia Segura',      arl: 'Katherine Cruz',        avgScore: 2.10, networkRank: 1, networkTotal: 11, weeklyScores: [1.33,2.15,2.07,1.6,1.2,0.85,2.57,3.14,2.87,2.73,1.79,2.87] },
  { store: 'Streamwood',     network: 'TRG',   nl: 'Lilia Segura',      arl: 'Lilia Segura',          avgScore: 3.11, networkRank: 2, networkTotal: 11, weeklyScores: [2.93,3.5,2.87,2.64,3.85,1.29,2.57,2.43,4.27,3.07,4.4,3.57] },
  { store: 'Glen Ellyn',     network: 'TRG',   nl: 'Lilia Segura',      arl: 'Katherine Cruz',        avgScore: 3.51, networkRank: 3, networkTotal: 11, weeklyScores: [2.86,3.53,2.4,3.53,3.07,3.73,3.2,4.71,4.0,4.07,2.87,4.2] },
  { store: 'Harker Heights', network: 'VRG',   nl: 'Christy Elliott',   arl: 'Christy Elliott',       avgScore: 2.34, networkRank: 1, networkTotal: 8,  weeklyScores: [1.57,1.27,1.5,1.53,2.55,2.77,1.93,2.71,2.27,2.27,3.85,3.87] },
  { store: 'Clear Creek',    network: 'VRG',   nl: 'Christy Elliott',   arl: 'Christy Elliott',       avgScore: 2.48, networkRank: 2, networkTotal: 8,  weeklyScores: [2.71,2.57,3.2,2.67,2.5,3.6,1.07,2.07,2.33,2.13,1.67,3.29] },
];

// Role definitions
export const ROLES = {
  VP: {
    label: 'VP of Operations',
    name: 'Anthony Rodriguez',
    canEdit: true,
    networks: ['GRG', 'Omala', 'TRG', 'VRG'],
  },
  NL_GRG: {
    label: 'Network Leader — GRG',
    name: 'Sid Patel',
    canEdit: false,
    networks: ['GRG'],
  },
  NL_OMALA: {
    label: 'Network Leader — Omala',
    name: 'Patrick Stanfield',
    canEdit: false,
    networks: ['Omala'],
  },
  NL_TRG: {
    label: 'Network Leader — TRG',
    name: 'Lilia Segura',
    canEdit: false,
    networks: ['TRG'],
  },
  NL_VRG: {
    label: 'Network Leader — VRG',
    name: 'Christy Elliott',
    canEdit: false,
    networks: ['VRG'],
  },
  ARL_SIDD: {
    label: 'ARL — GRG',
    name: 'Siddharth Patel',
    canEdit: true,
    networks: ['GRG'],
    arlName: 'Siddharth Patel',
  },
  ARL_BRYCE: {
    label: 'ARL — Omala',
    name: 'Bryce Cedio-Vierling',
    canEdit: true,
    networks: ['Omala'],
    arlName: 'Bryce Cedio-Vierling',
  },
  ARL_CHRIS: {
    label: 'ARL — Omala',
    name: 'Christopher Pena',
    canEdit: true,
    networks: ['Omala'],
    arlName: 'Christopher Pena',
  },
  ARL_TIFFANY: {
    label: 'ARL — Omala',
    name: 'Tiffany Thompson',
    canEdit: true,
    networks: ['Omala'],
    arlName: 'Tiffany Thompson',
  },
  ARL_KAT: {
    label: 'ARL — TRG',
    name: 'Katherine Cruz',
    canEdit: true,
    networks: ['TRG'],
    arlName: 'Katherine Cruz',
  },
  ARL_CHRISTY: {
    label: 'ARL/NL — VRG',
    name: 'Christy Elliott',
    canEdit: true,
    networks: ['VRG'],
    arlName: 'Christy Elliott',
  },
};
