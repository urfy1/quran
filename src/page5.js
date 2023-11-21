import React, { useState, useEffect } from 'react';
import axios from "axios";
import { ChakraProvider, theme,} from '@chakra-ui/react';
import { MdBookOnline, MdLibraryBooks } from "react-icons/md";
import { Box } from '@chakra-ui/react'
import { Select } from '@chakra-ui/react'
import { Grid, GridItem } from '@chakra-ui/react'
import { SimpleGrid } from '@chakra-ui/react'
import { Card, CardHeader, CardBody, CardFooter } from '@chakra-ui/react'
import { Heading } from '@chakra-ui/react'
import { Text } from '@chakra-ui/react'
import { Stack, HStack, VStack, StackDivider } from '@chakra-ui/react'

const Page5 = () => {
  const requestRegion = (event) => {
    console.log(event.target.value);
  }

  const requestRegion2 = (event) => {
    console.log(event.target.value);
    const lang = (event.target.value);
    console.log('lang',lang);
    localStorage.setItem('Qlang', JSON.stringify(lang));
  }
  
   const [data, setData] = useState([]);

   useEffect(() => {
    axios.get("http://api.alquran.cloud/v1/edition") 
    .then((res) => {
      console.log('axios data: ',res.data.data);
     
      setData(res.data.data);  
      console.log('axios data1: ',setData);
    });
  }, []);

  return (<ChakraProvider>

 <Box color="pink" >    

    </Box> 
    <Select onChange={requestRegion2}>
                        <option value="" >Choose a Language</option>
                        {data.map((value) => (
                            <option value={value.identifier} key={value.identifier}>
                           {value.identifier}
                            </option>
                        ))}
                    </Select>
                    
                    <Card>



</Card>
  
    </ChakraProvider>);

};

    export default Page5;