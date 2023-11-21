  //xs, sm, md, lg, xl, or full can use any of these sizes for modal size

import React, { useState, useEffect } from 'react';
import axios from "axios";
import { ChakraProvider, theme,} from '@chakra-ui/react';

import { Box } from '@chakra-ui/react'
import { Select } from '@chakra-ui/react'
import { Card, CardHeader, CardBody, CardFooter, center } from '@chakra-ui/react'
import { Heading } from '@chakra-ui/react'
import { Text } from '@chakra-ui/react'
import { Stack, HStack, VStack, StackDivider } from '@chakra-ui/react'
import { Center, Square, Circle } from '@chakra-ui/react'
import { Badge } from '@chakra-ui/react'
import {Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,} from '@chakra-ui/react'
import { Button, ButtonGroup } from '@chakra-ui/react'
import { useDisclosure } from '@chakra-ui/react'
import { Link } from 'react-router-dom';
import Page6 from "./page6";
import Page5 from "./page5";
import Electrical from './electrical';
import { Flex, Spacer } from '@chakra-ui/react'
import {Link as RouterLink, Route, Routes,} from "react-router-dom";
import { Fade, ScaleFade, Slide, SlideFade } from '@chakra-ui/react'
import { Spinner } from '@chakra-ui/react'
import { useRadioGroup, Radio, RadioGroup} from '@chakra-ui/react';
import { Image } from '@chakra-ui/react'
import { AudioPlayer } from 'react-audio-play';
import { PhoneIcon, AddIcon, WarningIcon, SettingsIcon , InfoIcon } from '@chakra-ui/icons'

import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';

import { Icon } from '@chakra-ui/react'

import datas1 from "./data.js";
import { Divider } from '@chakra-ui/react'
import {
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
} from '@chakra-ui/react'
import { SimpleGrid } from '@chakra-ui/react'
import { Wrap, WrapItem } from '@chakra-ui/react'
import {
  Tag,
  TagLabel,
  TagLeftIcon,
  TagRightIcon,
  TagCloseButton,
} from '@chakra-ui/react'


