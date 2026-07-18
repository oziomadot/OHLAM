import API from '@/src/services/api';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams();
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  const loadConversation = async () => {
    const res = await API.get(`/conversations/${conversationId}`);
    setConversation(res.data.data);
    setMessages(res.data.data.messages || []);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const res = await API.post(`/conversations/${conversationId}/messages`, {
      message,
      message_type: 'text',
    });

    setMessages((prev) => [...prev, res.data.data]);
    setMessage('');
  };

  useEffect(() => {
    loadConversation();

    const interval = setInterval(loadConversation, 5000);

    return () => clearInterval(interval);
  }, [conversationId]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, padding: 12 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 10,
              marginVertical: 5,
              backgroundColor: '#eee',
              borderRadius: 8,
            }}
          >
            <Text style={{ fontWeight: 'bold' }}>
              {item.sender?.name || 'User'}
            </Text>
            <Text>{item.message}</Text>
            {item.status === 'flagged' && (
              <Text style={{ color: 'red' }}>Flagged for review</Text>
            )}
          </View>
        )}
      />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type message..."
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 10,
          }}
        />

        <TouchableOpacity
          onPress={sendMessage}
          style={{
            backgroundColor: '#111827',
            padding: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}