import { useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import API from "@/config";
import { useAuth } from "context/AuthContext";
import { Storage } from "@/config/storage";

export const useWheelSpin = (segments: Array<{ label: string; color: string }>, knobAngle = 0) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [coins, setCoins] = useState(0);
  const { user } = useAuth();
  const segmentAngle = 360 / segments.length;

  const spin = async (onComplete?: (result: string) => void) => {
    if (spinning) return;
    
    setSpinning(true);
    setWinner(null);

    try {
      // Get the token from storage
      const token = await Storage.get('AuthToken');
      if (!token) {
        console.error('No authentication token found');
        setSpinning(false);
        return;
      }

      // Make the spin API call
      const res = await API.post(
        "/spin",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const { coins_won, segment_label } = res.data;
      console.log("Backend response - Coins won:", coins_won);

      // Find the segment that matches the label
      let finalIndex = segments.findIndex(s => s.label === segment_label);
      if (finalIndex === -1) {
        console.warn("Segment not found, using random");
        finalIndex = Math.floor(Math.random() * segments.length);
      }

      // Animate to the correct segment
      const segmentCenter = finalIndex * segmentAngle + segmentAngle / 2;
      const targetAngle = knobAngle - segmentCenter;
      const randomRotations = 3 + Math.random() * 3;
      const totalRotation = randomRotations * 360 + targetAngle;

      Animated.timing(spinValue, {
        toValue: totalRotation,
        duration: 4500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        const winnerSegment = segments[finalIndex];
        setWinner(winnerSegment.label);
        setCoins(prev => prev + parseInt(winnerSegment.label, 10));
        onComplete?.(winnerSegment.label);
        setSpinning(false);
        spinValue.setValue(totalRotation % 360);
      });
    } catch (err: any) {
      console.error("Spin API failed:", err.response?.data || err.message);
      setSpinning(false);
      // Optionally show an error message to the user
    }
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
