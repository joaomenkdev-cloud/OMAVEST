// Componentes visuais compartilhados — reproduzem os blocos do site (hero escuro, títulos com ornamento, botões pílula...)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C, F, S } from './theme';

// ── Fundo escuro com brilho (igual ao hero do site) ───────────
export function DarkBg({ children, style }) {
  return (
    <LinearGradient colors={[C.dark, C.primaryDk, '#13241D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      <View pointerEvents="none" style={ui.glowA} />
      <View pointerEvents="none" style={ui.glowB} />
      {children}
    </LinearGradient>
  );
}

// ── Hero das páginas internas (breadcrumb + título + subtítulo) ──
export function PageHero({ crumb, eyebrow, title, subtitle, onHome }) {
  return (
    <DarkBg style={ui.pageHero}>
      <View style={ui.crumbRow}>
        <TouchableOpacity onPress={onHome}><Text style={ui.crumbLink}>Início</Text></TouchableOpacity>
        <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.5)" />
        <Text style={ui.crumbCur}>{crumb}</Text>
      </View>
      {eyebrow ? <Eyebrow text={eyebrow} /> : null}
      <Text style={ui.pageTitle}>{title}</Text>
      {subtitle ? <Text style={ui.pageSub}>{subtitle}</Text> : null}
    </DarkBg>
  );
}

export function Eyebrow({ text, icon = 'sparkles' }) {
  return (
    <View style={ui.eyebrow}>
      {icon ? <Ionicons name={icon} size={12} color={C.accent} /> : null}
      <Text style={ui.eyebrowTxt}>{text}</Text>
    </View>
  );
}

// ── Título de seção com ornamento dourado ──────────────────────
export function SectionTitle({ title, subtitle, light, align = 'center' }) {
  return (
    <View style={{ alignItems: align === 'center' ? 'center' : 'flex-start', marginBottom: 22 }}>
      <Text style={[ui.secTitle, light && { color: C.white }, align !== 'center' && { textAlign: 'left' }]}>{title}</Text>
      {subtitle ? <Text style={[ui.secSub, light && { color: 'rgba(255,255,255,0.65)' }, align !== 'center' && { textAlign: 'left' }]}>{subtitle}</Text> : null}
      <LinearGradient colors={[C.accent, C.accentLt]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={ui.ornament} />
    </View>
  );
}

// ── Botões (pílula) ───────────────────────────────────────────
export function Btn({ title, onPress, variant = 'primary', icon, loading, disabled, style, small, full }) {
  const accent = variant === 'accent';
  const ghost = variant === 'ghost';
  const outline = variant === 'outline';
  const txtColor = accent ? C.primaryDk : ghost ? C.white : outline ? C.primary : C.white;
  const inner = (
    <View style={[ui.btnInner, small && { paddingVertical: 9, paddingHorizontal: 16 }]}>
      {loading ? <ActivityIndicator color={txtColor} size="small" /> : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 14 : 16} color={txtColor} style={{ marginRight: 7 }} /> : null}
          <Text style={[ui.btnTxt, small && { fontSize: 13 }, { color: txtColor }]}>{title}</Text>
        </>
      )}
    </View>
  );
  const wrap = [ui.btn, full && { alignSelf: 'stretch' }, (loading || disabled) && { opacity: 0.6 }, style];
  if (accent) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={loading || disabled} style={[wrap, ui.accentShadow]}>
        <View style={[ui.btnFill, { backgroundColor: C.accent }]}>{inner}</View>
      </TouchableOpacity>
    );
  }
  if (ghost) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={loading || disabled} style={wrap}>
        <View style={[ui.btnFill, { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)' }]}>{inner}</View>
      </TouchableOpacity>
    );
  }
  if (outline) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={loading || disabled} style={wrap}>
        <View style={[ui.btnFill, { borderWidth: 1.5, borderColor: C.primary, backgroundColor: 'transparent' }]}>{inner}</View>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={loading || disabled} style={[wrap, S.shadowSm]}>
      <LinearGradient colors={[C.primary, C.primaryDk]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={ui.btnFill}>{inner}</LinearGradient>
    </TouchableOpacity>
  );
}

