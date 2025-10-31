// hooks/useWheelSpin.js
import { useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import API from "@/config"; // your API wrapper
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "context/AuthContext";

export const useWheelSpin = (segments, knobAngle = 0) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [coins, setCoins] = useState(0);
  const {user} = useAuth();
// const [totalCoins, setTotalCoins] = useState(0);
  const segmentAngle = 360 / segments.length;
  

  const spin = async (onComplete) => {
    if (spinning) return;
    setSpinning(true);
    setWinner(null);

    let finalIndex;

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await API.post("/spin", {}, {
        headers: {Authorization: `Bearer ${token}`,
    Accept: "application/json", },
        
      });

      const { coins_won } = res.data.coins_won;
     

      console.log(coins_won);

      console.log("we have segments : ", segments[2].label);

      finalIndex = segments.findIndex(s => s.label === String(coins_won));
      if (finalIndex === -1) finalIndex = Math.floor(Math.random() * segments.length);

    //   await API.post("/user/coins", { coins: coins_won }, {
    //     headers: { Authorization: `Bearer ${token}` },
    //   });
    } catch (err) {
      console.log("Spin error:", err.message);
      finalIndex = Math.floor(Math.random() * segments.length);
      // Don't update totalCoins in error case for now, let the animation completion handle it
    }

    const segmentCenter = finalIndex * segmentAngle + segmentAngle / 2;
    // const targetAngle = knobAngle - segmentCenter;
     const targetAngle = knobAngle - segmentCenter;
    const randomRotations = 3 + Math.random() * 3;
    const totalRotation = randomRotations * 360 + 90;

    console.log("Final index:", finalIndex);
    console.log("Segment center:", segmentCenter);
    console.log("Target angle:", targetAngle);
    console.log("Random rotations:", randomRotations);
    console.log("Total rotation:", totalRotation);
    console.log("Knob angle: ", knobAngle);

    Animated.timing(spinValue, {
      toValue: totalRotation,
      duration: 4500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      const winnerSegment = segments[finalIndex];
      
      setWinner(winnerSegment.label);
      setCoins(prev => prev + parseInt(winnerSegment.label));
      
      onComplete?.(winnerSegment.label);
      setSpinning(false);
      
      spinValue.setValue(totalRotation % 360);
    });
  };

  const spinInterpolation = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return {
    spin,
    spinInterpolation,
    spinning,
    winner,
    coins,
  };
};
