import React, { useState, useEffect } from 'react';
import axios from "axios";
import { ChakraProvider, theme,} from '@chakra-ui/react';
import { Box } from '@chakra-ui/react'
import { Select } from '@chakra-ui/react'
import { Grid, GridItem } from '@chakra-ui/react'
import { SimpleGrid } from '@chakra-ui/react'
import { Card, CardHeader, CardBody, CardFooter } from '@chakra-ui/react'
import { Heading } from '@chakra-ui/react'
import { Text } from '@chakra-ui/react'
import { Stack, HStack, VStack, StackDivider } from '@chakra-ui/react'
import { useLocation, Link } from "react-router-dom";
import { Wrap, WrapItem } from '@chakra-ui/react'
import { Flex, Spacer } from '@chakra-ui/react'
import { Spinner } from '@chakra-ui/react'
import Page5 from "./page5";
import { Badge } from '@chakra-ui/react'
import { Button, ButtonGroup } from '@chakra-ui/react'

let textFromStorage = JSON.parse(localStorage.getItem('my-key'));
let LangType = JSON.parse(localStorage.getItem('Qlang'));
const LangType2 = {LangType};
console.log('LangTT',LangType);


const Page6 = () => {

   const [data, setData] = useState([]);
   const [data1, setData1] = useState([]);

   useEffect(() => {

    const UrlCheck = axios.get('http://api.alquran.cloud/v1/surah/'+(textFromStorage.data2)+'/'+(LangType)) 
    .then((res) => {
      console.log('axios data: ',res.data.data.ayahs);
      console.log('UrlCheck: ',UrlCheck);
      setData(res.data.data.ayahs);  

    });
  }, []);



  return (<ChakraProvider>

                    <Card align="center">

<Stack direction='row' spacing={6}>

<Link to="/Page4"> 
<Button  colorScheme='green' variant='solid' >Surah List</Button>
</Link>
  

  <Link to="/page2"><button>
          
            </button>
            </Link>

  <Button  colorScheme='blue' variant='outline'>
  Surah Number 
  </Button>
</Stack>
  <CardHeader>
    <Heading size='md' align="center" color='green' > </Heading>
    

   
  </CardHeader>

  <CardBody  button="true" align="center" >
    
    <Stack divider={<StackDivider />} spacing='4'>
    
    <option value="">    </option>    
                        {data.map((value) => (

                            <option value={value.number} key={value.number} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>

                             {value.numberInSurah}  {value.text}  

                            </option> 
                           
                        ))}



      <Box>
        <Heading size='xs' textTransform='uppercase'>

        </Heading>
        <Text pt='2' fontSize='xl'>
        <Link to="/Page4"> 
<Button colorScheme='green' variant='solid' >Surah List</Button>
</Link>
        </Text>
      </Box>


    </Stack>
  </CardBody>
</Card>
  
    </ChakraProvider>);

};

    export default Page6;