const Page4 = () => {
  const [selectedSurahData, setSelectedSurahData] = useState(null);
  const [data, setData] = useState([]);
  const [surahNumber, setSurahNumber] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = React.useRef();
  const LangType1 = JSON.parse(localStorage.getItem('Qlang')) || 'en.asad';
  const ReciteAudio1 = JSON.parse(localStorage.getItem('RecitorSet')) || 'ar.alafasy';
  let AudioRecite = JSON.parse(localStorage.getItem('AudioReciter'));
  const [ayahNumber, setAyahNumber] = useState(null);
  const [englishNameTranslation, setEnglishNameTranslation] = useState('');
  const [revelationType, setrevelationType] = useState('');
  const [numberOfAyahs, setnumberOfAyahs] = useState('');


  const [sliderValue, setSliderValue] = useState(20)
  
  
  
  // State to store the value of the selected Ayah's number
  const [selectedAyahNumber, setSelectedAyahNumber] = useState(null);

  const requestRegion = (event) => {
    const selectedValue = event.target.value;
    const selectedSurah = data.find((surah) => surah.number === parseInt(selectedValue));

    if (selectedSurah) {
      const surahNumber = selectedSurah.number;
      const apiUrl = `http://api.alquran.cloud/v1/surah/${surahNumber}/${LangType1}`;

      axios
        .get(apiUrl)
        .then((res) => {
          setSurahNumber(surahNumber);
          setSelectedSurahData(res.data.data.ayahs);
          setEnglishNameTranslation(res.data.data.englishNameTranslation);
          setrevelationType(res.data.data.revelationType);
          setnumberOfAyahs(res.data.data.numberOfAyahs);

          console.log('sel', res.data.data);
          console.log('testinghead', res.data.data.englishNameTranslation);
        })
        .catch((error) => {
          console.error('Error fetching Surah details:', error);
        });
    }
  };



  const handleButtonClick1 = (number) => {
    console.log('Clicked on Ayah number All:', number);
    setAyahNumber(number);
    console.log('AyahNumber:', ayahNumber);
    // Set the selected Ayah's number in the state
    setSelectedAyahNumber(number);
  };
  

  useEffect(() => {
    axios.get('http://api.alquran.cloud/v1/surah').then((res) => {
      setData(res.data.data);
    });
  }, []);

  return (
    <ChakraProvider>
   

 {/* Select a Surah */}


 
 <Card width="full" style={{ marginTop: '20px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', background: '#f1f1f1' }}>
 <Box style={{ margin: '5px' }}>
    <Button leftIcon={<SettingsIcon w={6} h={6}/>} color='green' variant='outline' onClick={onOpen} >
      
    </Button>

  </Box>


<Wrap spacing='5px' justify='center'>
  <WrapItem>
    <Center w='180px' >
    <Box  >  {englishNameTranslation && (
  <Badge variant='outline' colorScheme='green'>English: {englishNameTranslation}</Badge>
)}</Box>
    </Center>
  </WrapItem>
  <WrapItem>
    <Center w='180px' >
    <Box  >{revelationType && (

  <Badge variant='outline' colorScheme='green'>Revelation Type: {revelationType}</Badge>
)}</Box>
    </Center>
  </WrapItem>
  <WrapItem>
    <Center w='180px' >
    <Box  >{numberOfAyahs && (

  <Badge variant='outline' colorScheme='green'>Number of ayahs: {numberOfAyahs}</Badge>
)}</Box>
    </Center>
  </WrapItem>
  
</Wrap>






  <CardBody align="center">

    <Heading fontSize="xl" align="center">
      Select a Surah
    </Heading>
    <Center height='10px'>
      <Divider orientation='vertical' />
    </Center>

              {/* Conditionally render the AudioPlayer only when surahNumber is available */}
              {surahNumber && (
            <AudioPlayer
              key={surahNumber} // Add a unique key to force the AudioPlayer to refresh when surahNumber changes
              src={`https://cdn.islamic.network/quran/audio-surah/128/${ReciteAudio1}/${surahNumber}.mp3`}
              color="#8DA4A2"
              sliderColor="#5B8B86"
              style={{ background: '#E4E4E4', borderRadius: '15px', padding: '30px' }}
            />
          )}

    <Center height='10px'>
      <Divider orientation='vertical' />
    </Center>

    <Stack divider={<StackDivider />} spacing='4' justify="center">
      <select
        onChange={requestRegion}
        style={{
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          marginLeft: '10%',
          marginRight: '10%',
          textAlign: 'center', // Center text within each option
          background: 'rgb(224 224 224)' ,
        }}
      >
        <option value="">Select a Surah</option>
        {data.map((value) => (
          <option
            value={value.number}
            key={value.number}
          >
            Surah:{value.number} {value.englishName} {value.name}   
          </option>
        ))}
      </select>
    </Stack>

    
  </CardBody>
</Card>




{/* Select a Surah */}

      {/* Display the selected Surah data */}
      {selectedSurahData && (
        <Stack spacing={4} width="full">
          {selectedSurahData.map((ayah) => (
            <Card key={ayah.numberInSurah}   width="full">
              <CardHeader >

                <HStack spacing={4}>
  {['md'].map((size) => (
    <Tag size={size} key={size} variant='outline' colorScheme='blue'>
      <TagLabel>Ayah {ayah.numberInSurah}</TagLabel>
      <TagRightIcon as={InfoIcon }  />
    </Tag>
  ))}
</HStack>
                
            {/* Set the value for ayah.number and store it in the state */}
            {ayah.number && (
              <Badge
                ml="1"

                onClick={() => handleButtonClick1(ayah.number)}
              >
                
              </Badge>
              
              
            )}


            
              </CardHeader>
              <CardBody align='left'>
                <Flex justify="space-between">



<Box position='relative' padding='10' w='100%'>
 
  <Text bg='white' fontSize={[sliderValue]}  align="center" >
  {ayah.text}
  </Text>
</Box>




                  
                  {/* Add more Text components for other details if needed */}
                </Flex>
              </CardBody>
              <CardFooter>

              </CardFooter>
            </Card>
          ))}
        </Stack>
      )}

<Divider orientation='horizontal' />



      {/* Settings Drawer */}
      <Drawer
        isOpen={isOpen}
        placement='right'
        onClose={onClose}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Quran Settings</DrawerHeader>

          <DrawerBody>
            <Page5 />
            Current Language: {LangType1}
            <Electrical/>
            Current Recitor: {ReciteAudio1}
            <Divider />
            <Divider />
            <Text  align="left" >
  Text Size
  </Text>


<Slider aria-label='slider-ex-1' onChange={(val) => setSliderValue(val)}>
  <SliderTrack bg='red.100'>
    <SliderFilledTrack bg='tomato' />
  </SliderTrack>
  <SliderThumb boxSize={6}>
    <Box color='tomato' />
  </SliderThumb>
</Slider>



          </DrawerBody>

          <DrawerFooter>
            <Button variant='outline' mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme='blue' onClick={onClose}>Save</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </ChakraProvider>
  );
};

export default Page4;