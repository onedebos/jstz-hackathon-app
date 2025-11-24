'use client';

import { MotionValue, motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

const fontSize = 16;
const padding = 4;
const height = fontSize + padding;

function Counter({ value }: { value: number }) {
  // Only show necessary digits (no leading zeros)
  const digits = [];
  if (value >= 100) {
    digits.push(<Digit key={100} place={100} value={value} />);
  }
  if (value >= 10) {
    digits.push(<Digit key={10} place={10} value={value} />);
  }
  // Always show ones place
  digits.push(<Digit key={1} place={1} value={value} />);

  return (
    <div
      style={{ fontSize }}
      className="flex space-x-0.5 overflow-hidden rounded leading-none text-white tabular-nums"
    >
      {digits}
    </div>
  );
}

function Digit({ place, value }: { place: number; value: number }) {
  let valueRoundedToPlace = Math.floor(value / place);
  let animatedValue = useSpring(valueRoundedToPlace, {
    stiffness: 300,
    damping: 30,
  });

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  return (
    <div style={{ height }} className="relative w-[1ch] tabular-nums">
      {[...Array(10).keys()].map((i) => (
        <Number key={i} mv={animatedValue} number={i} />
      ))}
    </div>
  );
}

function Number({ mv, number }: { mv: MotionValue; number: number }) {
  let y = useTransform(mv, (latest) => {
    let placeValue = latest % 10;
    let offset = (10 + number - placeValue) % 10;
    let memo = offset * height;

    if (offset > 5) {
      memo -= 10 * height;
    }

    return memo;
  });

  return (
    <motion.span
      style={{ y }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {number}
    </motion.span>
  );
}

export default Counter;

