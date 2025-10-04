import { AdMobBanner } from 'expo-ads-admob';
import { getBannerAdUnitId } from '@/utils/admob';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Button, StyleSheet, Text, View, Alert, TouchableOpacity, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import useCoinSystem from '@/src/hooks/useCoinSystem';

const NigeriaQuiz = () => {
  const [questions, setQuestions] = useState<Array<{q: string, a: string, options: string[]}>>([
    {
      q: "What is the capital of Nigeria?",
      a: "Abuja",
      options: ["Lagos", "Abuja", "Kano", "Ibadan"]
    },
    {
      q: "Which river runs through Nigeria?",
      a: "Niger",
      options: ["Nile", "Congo", "Niger", "Benue"]
    },
    // Add more questions here
  ]);
  
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({ correct: false, message: '' });
  
  const {
    coins,
    formatCoins,
    addCoins,
    deductCoins,
    startTimer,
    stopTimer,
    timeLeft,
    isTimerRunning
  } = useCoinSystem();

  useEffect(() => {
    // Start with 3 questions
    startTimer(180); // 3 minutes timer
  }, []);

  const handleAnswer = async (answer: string) => {
    setSelectedAnswer(answer);
    const isCorrect = answer === questions[index].a;
    const coinsEarned = stopTimer(isCorrect);
    
    setFeedback({
      correct: isCorrect,
      message: isCorrect ? 'Correct! +' + coinsEarned + ' coins' : 'Incorrect!'
    });
    setShowFeedback(true);
    
    if (isCorrect) {
      setScore(score + 1);
      addCoins(coinsEarned);
    }
    
    // Move to next question or end game
    setTimeout(() => {
      setShowFeedback(false);
      if (index < questions.length - 1) {
        setIndex(index + 1);
        setSelectedAnswer(null);
        startTimer(180); // Reset timer for next question
      } else {
        setGameOver(true);
      }
    }, 1500);
  };

  const restartGame = () => {
    setIndex(0);
    setScore(0);
    setGameOver(false);
    setSelectedAnswer(null);
    setShowFeedback(false);
    startTimer(180);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (gameOver) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Game Over!</Text>
        <Text style={styles.score}>Your score: {score} / {questions.length}</Text>
        <Text style={styles.coins}>Total coins: {formatCoins(coins)}</Text>
        <TouchableOpacity style={styles.button} onPress={restartGame}>
          <Text style={styles.buttonText}>Play Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[index];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.scoreText}>Score: {score}</Text>
        <Text style={styles.timerText}>Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</Text>
        <Text style={styles.coinsText}>{formatCoins(coins)}</Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.q}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.optionButton,
              selectedAnswer === option && styles.selectedOption,
              showFeedback && option === currentQuestion.a && styles.correctOption,
              showFeedback && selectedAnswer === option && option !== currentQuestion.a && styles.wrongOption
            ]}
            onPress={() => !selectedAnswer && handleAnswer(option)}
            disabled={!!selectedAnswer}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {showFeedback && (
        <View style={[
          styles.feedbackContainer,
          { backgroundColor: feedback.correct ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)' }
        ]}>
          <Text style={styles.feedbackText}>{feedback.message}</Text>
        </View>
      )}

      <View style={styles.adContainer}>
        <AdMobBanner
          bannerSize="smartBannerPortrait"
          adUnitID={getBannerAdUnitId()}
          servePersonalizedAds={true}
          onDidFailToReceiveAdWithError={(error) => console.log(error)}
        />
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  coinsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  questionContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
  },
  questionText: {
    fontSize: 20,
    textAlign: 'center',
  },
  optionsContainer: {
    marginTop: 10,
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
    elevation: 2,
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
  },
  correctOption: {
    backgroundColor: '#c8e6c9',
  },
  wrongOption: {
    backgroundColor: '#ffcdd2',
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  feedbackContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  score: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  coins: {
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 20,
    textAlign: 'center',
  },
  adContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
  },
});

export default NigeriaQuiz;
