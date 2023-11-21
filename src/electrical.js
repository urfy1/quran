import React, { useState, useEffect } from 'react';
import axios from "axios";
import { ChakraProvider, theme,} from '@chakra-ui/react';
import { MdBookOnline, MdLibraryBooks } from "react-icons/md";
import { Box } from '@chakra-ui/react'
import { Select } from '@chakra-ui/react'
import { useBoolean, Button } from '@chakra-ui/react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react'
import { useDisclosure } from '@chakra-ui/react'
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react'
import {
  List,
  ListItem,
  ListIcon,
  OrderedList,
  UnorderedList,
} from '@chakra-ui/react'
import people from './data';


const Electrical = () => {


  const [Recitor, setRecitor] = useState('al-afasy');
  

  const handleChange = (event) => {
    const newRecitorValue = event.target.value;
    setRecitor(newRecitorValue);
    console.log('Recitor changed:', newRecitorValue);
    localStorage.setItem('RecitorSet', JSON.stringify(newRecitorValue));
  };

  const listItems = people.map(person => <li>{person}</li>);


  return (<ChakraProvider>


                        <div>

                        <Select onChange={handleChange}>
  <option value="">Select a Recitor</option>
  {people.map((person, index) => (
    <option key={index} value={person}>
      {person}
    </option>
  ))}
</Select>
    </div>















    </ChakraProvider>);

};

    export default Electrical;