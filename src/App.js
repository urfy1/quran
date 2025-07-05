import React from 'react';
import { ChakraProvider, theme, Container } from '@chakra-ui/react'; // Ensure Container is imported
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Page4 from './page4';
import Page5 from './page5';
import Page6 from './page6';
import Electrical from './electrical';

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      {/*
        Changed Container to:
        - maxW="none": This removes the maximum width constraint, allowing it to expand fully.
        - p={0}: This removes any default padding the Container might add, ensuring edge-to-edge layout if desired.
                 (Your Page4 already has px={4} for internal spacing, which is good.)
      */}
 <Container maxW="container.lg" py={2} px={4}> 
        <BrowserRouter>
          <Routes>
            {/*
              Removed the nested route structure for the root path,
              as it's generally not how react-router-dom is intended to be used.
              Each <Route> should define a distinct path.
              If '/' should render Page4, then it should be a direct route.
            */}
            <Route path="/" element={<Page4 />} />
            <Route path="Page4" element={<Page4 />} /> {/* This route is redundant if '/' is Page4 */}
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