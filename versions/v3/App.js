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

import Page4 from './page4';
import Page5 from './page5';
import Page6 from './page6';
import Electrical from './electrical';

// Extend the Chakra UI theme to include color mode configuration
const customTheme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
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
      <Container maxW="container.lg" py={2} px={4}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Page4 colorMode={colorMode} toggleColorMode={toggleColorMode} />} />
            <Route path="Page4" element={<Page4 colorMode={colorMode} toggleColorMode={toggleColorMode} />} />
            <Route path="Page5" element={<Page5 />} />
            <Route path="Page6" element={<Page6 />} />
            <Route path="electrical" element={<Electrical />} />
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