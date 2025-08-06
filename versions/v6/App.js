import React, { useEffect } from 'react';
import {
  ChakraProvider,
  Container,
  Box,
  useColorMode,
  useColorModeValue,
  extendTheme
} from '@chakra-ui/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Corrected import paths to match actual file names with correct casing
import QuranReaderPage from './QuranReaderPage'; // Corrected file name casing
import TranslationsPage from './TranslationsPage'; // Corrected file name casing
import TafsirsPage from './TafsirsPage';     // Corrected file name casing
import Electrical from './electrical';

// Extend the Chakra UI theme to include color mode configuration and custom font
const customTheme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  fonts: {
    heading: 'Inter, sans-serif', // Apply Inter to headings
    body: 'Inter, sans-serif',    // Apply Inter to body text
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
      background: '#1a202c',       // Chakra's gray.800
      text: '#e2e8f0',             // Chakra's gray.200
      cardBg: '#2d3748',           // Chakra's gray.700
      inputBg: '#2d3748',          // Use gray.700 for input background in dark mode
      inputBorder: '#718096',      // Chakra's gray.500 for border
      optionBg: '#4a5568',         // Use gray.600 for option background (lighter than inputBg for contrast)
      optionColor: '#e2e8f0',      // Ensure text is light on dark options (gray.200)
    },
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      500: '#3b82f6',
      600: '#2563eb',
    },
    quran: {
      green: '#2ca02c',
      darkGreen: '#1e7e34',
      gold: '#ffd700',
    },
  },
  components: {
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'xl',
          boxShadow: 'md',
          transition: 'all 0.2s',
          _hover: {
            boxShadow: 'lg',
          },
        },
      },
    },
    Button: {
      baseStyle: {
        borderRadius: 'md',
      },
    },
    Select: {
      variants: {
        filled: (props) => ({
          field: {
            bg: props.colorMode === 'light' ? props.theme.colors.light.inputBg : props.theme.colors.dark.inputBg,
            borderColor: props.colorMode === 'light' ? props.theme.colors.light.inputBorder : props.theme.colors.dark.inputBorder,
            color: props.colorMode === 'light' ? props.theme.colors.light.optionColor : props.theme.colors.dark.optionColor,
            _hover: {
              bg: props.colorMode === 'light' ? props.theme.colors.light.inputBg : props.theme.colors.dark.inputBg,
            },
            _focus: {
              borderColor: 'brand.500',
            },
            _dark: {
              bg: props.theme.colors.dark.inputBg,
              borderColor: props.theme.colors.dark.inputBorder,
              color: props.theme.colors.dark.optionColor,
            },
          },
        }),
      },
    },
  },
});

const MainAppContent = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('light.background', 'dark.background');
  const textColor = useColorModeValue('light.text', 'dark.text');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorMode);
  }, [colorMode]);

  return (
    <Box bg={bgColor} color={textColor} minH="100vh">
      {/* Google Fonts import for Inter */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      <Container maxW="container.lg" py={2} px={4}>
        <BrowserRouter>
          <Routes>
            {/* Updated routes with descriptive names */}
            <Route path="/" element={<QuranReaderPage colorMode={colorMode} toggleColorMode={toggleColorMode} />} />
            <Route path="/quran-reader" element={<QuranReaderPage colorMode={colorMode} toggleColorMode={toggleColorMode} />} />
            <Route path="/translations" element={<TranslationsPage />} />
            <Route path="/tafsirs" element={<TafsirsPage />} />
            <Route path="/electrical" element={<Electrical />} />
          </Routes>
        </BrowserRouter>
      </Container>
    </Box>
  );
};

const App = () => {
  return (
    <ChakraProvider theme={customTheme}>
      <MainAppContent />
    </ChakraProvider>
  );
};

export default App;