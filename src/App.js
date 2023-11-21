import React, { useState, useEffect } from 'react';
import './App.css';
import axios from "axios";
import { ChakraProvider, theme,} from '@chakra-ui/react';
import { Select } from '@chakra-ui/react';
import { Button, ButtonGroup } from '@chakra-ui/react';
import { Center, Square, Circle } from '@chakra-ui/react';
import { Box } from '@chakra-ui/react';
import { Flex, Spacer, Heading, Text  } from '@chakra-ui/react'
import { IconName } from "react-icons/md";
import { Divider, Image  } from '@chakra-ui/react'
import { Stack, HStack, VStack } from '@chakra-ui/react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Layout from "./Layout";

import ReactDOM from "react-dom/client";
import {
  List,
  ListItem,
  ListIcon,
  OrderedList,
  UnorderedList,
} from '@chakra-ui/react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuGroup,
  MenuOptionGroup,
  MenuDivider,
} from '@chakra-ui/react';
import { Card, CardHeader, CardBody, CardFooter, Container } from '@chakra-ui/react'
import Page4 from './page4';
import Page5 from './page5';
import Page6 from './page6';
import Electrical from './electrical';
const App = () => {


return (<ChakraProvider>
  <Container>
          <BrowserRouter>
      <Routes>
      <Route path="/" exact element={<Page4 />}>
      <Route path="Page4" exact element={<Page4 />} />
      <Route path="Page5" exact element={<Page5 />} />
      <Route path="Page6" exact element={<Page6 />} />
      <Route path="electrical" exact element={<Electrical />} />

      </Route>
        </Routes>
</BrowserRouter>
</Container>
    





  </ChakraProvider>);

  };

export default App;



