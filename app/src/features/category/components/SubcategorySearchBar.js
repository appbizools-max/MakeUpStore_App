import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * SubcategorySearchBar
 * Dynamic Text & Voice Search for subcategories.
 * Supports partial matching, case-insensitive search, and SpeechRecognition.
 */
export const SubcategorySearchBar = ({
  value = '',
  onChangeText,
  onClear,
  placeholder = 'Search Subcategories [Enter name or use microphone]',
  currentCategoryName = 'Category',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState(null);
  const recognitionRef = useRef(null);

  // Pulse animation for listening state
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animLoop = null;
    if (isListening) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true })
        ])
      );
      animLoop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isListening, pulseAnim]);

  // Voice Recognition Handler
  const handleToggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort?.();
        } catch (e) {}
      }
      setIsListening(false);
      setVoiceNotice(null);
      return;
    }

    // Check Web Speech API availability
    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
      : null;

    if (!SpeechRecognition) {
      setVoiceNotice('Voice search is active in Chrome/Safari/Edge browsers. Type subcategory below.');
      setTimeout(() => setVoiceNotice(null), 3500);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-IN'; // Indian English pronunciation standard

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceNotice('🎙️ Listening... Speak subcategory name now');
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript.trim()) {
          onChangeText(transcript.trim());
          setVoiceNotice(`Matched: "${transcript.trim()}"`);
          setTimeout(() => setVoiceNotice(null), 2500);
        }
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceNotice('Microphone access denied. Please enable microphone permission.');
        } else {
          setVoiceNotice('Could not recognize voice. Please type or tap mic again.');
        }
        setTimeout(() => setVoiceNotice(null), 3500);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Voice recognition error:', err);
      setIsListening(false);
      setVoiceNotice('Voice recognition unavailable. Please type your search.');
      setTimeout(() => setVoiceNotice(null), 3000);
    }
  };

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 10 }}>
      <View
        style={{
          height: 44,
          backgroundColor: '#FFFFFF',
          borderColor: isListening ? '#C2477A' : '#F0E3EA',
          borderWidth: isListening ? 1.5 : 1,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          shadowColor: '#C2477A',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 3,
          elevation: 1,
        }}
      >
        <Ionicons name="search" size={16} color="#C2477A" style={{ marginRight: 8 }} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A8929E"
          style={{
            flex: 1,
            color: '#1F2937',
            fontSize: 12,
            fontWeight: '600',
            paddingVertical: 0,
          }}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        {value.length > 0 && (
          <TouchableOpacity
            onPress={onClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ padding: 4, marginRight: 4 }}
          >
            <Ionicons name="close-circle" size={16} color="#A8929E" />
          </TouchableOpacity>
        )}

        {/* Voice Search Button */}
        <TouchableOpacity
          onPress={handleToggleVoice}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: isListening ? '#C2477A' : '#FFF0F5',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={isListening ? 'Stop Voice Recognition' : 'Start Voice Search'}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons
              name={isListening ? 'mic' : 'mic-outline'}
              size={15}
              color={isListening ? '#FFFFFF' : '#C2477A'}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Voice Status / Feedback Notice */}
      {voiceNotice ? (
        <View
          style={{
            marginTop: 4,
            paddingHorizontal: 10,
            paddingVertical: 3.5,
            backgroundColor: isListening ? '#FFF0F5' : '#F9FAFB',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isListening ? '#F8B4D9' : '#E5E7EB',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Ionicons
            name={isListening ? 'radio' : 'information-circle'}
            size={12}
            color={isListening ? '#C2477A' : '#6B7280'}
          />
          <Text
            style={{
              color: isListening ? '#C2477A' : '#4B5563',
              fontSize: 10.5,
              fontWeight: '700',
            }}
          >
            {voiceNotice}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export default SubcategorySearchBar;