// ── Chip de filtro ────────────────────────────────────────────
export function Chip({ label, active, onPress, dark }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={[ui.chip, dark && ui.chipDark, active && (dark ? ui.chipDarkOn : ui.chipOn)]}>
      <Text style={[ui.chipTxt, dark && { color: 'rgba(255,255,255,0.75)' }, active && { color: dark ? C.primaryDk : C.white }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Badge({ text, color = C.primary, bg, style }) {
  return (
    <View style={[ui.badge, { backgroundColor: bg || color + '22' }, style]}>
      <Text style={[ui.badgeTxt, { color }]}>{text}</Text>
    </View>
  );
}

export function Card({ children, style, dark }) {
  return <View style={[ui.card, S.shadowSm, dark && ui.cardDark, style]}>{children}</View>;
}

export function SearchBox({ value, onChangeText, placeholder }) {
  return (
    <View style={ui.search}>
      <Ionicons name="search" size={18} color={C.muted} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.muted} style={ui.searchInput} />
    </View>
  );
}

export function Logo({ height = 34 }) {
  return <Image source={require('../assets/logo-horizontal.png')} style={{ height, width: height * 4.64 }} resizeMode="contain" accessibilityLabel="OMAVEST" />;
}

export function Empty({ icon = 'albums-outline', text }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
      <Ionicons name={icon} size={38} color={C.border} />
      <Text style={{ fontFamily: F.b, color: C.muted, marginTop: 10, fontSize: 15 }}>{text}</Text>
    </View>
  );
}

export const ui = StyleSheet.create({
  glowA: { position: 'absolute', right: -90, top: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(63,141,112,0.18)' },
  glowB: { position: 'absolute', left: -110, bottom: -120, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(247,189,22,0.07)' },

  pageHero: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 30, overflow: 'hidden' },
  crumbRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  crumbLink: { fontFamily: F.b, color: C.accent, fontSize: 13 },
  crumbCur: { fontFamily: F.b, color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  pageTitle: { fontFamily: F.hX, color: C.white, fontSize: 32, lineHeight: 38, marginTop: 4 },
  pageSub: { fontFamily: F.bI, color: 'rgba(255,255,255,0.72)', fontSize: 15, lineHeight: 22, marginTop: 10 },

  eyebrow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: C.glassBorder, backgroundColor: 'rgba(247,189,22,0.08)', marginBottom: 12 },
  eyebrowTxt: { fontFamily: F.bB, color: C.accent, fontSize: 11, letterSpacing: 1.6 },

  secTitle: { fontFamily: F.h, color: C.primaryDk, fontSize: 27, lineHeight: 33, textAlign: 'center' },
  secSub: { fontFamily: F.bI, color: C.muted, fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginTop: 6, maxWidth: 320 },
  ornament: { width: 46, height: 3, borderRadius: 3, marginTop: 14 },

  btn: { alignSelf: 'flex-start', borderRadius: 999 },
  btnFill: { borderRadius: 999 },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, paddingHorizontal: 22, minHeight: 46 },
  btnTxt: { fontFamily: F.bB, fontSize: 15, letterSpacing: 0.2 },
  accentShadow: { shadowColor: C.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6 },

  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white },
  chipOn: { backgroundColor: C.primaryDk, borderColor: C.primaryDk },
  chipDark: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.18)' },
  chipDarkOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipTxt: { fontFamily: F.bS, fontSize: 13.5, color: C.body },

  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTxt: { fontFamily: F.bB, fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase' },

  card: { backgroundColor: C.white, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(15,27,23,0.04)' },
  cardDark: { backgroundColor: C.primaryDk, borderColor: 'rgba(247,189,22,0.2)' },

  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.white, borderRadius: 999, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 16, height: 48 },
  searchInput: { flex: 1, fontFamily: F.b, fontSize: 15, color: C.body, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },
});
