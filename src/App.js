import React, { useState } from 'react';
import {
  ChakraProvider,
  Container,
  Box,
  useColorMode,
  useColorModeValue,
  extendTheme,
  Heading,
  Button,
  VStack,
} from '@chakra-ui/react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import QuranReaderPage from './QuranReaderPage';
import TranslationsPage from './TranslationsPage';
import TafsirsPage from './TafsirsPage';
import Electrical from './electrical';
import SplashScreen from './SplashScreen';

// Extend the Chakra UI theme to include color mode configuration and custom font
const customTheme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  colors: {
    light: {
      background: '#f8f8f8',
      text: '#333333',
      cardBg: '#ffffff',
      inputBg: 'white',
      inputBorder: 'gray.200',
      optionBg: 'white',
      optionColor: 'gray.800',
    },
    dark: {
      background: '#1a202c',
      text: '#e2e8f0',
      cardBg: '#2d3748',
      inputBg: '#2d3748',
      inputBorder: '#718096',
      optionBg: '#4a5568',
      optionColor: '#e2e8f0',
    },
    brand: {
      primary: '#1a73e8', // A strong blue for primary actions
      secondary: '#0F4C81', // A darker shade for accents
    },
  },
});

// A simple placeholder component for AyahOptionsPage. 
// You should create a separate file named AyahOptionsPage.js and move this content there.
const AyahOptionsPage = () => {
    const navigate = useNavigate();

    // In a real application, you would get the ayah data from a state or URL parameter
    const ayahText = "Example Ayah Text...";

    const handleCopy = () => {
        // You would use a library or the browser's clipboard API to copy the text
        alert("Ayah copied to clipboard!"); 
    };

    const handleShare = () => {
        // Implement share functionality
        alert("Share functionality triggered!");
    };

    const handleTafsir = () => {
        // Navigate back to the tafsir page
        navigate('/tafsirs');
    };
    
    // The "Back" button allows the user to return to the QuranReaderPage
    const handleBack = () => {
        navigate(-1);
    };

    return (
        <Box p={4} maxW="md" mx="auto" mt={8} borderWidth="1px" borderRadius="lg" overflow="hidden" boxShadow="md">
            <Heading mb={4} size="lg">Options for Ayah</Heading>
            <VStack spacing={4}>
                <Button colorScheme="blue" width="full" onClick={handleCopy}>Copy Ayah</Button>
                <Button colorScheme="teal" width="full" onClick={handleShare}>Share Ayah</Button>
                <Button colorScheme="green" width="full" onClick={handleTafsir}>View Tafsir</Button>
                <Button colorScheme="gray" width="full" onClick={handleBack}>Go Back</Button>
            </VStack>
        </Box>
    );
};


const MainAppContent = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('light.background', 'dark.background');
  const textColor = useColorModeValue('light.text', 'dark.text');

  return (
    <Box bg={bgColor} color={textColor} minH="100vh">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      <Container maxW="container.lg" py={2} px={4}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<QuranReaderPage colorMode={colorMode} toggleColorMode={toggleColorMode} />} />
            <Route path="/quran-reader" element={<QuranReaderPage colorMode={colorMode} toggleColorMode={toggleColorMode} />} />
            <Route path="/translations" element={<TranslationsPage />} />
            <Route path="/tafsirs" element={<TafsirsPage />} />
            <Route path="/electrical" element={<Electrical />} />
            {/* NEW ROUTE for the Ayah options page */}
            <Route path="/ayah-options" element={<AyahOptionsPage />} />
          </Routes>
        </BrowserRouter>
      </Container>
    </Box>
  );
};

const App = () => {
  // State to control the visibility of the splash screen
  const [showSplash, setShowSplash] = useState(true);

  // A function to hide the splash screen
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <ChakraProvider theme={customTheme}>
      {/* Conditionally render the SplashScreen or the main app content */}
      {showSplash ? (
        <SplashScreen onFinish={handleSplashFinish} />
      ) : (
        <MainAppContent />
      )}
    </ChakraProvider>
  );
};

export default App;
