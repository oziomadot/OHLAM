import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import Protected from "components/Protected";


// Pool of quiz questions (bigger pool, randomized 10 per play)
const questionPool = [
  { question: "What is the capital of Nigeria?", options: ["Lagos", "Abuja", "Kano", "Ibadan"], answer: "Abuja" },
  { question: "What are the colors of the Nigerian flag?", options: ["Green & White", "Red & Blue", "Black & Yellow", "Green & Red"], answer: "Green & White" },
  { question: "Which river is the longest in Nigeria?", options: ["River Benue", "River Kaduna", "River Niger", "River Osun"], answer: "River Niger" },
  { question: "Nigeria became independent in what year?", options: ["1960", "1970", "1950", "1980"], answer: "1960" },
  { question: "Who was the first president of Nigeria?", options: ["Olusegun Obasanjo", "Goodluck Jonathan", "Nnamdi Azikiwe", "Muhammadu Buhari"], answer: "Nnamdi Azikiwe" },
  { question: "Which is the most populated city in Nigeria?", options: ["Kano", "Abuja", "Lagos", "Port Harcourt"], answer: "Lagos" },
  { question: "What is Nigeria’s official language?", options: ["Yoruba", "Igbo", "Hausa", "English"], answer: "English" },
  { question: "Which Nigerian musician is known as the King of Afrobeat?", options: ["Davido", "Fela Kuti", "Burna Boy", "Wizkid"], answer: "Fela Kuti" },
  { question: "Nigeria is located in which part of Africa?", options: ["East", "West", "South", "North"], answer: "West" },
  { question: "Which Nigerian state is nicknamed 'Coal City'?", options: ["Enugu", "Kaduna", "Benue", "Rivers"], answer: "Enugu" },
  { question: "Which sport is the most popular in Nigeria?", options: ["Basketball", "Cricket", "Football", "Athletics"], answer: "Football" },
  { question: "Which Nigerian author wrote 'Things Fall Apart'?", options: ["Wole Soyinka", "Chimamanda Adichie", "Chinua Achebe", "Ben Okri"], answer: "Chinua Achebe" },
  { question: "Nigeria has how many states?", options: ["30", "36", "40", "32"], answer: "36" },
  { question: "Which is the highest mountain in Nigeria?", options: ["Obudu Plateau", "Adamawa Hills", "Chappal Waddi", "Jos Plateau"], answer: "Chappal Waddi" },
];

const COINS_KEY = "@oramex_quiz_coins";

export default function NigeriaQuiz() {
  const [coins, setCoins] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completed, setCompleted] = useState(false);

  const router = useRouter();

  // Load coins from storage
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(COINS_KEY);
      if (saved) setCoins(parseInt(saved, 10));
    })();
  }, []);

  // Save coins
  useEffect(() => {
    AsyncStorage.setItem(COINS_KEY, coins.toString());
  }, [coins]);

  // Generate random 10 questions
  const generateQuestions = () => {
    const shuffled = [...questionPool].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, 10));
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setCompleted(false);
  };

  useEffect(() => {
    generateQuestions();
  }, []);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (option: string) => {
    setSelectedOption(option);
    setShowAnswer(true);
    if (option === currentQuestion.answer) {
      setCoins((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setShowAnswer(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  return (
    <Protected>
    <View style={styles.container}>
      {/* Menu */}
      <View style={styles.menu}>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Text style={styles.menuItem}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(tabs)/games")}>
          <Text style={styles.menuItem}>Games</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/about")}>
          <Text style={styles.menuItem}>About</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/contact")}>
          <Text style={styles.menuItem}>Contact</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>🇳🇬 Test Your Knowledge About Nigeria</Text>
      <Text style={styles.coinText}>💰 Coins: {coins}</Text>

      {!completed && currentQuestion && (
        <>
          {/* Question */}
          <Text style={styles.question}>
            {currentQuestionIndex + 1}. {currentQuestion.question}
          </Text>

          {/* Options */}
          <FlatList
            data={currentQuestion.options}
            keyExtractor={(item, idx) => idx.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedOption === item && item === currentQuestion.answer && styles.correctOption,
                  selectedOption === item && item !== currentQuestion.answer && styles.wrongOption,
                ]}
                disabled={showAnswer}
                onPress={() => handleAnswer(item)}
              >
                <Text style={styles.optionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />

          {/* Next Button */}
          {showAnswer && (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Play Again */}
      {completed && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>🎉 You’ve completed 10 questions!</Text>
          <TouchableOpacity style={styles.playAgainButton} onPress={generateQuestions}>
            <Text style={styles.playAgainText}>🔄 Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
    </Protected>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9f9f9" },
  menu: { flexDirection: "row", justifyContent: "space-around", marginBottom: 15 },
  menuItem: { fontSize: 16, color: "#0077cc", fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 15, textAlign: "center", color: "#222" },
  coinText: { fontSize: 18, fontWeight: "bold", marginBottom: 20, color: "#444", textAlign: "center" },
  question: { fontSize: 18, fontWeight: "600", marginBottom: 15, color: "#333" },
  optionButton: { padding: 15, marginVertical: 6, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#ccc" },
  optionText: { fontSize: 16, color: "#333" },
  correctOption: { backgroundColor: "#4CAF50" },
  wrongOption: { backgroundColor: "#E53935" },
  nextButton: { marginTop: 20, backgroundColor: "#2196F3", padding: 15, borderRadius: 10, alignItems: "center" },
  nextButtonText: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  resultBox: { marginTop: 40, alignItems: "center" },
  resultText: { fontSize: 20, fontWeight: "700", marginBottom: 20, color: "#2c3e50" },
  playAgainButton: { backgroundColor: "#28a745", padding: 15, borderRadius: 10 },
  playAgainText: { fontSize: 18, color: "#fff", fontWeight: "bold" },
});
