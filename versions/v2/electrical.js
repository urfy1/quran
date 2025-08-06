import React, { useState, useEffect } from 'react';
import axios from "axios"; // Not strictly needed here if `people` is static
import { ChakraProvider, Select, FormControl, FormLabel, Input } from '@chakra-ui/react'; // Added FormControl, FormLabel

import people from './data'; // Assuming data.js exports an array of reciter names

const Electrical = ({ setCurrentReciter }) => { // Destructure setCurrentReciter prop

  const handleChange = (event) => {
    const newRecitorValue = event.target.value;
    console.log('Reciter changed:', newRecitorValue);
    localStorage.setItem('RecitorSet', JSON.stringify(newRecitorValue));
    setCurrentReciter(newRecitorValue); // Update the state in the parent (Page4)
  };

  return (
    <ChakraProvider>
      <div>
        <FormControl>
          <FormLabel htmlFor="reciter-select">Select an Audio Reciter</FormLabel>
          <Select
            id="reciter-select"
            onChange={handleChange}
            placeholder="Select a Reciter"
            mb={4} // Add margin-bottom for spacing
          >
            {people.map((person, index) => (
              <option key={index} value={person}>
                {person}
              </option>
            ))}
          </Select>
        </FormControl>
      </div>
    </ChakraProvider>
  );
};

export default Electrical;