import React from 'react';
import { ChakraProvider, Container } from '@chakra-ui/react';
import theme from './theme';  // your custom theme
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Page4 from './page4';
import Page5 from './page5';
import Page6 from './page6';
import Electrical from './electrical';

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <Container maxW="container.lg" py={2} px={4}> 
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Page4 />} />
            <Route path="Page4" element={<Page4 />} /> 
            <Route path="Page5" element={<Page5 />} />
            <Route path="Page6" element={<Page6 />} />
            <Route path="electrical" element={<Electrical />} />
          </Routes>
        </BrowserRouter>
      </Container>
    </ChakraProvider>
  );
};

export default App;
