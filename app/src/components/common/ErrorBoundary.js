import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    if (__DEV__) {
      console.error('[SalbeauErrorBoundary] Caught runtime exception:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const fallback = this.props.fallback;
      if (typeof fallback === 'function') {
        return fallback({
          error: this.state.error,
          resetError: this.handleReset
        });
      }

      return (
        <SafeAreaView className="flex-1 bg-white justify-center items-center p-6">
          <View className="w-16 h-16 rounded-full bg-white items-center justify-center mb-4 border border-[#FCE4EC]">
            <Ionicons name="alert-circle-outline" size={36} color="#C2477A" />
          </View>

          <Text className="text-lg font-black text-[#3A2430] text-center mb-2">
            Something unexpected occurred
          </Text>

          <Text className="text-xs text-[#8C7078] text-center leading-relaxed mb-6 px-4">
            We recovered the application safely so your session and cart items remain intact.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={this.handleReset}
            className="w-full max-w-xs bg-[#C2477A] py-3.5 rounded-full items-center shadow-md mb-3"
          >
            <Text className="text-white text-sm font-black uppercase tracking-wider">
              Reload Screen
            </Text>
          </TouchableOpacity>

          {this.props.onGoHome && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                this.props.onGoHome();
              }}
              className="py-2.5 px-4"
            >
              <Text className="text-[#C2477A] text-xs font-bold">
                Return to Storefront Home →
              </Text>
            </TouchableOpacity>
          )}

          {__DEV__ && this.state.error && (
            <ScrollView keyboardShouldPersistTaps="handled" className="w-full max-h-40 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-4">
              <Text className="text-[10px] font-mono text-rose-600">
                {String(this.state.error?.message || this.state.error)}
              </Text>
            </ScrollView>
          )}
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

