import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import useCoinSystem from "@/hooks/useCoinSystem";
import AdBanner from "@/src/components/AdBanner";
import Protected from "../../../../components/Protected";

// Ads handled by shared AdBanner component (native only)

// =====================
// Word Puzzle Component
// =====================
const words = [
  { word: "lagos", difficulty: "easy" },
  { word: "abuja", difficulty: "easy" },
  { word: "enugu", difficulty: "medium" },
  { word: "kaduna", difficulty: "medium" },
  { word: "yoruba", difficulty: "hard" },
  { word: "igbo", difficulty: "easy" },
  { word: "hausa", difficulty: "easy" },
  { word: "benin", difficulty: "medium" },
  { word: "calabar", difficulty: "hard" },
  { word: "kano", difficulty: "easy" },
];

const shuffleWord = (word: string) =>
  word
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

const WordPuzzle = () => {
  const [currentWord, setCurrentWord] = useState("");
  const [shuffled, setShuffled] = useState("");
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(true);
  const [hintUsed, setHintUsed] = useState(false);
  const [hint, setHint] = useState("");
  const [score, setScore] = useState(0);

  const { coins, formatCoins, startTimer, stopTimer, resetCoins, currentTimeSpent } =
    useCoinSystem();

  const getNewWord = () => {
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
  };

  const fetchWord = () => {
    setLoading(true);
    const { word } = getNewWord();
    setCurrentWord(word.toLowerCase());
    setShuffled(shuffleWord(word));
    setHint(word[0] + "_".repeat(word.length - 1));
    setMessage({ text: "", type: "" });
    setGuess("");
    setHintUsed(false);
    setLoading(false);
    startTimer();
  };

  useEffect(() => {
    resetCoins();
    fetchWord();
  }, []);

  const getTimeBonus = (timeSpent: number) => {
    const baseTime = 30; // seconds
    const maxBonus = 20;
    return Math.max(1, Math.floor(maxBonus * (1 - timeSpent / baseTime)));
  };

  const checkAnswer = () => {
    if (!guess.trim()) return;

    const isCorrect = guess.toLowerCase() === currentWord;
    const timeBonus = getTimeBonus(currentTimeSpent());
    const baseReward = 10;
    const hintPenalty = hintUsed ? 5 : 0;
    const coinsEarned = isCorrect
      ? Math.max(1, baseReward + timeBonus - hintPenalty)
      : 0;

    if (isCorrect) {
      stopTimer(true);
      setScore((prev) => prev + 1);
      setMessage({
        text: `🎉 Correct! +${coinsEarned} coins`,
        type: "success",
      });

      setTimeout(() => {
        fetchWord();
      }, 1500);
    } else {
      setMessage({
        text: `❌ Try again! (${currentWord.length} letters)`,
        type: "error",
      });
    }
  };

  const handleUseHint = () => {
    if (!hintUsed) {
      setHintUsed(true);
      const newHint =
        currentWord[0] +
        "_".repeat(Math.max(0, currentWord.length - 2)) +
        (currentWord.length > 1 ? currentWord[currentWord.length - 1] : "");
      setHint(newHint);
      setMessage({
        text: `Hint used! -5 coins from next reward`,
        type: "info",
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
      <Protected>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>Score: {score}</Text>
          <Text style={styles.hintText}>{hint}</Text>
        </View>
        <View style={styles.coinContainer}>
          <MaterialIcons name="monetization-on" size={24} color="#FFD700" />
          <Text style={styles.coinText}>{formatCoins(coins)}</Text>
        </View>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        <Text style={styles.title}>Word Scramble</Text>

        <View style={styles.shuffledContainer}>
          <Text style={styles.shuffledWord}>{shuffled.toUpperCase()}</Text>
          <Text style={styles.wordLength}>({currentWord.length} letters)</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your answer..."
            value={guess}
            onChangeText={setGuess}
            onSubmitEditing={checkAnswer}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={checkAnswer}
            disabled={!guess.trim()}
          >
            <Text style={styles.submitButtonText}>✓</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hintContainer}>
          <TouchableOpacity
            style={[styles.hintButton, hintUsed && styles.hintButtonUsed]}
            onPress={handleUseHint}
            disabled={hintUsed}
          >
            <MaterialIcons
              name="lightbulb"
              size={20}
              color={hintUsed ? "#999" : "#f59e0b"}
            />
            <Text
              style={[
                styles.hintButtonText,
                hintUsed && styles.hintButtonTextUsed,
              ]}
            >
              {hintUsed ? "Hint Used" : "Get Hint"}
            </Text>
          </TouchableOpacity>
        </View>

        {message.text ? (
          <View
            style={[
              styles.messageContainer,
              message.type === "success" && styles.messageSuccess,
              message.type === "error" && styles.messageError,
              message.type === "info" && styles.messageInfo,
            ]}
          >
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ) : null}

        <View style={styles.statsContainer}>
          <Text style={styles.timeText}>Time: {currentTimeSpent()}s</Text>
          <Text style={styles.coinsText}>Coins: {formatCoins(coins)}</Text>
        </View>
      </View>

      {/* Footer with Ads (native only) */}
      <View style={styles.footer}>
        <View style={styles.adContainer}>
          <AdBanner />
        </View>
      </View>
    </View>
    </Protected>
  );
  
};

const styles = StyleSheet.create({
  /* keep your styles same as before */
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5eb",
  },
  scoreContainer: { flex: 1 },
  score: { fontSize: 18, fontWeight: "bold", color: "#1a1a1a" },
  hintText: { fontSize: 16, color: "#666", letterSpacing: 2 },
  coinContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff8e1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffe0b2",
  },
  coinText: { marginLeft: 5, fontWeight: "bold", color: "#f9a825" },
  gameArea: { flex: 1, padding: 20, alignItems: "center" },
  title: { fontSize: 28, fontWeight: "bold", color: "#1a1a1a", marginBottom: 30 },
  shuffledContainer: { marginBottom: 30, alignItems: "center" },
  shuffledWord: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#3b82f6",
    letterSpacing: 5,
    textAlign: "center",
    marginBottom: 5,
  },
  wordLength: { fontSize: 16, color: "#666", fontStyle: "italic" },
  inputContainer: { flexDirection: "row", width: "100%", marginBottom: 20 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e1e5eb",
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    marginRight: 10,
  },
  submitButton: {
    width: 60,
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  hintContainer: { marginBottom: 20, width: "100%", alignItems: "center" },
  hintButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbeb",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fef3c7",
  },
  hintButtonUsed: { backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" },
  hintButtonText: { marginLeft: 5, color: "#f59e0b", fontWeight: "600" },
  hintButtonTextUsed: { color: "#9ca3af" },
  messageContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: "100%",
  },
  messageText: { textAlign: "center", fontSize: 16, fontWeight: "500" },
  messageSuccess: {
    backgroundColor: "#d1fae5",
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
  },
  messageError: {
    backgroundColor: "#fee2e2",
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  messageInfo: {
    backgroundColor: "#dbeafe",
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: "auto",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 2,
  },
  timeText: { fontSize: 16, color: "#4b5563", fontWeight: "500" },
  coinsText: { fontSize: 16, color: "#92400e", fontWeight: "600" },
  footer: {
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    alignItems: "center",
  },
  adContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    minHeight: 50,
  },
});

export default WordPuzzle;
