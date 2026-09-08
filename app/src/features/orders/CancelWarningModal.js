import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

export const CancelWarningModal = ({ visible, onClose, onConfirm, orderId }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center p-5">
        <View className="bg-white p-5 rounded-2xl w-full border border-[#F5A8C0]">
          <Text className="text-base font-bold text-[#C2477A] mb-2">⚠️ Frequent Cancellation Notice</Text>
          <Text className="text-xs text-[#8C7078] leading-5 mb-4">
            You are attempting to cancel order <Text className="font-bold text-[#C2477A]">{orderId}</Text>. You have cancelled 3 or more consecutive orders. Excessive cancellations may affect your account status.
          </Text>
          <View className="flex-row gap-2.5">
            <TouchableOpacity
              className="flex-1 py-2.5 rounded-xl border border-[#FCE4EC] items-center"
              onPress={onClose}
            >
              <Text className="text-xs font-bold text-[#8C7078]">Keep Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-[#C2477A] py-2.5 rounded-xl items-center"
              onPress={onConfirm}
            >
              <Text className="text-xs font-bold text-white">Confirm Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
