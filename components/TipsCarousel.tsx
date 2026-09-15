import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PORTION_TIPS } from '@/data/tips';
import { colors } from '@/styles/commonStyles';

export default function TipsCarousel() {
  const { i18n } = useTranslation();
  const [index, setIndex] = useState(0);
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en';
  const tip = PORTION_TIPS[index];

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % PORTION_TIPS.length);
    }, 5500);
    return () => clearInterval(id);
  }, [index]);

  const goTo = (next: number) => {
    const total = PORTION_TIPS.length;
    setIndex(((next % total) + total) % total);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => goTo(index - 1)}
          style={styles.arrow}
          accessibilityLabel={lang === 'es' ? 'Consejo anterior' : 'Previous tip'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>🍃</Text>
          </View>
          <View style={styles.copy}>
            <Text style={styles.kicker}>{tip.title[lang]}</Text>
            <Text style={styles.body}>{tip.body[lang]}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => goTo(index + 1)}
          style={styles.arrow}
          accessibilityLabel={lang === 'es' ? 'Siguiente consejo' : 'Next tip'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dots}>
        {PORTION_TIPS.map((item, i) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => setIndex(i)}
            accessibilityLabel={`${lang === 'es' ? 'Mostrar consejo' : 'Show tip'} ${i + 1}`}
            accessibilityState={{ selected: i === index }}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    shadowColor: '#1A2E28',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 28,
    lineHeight: 30,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.primary,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.primary,
  },
});
