import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, Center, keyframes, useColorModeValue, Image } from '@chakra-ui/react';

// Define keyframe animations for both fade-in and fade-out
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

// Simple fade-out for the entire screen
const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

// Keyframe animation for text that grows and fades out
const growAndFadeOut = keyframes`
  from {
    opacity: 1;
    transform: scale(1.1); /* Starts where continuousGrow leaves off */
  }
  to {
    opacity: 0;
    transform: scale(1.5);
  }
`;

// NEW: Keyframe animation for the text to grow continuously
const continuousGrow = keyframes`
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.1);
  }
`;

const SplashScreen = ({ onFinish }) => {
  const [isReady, setIsReady] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const color = useColorModeValue('quran.darkGreen', 'quran.gold');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    // First, let the fade-in animation complete
    const fadeInTimer = setTimeout(() => {
      setIsReady(true);
    }, 800);

    return () => clearTimeout(fadeInTimer);
  }, []);

  useEffect(() => {
    if (isReady) {
      // After the fade-in is complete, wait for the desired 3 seconds
      const mainTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 3000);

      return () => clearTimeout(mainTimer);
    }
  }, [isReady]);

  useEffect(() => {
    // Once the fade-out state is triggered, wait for the animation to finish
    if (isFadingOut) {
      const fadeOutTimer = setTimeout(() => {
        onFinish();
      }, 500);

      return () => clearTimeout(fadeOutTimer);
    }
  }, [isFadingOut, onFinish]);

  if (!isReady && !isFadingOut) {
    return null;
  }
  
  return (
    <Center
      className="splash-screen"
      width="100vw"
      height="100vh"
      position="fixed"
      top="0"
      left="0"
      zIndex="9999"
      bg={bgColor}
      flexDirection="column"
      animation={isFadingOut ? `${fadeOut} 0.5s ease-in-out forwards` : `${fadeIn} 0.8s ease-in-out forwards`}
    >
      <Box textAlign="center">
        {/* UPDATED: Image source to quran.png from the public folder */}
        <Image 
          src="/quran.png"
          alt="Quran Reader Logo"
          mb={8}
          maxW="200px"
          mx="auto"
        />
        
        <Box
          // Conditionally apply the grow animations
          animation={isReady && !isFadingOut ? `${continuousGrow} 3s ease-in-out forwards` : isFadingOut ? `${growAndFadeOut} 0.5s ease-in-out forwards` : 'none'}
        >
          <Heading
            as="h1"
            size="2xl"
            fontWeight="bold"
            mb={4}
            color={color}
          >
            AdQuran
          </Heading>
          <Text fontSize="xl" color={textColor}>
            Loading...
          </Text>
        </Box>
      </Box>
    </Center>
  );
};

export default SplashScreen;