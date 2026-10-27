// Identidade visual OMAVEST — mesma do site (verde escuro + amarelo, títulos em Playfair, texto em Source Serif)
export const C = {
  primary:   '#275E4C',
  primaryDk: '#0F1B17',
  primaryLt: '#3F8D70',
  mint:      '#75C5A4',
  accent:    '#F7BD16',
  accentDk:  '#DCA60A',
  accentLt:  '#FFD557',
  accentMut: '#FFF3CC',
  cream:     '#F5F7F4',
  dark:      '#0B1210',
  darkMid:   '#14241E',
  body:      '#26332E',
  muted:     '#596660',
  success:   '#2E9E6B',
  danger:    '#D64545',
  warning:   '#DCA60A',
  white:     '#FFFFFF',
  bg:        '#F5F7F4',
  border:    '#DDE5E0',
  soft:      '#EEF3F0',
  glass:     'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(247,189,22,0.20)',
};

// Famílias de fonte (carregadas em App.js)
export const F = {
  h:   'PlayfairDisplay_700Bold',
  hX:  'PlayfairDisplay_800ExtraBold',
  hI:  'PlayfairDisplay_700Bold_Italic',
  b:   'SourceSerif4_400Regular',
  bM:  'SourceSerif4_500Medium',
  bS:  'SourceSerif4_600SemiBold',
  bB:  'SourceSerif4_700Bold',
  bI:  'SourceSerif4_400Regular_Italic',
};

export const S = {
  shadowSm: {
    shadowColor: '#0F1B17',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  shadowMd: {
    shadowColor: '#0F1B17',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 7,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 18,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
};
