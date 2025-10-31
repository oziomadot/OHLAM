import React from "react";
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Image,
  TouchableOpacity,
  Animated,
} from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import * as d3 from "d3-shape";
import { useWheelSpin } from "src/hooks/useWheelSpin"; // adjust path as needed
import { useRouter } from "expo-router";



const { width } = Dimensions.get("window");
const RADIUS = 150;

const defaultSegments = [
  { label: "0", color: "#AA6347" },
  { label: "10", color: "#FF6347" },
  { label: "20", color: "#FFD700" }, 
  { label: "50", color: "#32CD32" },
  { label: "100", color: "#8A2BE2" },
  { label: "200", color: "#FF69B4" },
  { label: "500", color: "#CF6347" },
];

// setTotalCoins((prev) => prev + coins);

const WheelOfFortuneExpo = ({ segments, onSpinComplete = null}) => {
  const currentSegments =
    segments && segments.length > 0 ? segments : defaultSegments;
    const router = useRouter();

  const {
    spin,
    spinInterpolation,
    spinning,
    winner,
    coins,
  } = useWheelSpin(currentSegments, 0); // knobAngle = 315

  const reloadTotalCoins = () =>{
     router.replace("/games/spin");
  }

  const pieData = d3.pie()(currentSegments.map(() => 1));

//   pieData.forEach((slice, index) => {
//   const startAngle = slice.startAngle;
//   const endAngle = slice.endAngle;
//   const angleInRadians = endAngle - startAngle;
//   const angleInDegrees = (angleInRadians * 180) / Math.PI;

//   console.log(`Segment ${index} covers ${angleInDegrees.toFixed(2)}°`);
// });
  const arcGenerator = d3.arc().outerRadius(RADIUS).innerRadius(0);

  return (
    <View style={styles.container}>
      <View style={{ alignContent: "center", justifyContent: "center" }}>
        <Text style={styles.headerText}>
          Click coin to add to your wallet
        </Text>
        <View style={styles.coinCounter}>
          <TouchableOpacity onPress={reloadTotalCoins}>
          <Text style={styles.coinText}>💰 Coins: {coins}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.winnerContainer}>
        {winner && (
          <Text style={styles.winnerText}>
            🎉 You won: {winner} coins! 🎉
          </Text>
        )}
      </View>

      {/* Knob */}
      <Image
        source={require("../assets/knob.png")}
        style={styles.knob}
        resizeMode="contain"
      />

      {/* Wheel */}
      <Animated.View
        style={{
          transform: [{ rotate: spinInterpolation }],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width={RADIUS * 2} height={RADIUS * 2}>
          <G x={RADIUS} y={RADIUS}>
            {pieData.map((slice, i) => {
              const arc = arcGenerator(slice);
              const [textX, textY] = arcGenerator.centroid(slice);
              return (
                <G key={i}>
                  <Path
                    d={arc}
                    fill={currentSegments[i].color}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                  <SvgText
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                  >
                    {currentSegments[i].label}
                  </SvgText>
                </G>
              );
            })}
          </G>
        </Svg>
      </Animated.View>

      {/* Spin Button */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.spinButton, spinning && styles.spinButtonDisabled]}
          onPress={() => spin(onSpinComplete)}
          disabled={spinning}
        >
          <Text style={styles.spinButtonText}>
            {spinning ? "🎡 Spinning..." : "🎯 Spin the Wheel!"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 10,
  },
  coinCounter: {
    marginVertical: 10,
  },
  coinText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    padding: 10,
    backgroundColor: "#219ffc", 
    borderRadius: 6,
    borderWidth: 1,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    
  },
  winnerContainer: {
    marginVertical: 10,
    marginBottom: 40,
  },
  winnerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
    
  },
  knob: {
    position: "absolute",
    top: RADIUS - 30,
    width: 40,
    height: 40,
    zIndex: 10,
  },
  controlsContainer: {
    marginTop: 20,
  },
  spinButton: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
  },
  spinButtonDisabled: {
    opacity: 0.6,
  },
  spinButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default WheelOfFortuneExpo;
