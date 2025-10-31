import { useRouter } from "expo-router";
import React from "react";
import { 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Navbar from "components/Navbar"; 

type Game = {
  id: string;
  title: string;
  route: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
};

const { width } = Dimensions.get("window");

const games: Game[] = [
  { 
    id: "1", 
    title: "Word Puzzle", 
    route: "/(tabs)/games/word-puzzle", // must include (tabs)
    icon: "spellcheck",
    color: "#4CAF50"
  },
  { 
    id: "2", 
    title: "Nigeria Quiz", 
    route: "/(tabs)/games/nigeria-quiz", 
    icon: "help-outline",
    color: "#2196F3"
  },

   { 
    id: "", 
    title: "Spin to win", 
    route: "/(tabs)/games/spin", 
    icon: "help-outline",
    color: "#2196F3"
  },
];

export default function GameHub() {
  const router = useRouter();
  const isWeb = Platform.OS === "web";

  const renderGameCard = ({ item }: { item: Game }) => (
    <TouchableOpacity
      style={[styles.gameCard, { backgroundColor: item.color }]}
      onPress={() => router.push(item.route as any)}
      activeOpacity={0.8}
    >
      <View style={styles.gameIcon}>
        <MaterialIcons name={item.icon} size={40} color="#fff" />
      </View>
      <Text style={styles.gameTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.container}
                      >
                          <ScrollView contentContainerStyle={styles.scrollContainer}>
                              <Navbar/>
                      <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
                      <View style={{ width: isWeb ? "30%" : "100%" }}>
      <Text style={styles.title}>Oramex Games</Text>
      <Text style={styles.subtitle}>Select a game to start playing</Text>

      <FlatList
        data={games}
        renderItem={renderGameCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      </View>
      </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, padding: 16 },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 8,
    fontFamily: 'Poppins_400Regular, Arial, sans-serif',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center', 
  },
  subtitle: { 
    fontSize: 16, 
    marginBottom: 16, 
    color: "#555",
    fontFamily: 'Poppins_400Regular, Arial, sans-serif',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
   },
  listContainer: { paddingBottom: 20 },
  gameCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  gameIcon: { marginRight: 12 },
  gameTitle: { fontSize: 18, color: "#fff", fontWeight: "bold" },
  container:{
    flex: 1,
    backgroundColor: '#fff', 
},
scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
});
