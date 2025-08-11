import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from "axios";
import {
  Box, Card, CardHeader, CardBody, Heading, Text, Stack, StackDivider, Button, Spinner, Center,
  useColorModeValue, IconButton, useToast, Flex
} from '@chakra-ui/react';
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import { Howl } from 'howler';
import { FaPlay, FaPause, FaStop } from 'react-icons/fa';
import localforage from 'localforage';

// CORRECTED: The API_AUDIO_BASE_URL is now confirmed to be 'https://everyayah.com/data'
const API_TAFSIR_BASE_URL = 'https://quranapi.pages.dev/api/tafsir';
const API_TRANSLATION_BASE_URL = 'https://api.alquran.cloud/v1';
const API_ARABIC_BASE_URL = 'https://api.quran.com/api/v4';
const API_AUDIO_BASE_URL = 'https://everyayah.com/data';

// CORRECTED: Reciter Map with the correct folder for Abdul Rahman Al-Sudais (64kbps)
const reciterMap = {
  'Mishary Rashid Alafasy': { type: 'everyayah', folder: 'Alafasy_128kbps' },
  'Abdul Baset Abdul Samad Murattal': { type: 'everyayah', folder: 'Abdul_Basit_Murattal_64kbps' },
  'Abdul Baset Abdul Samad Mujawwad': { type: 'everyayah', folder: 'Abdul_Basit_Mujawwad_128kbps' },
  'Mahmoud Khalil Al-Husary': { type: 'everyayah', folder: 'Husary_128kbps' },
  'Muhammad Ayyoub': { type: 'everyayah', folder: 'Muhammad_Ayyoub_128kbps' },
  'Nasser Al Qatami': { type: 'everyayah', folder: 'Nasser_Alqatami_128kbps' },
  'Yasser Al-Dossari': { type: 'everyayah', folder: 'Yasser_Ad-Dossary_128kbps' },
  'Hani Ar-Rifai': { type: 'everyayah', folder: 'Hani_Rifai_192kbps' },
  'Khalifa Al Tunaiji': { type: 'everyayah', folder: 'Khalifa_Al_Tunaiji_64kbps' },
  'Abdullah Awad Al-Juhany': { type: 'everyayah', folder: 'Abdullaah_3awwaad_Al-Juhaynee_128kbps' },
  'Saud Al-Shuraim': { type: 'everyayah', folder: 'Abdurrahmaan_As-Sudais_64kbps' }, 
  // UPDATED: Corrected reciter folder based on the user's working link
  'Abdul Rahman Al-Sudais': { type: 'everyayah', folder: 'Abdurrahmaan_As-Sudais_64kbps' },
  'Ali Jaber': { type: 'everyayah', folder: 'Ali_Jaber_64kbps' },
  'Ahmed Al-Ajmi': { type: 'everyayah', folder: 'Ahmed_ibn_Ali_al-Ajamy_64kbps_QuranExplorer.Com' },
  'Mohammed Al-Luhaidan': { type: 'everyayah', folder: 'mohammed_al_luhaidan_192kbps' },
  'Al Ghamadi': { type: 'everyayah', folder: 'Ghamadi_40kbps' },
  'Minshawi Murattal': { type: 'everyayah', folder: 'Minshawy_Murattal_128kbps' },
  'Minshawi Mujawwad': { type: 'everyayah', folder: 'Minshawy_Mujawwad_192kbps' },
  'Sahih International (Ibrahim Walk)': { type: 'everyayah', folder: 'English/Sahih_Intnl_Ibrahim_Walk_192kbps' }
};

// Define translation names for display
const translationNames = {
  'en.pickthall': "Pickthall",
  'en.yusufali': "Yusuf Ali",
  'en.sahih': "Sahih International",
  'en.transliteration': "Transliteration",
  'ur.maududi': "Maududi (Urdu)",
  'fr.hamidullah': "Hamidullah (French)",
  'bn.bengali': "Muhiuddin Khan (Bengali)",
  'zh.jian': "Ma Jian (Chinese)",
  'de.aburida': "Abu Rida (German)",
  'hi.hindi': "Suhel Farooq Khan and Saifur Rahman Nadwi (Hindi)",
  'it.piccardo': "Hamza Roberto Piccardo (Italian)",
  'so.abduh': "Mahmud Muhammad Abduh (Somalian)"
};

// Define Tafsir author display names
const tafsirNames = {
  'Ibn Kathir': 'Ibn Kathir',
  'Maarif Ul Quran': 'Maarif Ul Quran',
  'Tazkirul Quran': 'Tazkirul Quran',
};

// Component for rendering individual Ayah details on the TafsirsPage
const TafsirAyahCard = ({ ayah, arabicFontSize, translationFontSize, cardBg, headingColor, arabicTextColor, blueText, purpleText, grayTextColor,
  currentlyPlayingAyahIndex, handleAyahClick, highlightColor, ayahRefs
}) => {
  const [showTafsir, setShowTafsir] = useState(false);
  const isCurrentPlaying = currentlyPlayingAyahIndex === ayah.number;
  const cardHoverBg = useColorModeValue('gray.50', 'gray.700');
  const tafsirBoxBg = useColorModeValue('white', 'gray.700');
  const tafsirBoxBorder = useColorModeValue('gray.200', 'gray.700');

  return (
    <Card
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      bg={isCurrentPlaying ? highlightColor : cardBg}
      id={`ayah-${ayah.numberInSurah}`}
      ref={(el) => (ayahRefs.current[ayah.numberInSurah] = el)}
      _hover={{ bg: isCurrentPlaying ? highlightColor : cardHoverBg }}
    >
      <CardBody>
        <Flex align="center" justify="space-between" mb={2}>
          <Heading size="sm" color={headingColor}>Ayah {ayah.numberInSurah}</Heading>
          <IconButton
            size="sm"
            icon={isCurrentPlaying ? <FaPause /> : <FaPlay />}
            onClick={(e) => {
              e.stopPropagation();
              handleAyahClick(ayah.number);
            }}
            aria-label={isCurrentPlaying ? "Pause Ayah" : "Play Ayah"}
            colorScheme={isCurrentPlaying ? "red" : "green"}
          />
        </Flex>
        <Text
          fontSize={`${arabicFontSize}px`}
          textAlign="center"
          dir="rtl"
          fontFamily="Amiri, serif"
          lineHeight="2"
          letterSpacing="1px"
          mb={3}
          color={arabicTextColor}
        >
          {ayah.text}
        </Text>
        {ayah.translations.map((trans, transIdx) => (
          <Box key={transIdx} mb={2}>
            <Heading size="sm" color={blueText} mb={1}>
              {translationNames[trans.lang] || trans.lang}:
            </Heading>
            <Text fontSize={`${translationFontSize}px`} color={grayTextColor}>{trans.text}</Text>
          </Box>
        ))}
        {ayah.tafsirs && ayah.tafsirs.length > 0 && (
          <Box mt={4}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTafsir(!showTafsir)}
              mb={2}
            >
              {showTafsir ? 'Hide Tafsir' : 'Show Tafsir'}
            </Button>
            {showTafsir && (
              <Box>
                <Heading size='xs' textTransform='uppercase' mb={2} color={purpleText}>
                  Tafsirs
                </Heading>
                {ayah.tafsirs.map((tafsir, tafsirIdx) => (
                  <Box
                    key={tafsirIdx}
                    mt={2}
                    p={3}
                    borderRadius="md"
                    borderWidth="1px"
                    bg={tafsirBoxBg}
                    borderColor={tafsirBoxBorder}
                  >
                    <Text fontWeight="semibold" fontSize="md" color={purpleText} mb={1}>
                      {tafsirNames[tafsir.author] || tafsir.author}
                    </Text>
                    {tafsir.groupVerse && <Text fontSize="sm" color={grayTextColor} mb={2}>{tafsir.groupVerse}</Text>}
                    <Text fontSize={`${translationFontSize}px`} color={grayTextColor}>
                      <ReactMarkdown>{tafsir.content}</ReactMarkdown>
                    </Text>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </CardBody>
    </Card>
  );
};

// Main TafsirsPage component
const TafsirsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const surahNumberFromLink = location.state?.surahNumber;
  const ayahNumberFromLink = location.state?.ayahNumber;
  const selectedAyahsData = location.state?.selectedAyahsData;
  const surahInfoFromLink = location.state?.surahInfo;

  const [surahDetails, setSurahDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Using localforage for state persistence
  const [currentLanguages, setCurrentLanguages] = useState([]);
  const [currentTafsirs, setCurrentTafsirs] = useState([]);
  const [currentReciter, setCurrentReciter] = useState('');
  const [arabicFontSize, setArabicFontSize] = useState(32);
  const [translationFontSize, setTranslationFontSize] = useState(16);

  // Audio playback states and refs
  const currentSoundRef = useRef(null);
  const nextSoundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlayingAyahIndex, setCurrentlyPlayingAyahIndex] = useState(null);
  const ayahRefs = useRef({});

  const highlightColor = useColorModeValue('yellow.100', 'blue.700');
  const cardBg = useColorModeValue('light.cardBg', 'dark.cardBg');
  const cardHeaderBg = useColorModeValue('gray.50', 'gray.800');
  const headingColor = useColorModeValue('brand.600', 'brand.200');
  const textColor = useColorModeValue('light.text', 'dark.text');
  const arabicTextColor = useColorModeValue('quran.darkGreen', 'quran.gold');
  const dividerColor = useColorModeValue('gray.200', 'gray.600');
  const purpleText = useColorModeValue('purple.800', 'purple.200');
  const blueText = useColorModeValue('blue.700', 'blue.300');
  const grayTextColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    const loadSettings = async () => {
      const savedLangs = await localforage.getItem('Qlangs');
      if (savedLangs) setCurrentLanguages(savedLangs);

      const savedTafsirs = await localforage.getItem('Qtafsirs');
      if (savedTafsirs) setCurrentTafsirs(savedTafsirs);

      const savedReciter = await localforage.getItem('RecitorSet');
      if (savedReciter) setCurrentReciter(savedReciter);

      const savedArabicFontSize = await localforage.getItem('arabicFontSize');
      if (savedArabicFontSize) setArabicFontSize(savedArabicFontSize);

      const savedTranslationFontSize = await localforage.getItem('translationFontSize');
      if (savedTranslationFontSize) setTranslationFontSize(savedTranslationFontSize);
    };
    loadSettings();
  }, []);

  // CORRECTED: getAyahAudioUrl now uses the corrected everyayah.com API
  const getAyahAudioUrl = useCallback((surahNum, ayahNumInSurah, reciterName) => {
    const reciterInfo = reciterMap[reciterName];
    if (!reciterInfo) return '';

    if (reciterInfo.type === 'everyayah') {
      const paddedSurah = String(surahNum).padStart(3, '0');
      const paddedAyah = String(ayahNumInSurah).padStart(3, '0');
      return `${API_AUDIO_BASE_URL}/${reciterInfo.folder}/${paddedSurah}${paddedAyah}.mp3`;
    }
    return '';
  }, []);

  const stopAudio = useCallback(() => {
    if (currentSoundRef.current) {
      currentSoundRef.current.stop();
      currentSoundRef.current.unload();
      currentSoundRef.current = null;
    }
    if (nextSoundRef.current) {
      nextSoundRef.current.unload();
      nextSoundRef.current = null;
    }
    setIsPlaying(false);
    setCurrentlyPlayingAyahIndex(null);
  }, []);

  const preloadNextAyah = useCallback((nextAyahNumber) => {
    const nextAyah = ayahsToDisplay.find(a => a.number === nextAyahNumber);
    if (!nextAyah || typeof nextAyah.numberInSurah === 'undefined' || nextAyah.numberInSurah === null) {
      console.warn('Skipping preload: Next ayah data is invalid or missing numberInSurah.', nextAyah);
      nextSoundRef.current = null;
      return;
    }

    const surahNumForAudio = nextAyah.surah?.number || surahDetails?.number;
    if (!surahNumForAudio) {
      console.error(`Surah number not available for preloading ayah ${nextAyah.numberInSurah}.`);
      nextSoundRef.current = null;
      return;
    }

    const nextSrc = getAyahAudioUrl(surahNumForAudio, nextAyah.numberInSurah, currentReciter);

    if (nextSrc && nextSoundRef.current) {
      nextSoundRef.current.unload();
    }

    if (nextSrc) {
      nextSoundRef.current = new Howl({
        src: [nextSrc],
        html5: true,
        preload: true,
        onloaderror: (id, error) => {
          console.error(`Failed to preload next ayah (${nextAyah.numberInSurah}):`, error);
          nextSoundRef.current = null;
        }
      });
    }
  }, [ayahsToDisplay, surahDetails, getAyahAudioUrl, currentReciter]);

  const handleAyahClick = useCallback((ayahNumber) => {
    const ayah = ayahsToDisplay.find(a => a.number === ayahNumber);
    if (!ayah || typeof ayah.numberInSurah === 'undefined' || ayah.numberInSurah === null) {
      console.error(`Invalid Ayah object or numberInSurah for ayah number ${ayahNumber}. Skipping playback.`);
      stopAudio();
      return;
    }

    const surahNumForAudio = ayah.surah?.number || surahDetails?.number;
    if (!surahNumForAudio) {
      console.error(`Surah number not available for ayah ${ayah.numberInSurah}. Cannot play audio.`);
      stopAudio();
      return;
    }

    const newSrc = getAyahAudioUrl(surahNumForAudio, ayah.numberInSurah, currentReciter);

    if (!newSrc) {
      console.warn('No audio URL available for this ayah. Skipping playback.');
      stopAudio();
      return;
    }

    if (currentlyPlayingAyahIndex === ayahNumber && isPlaying) {
      stopAudio();
    } else {
      stopAudio();

      currentSoundRef.current = new Howl({
        src: [newSrc],
        html5: true,
        onend: () => handleAudioEnd(ayahNumber),
        onplay: () => {
          const currentAyahIndexInDisplay = ayahsToDisplay.findIndex(a => a.number === ayahNumber);
          const nextAyahInDisplay = ayahsToDisplay[currentAyahIndexInDisplay + 1];
          if (nextAyahInDisplay) {
            preloadNextAyah(nextAyahInDisplay.number);
          }
        },
        onplayerror: (id, error) => {
          console.error(`Error playing audio for Ayah ${ayah.numberInSurah}:`, error);
          stopAudio();
        },
        onloaderror: (id, error) => {
          console.error(`Error loading audio for Ayah ${ayah.numberInSurah} (URL: ${newSrc}):`, error);
          stopAudio();
        }
      });

      currentSoundRef.current.play();
      setCurrentlyPlayingAyahIndex(ayahNumber);
      setIsPlaying(true);

      const ayahElement = ayahRefs.current[ayah.numberInSurah];
      if (ayahElement) {
        ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [ayahsToDisplay, surahDetails, getAyahAudioUrl, currentReciter, currentlyPlayingAyahIndex, isPlaying, stopAudio, preloadNextAyah]);

  const handleAudioEnd = useCallback((currentAyahNumber) => {
    const currentAyahIndexInDisplay = ayahsToDisplay.findIndex(a => a.number === currentAyahNumber);
    const nextAyahInDisplay = ayahsToDisplay[currentAyahIndexInDisplay + 1];

    if (nextAyahInDisplay) {
      if (nextSoundRef.current) {
        if (currentSoundRef.current) {
          currentSoundRef.current.unload();
        }
        currentSoundRef.current = nextSoundRef.current;
        nextSoundRef.current = null;

        currentSoundRef.current.on('end', () => handleAudioEnd(nextAyahInDisplay.number));
        currentSoundRef.current.on('play', () => {
          const nextAyahToPreloadIndex = ayahsToDisplay.findIndex(a => a.number === nextAyahInDisplay.number) + 1;
          const nextAyahAfterNext = ayahsToDisplay[nextAyahToPreloadIndex];
          if (nextAyahAfterNext) {
            preloadNextAyah(nextAyahAfterNext.number);
          }
        });
        currentSoundRef.current.on('playerror', (id, error) => {
          console.error(`Error playing preloaded audio for Ayah ${nextAyahInDisplay.numberInSurah}:`, error);
          stopAudio();
        });
        currentSoundRef.current.on('loaderror', (id, error) => {
          console.error(`Error loading preloaded audio for Ayah ${nextAyahInDisplay.numberInSurah}:`, error);
          stopAudio();
        });

        currentSoundRef.current.play();
        setCurrentlyPlayingAyahIndex(nextAyahInDisplay.number);
        setIsPlaying(true);

        const nextAyahElement = ayahRefs.current[nextAyahInDisplay.numberInSurah];
        if (nextAyahElement) {
          nextAyahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setTimeout(() => {
          handleAyahClick(nextAyahInDisplay.number);
        }, 50);
      }
    } else {
      stopAudio();
    }
  }, [ayahsToDisplay, handleAyahClick, stopAudio, preloadNextAyah]);

  // UPDATED: useEffect to handle data fetching
  useEffect(() => {
    if (selectedAyahsData && selectedAyahsData.length > 0) {
      // Logic for displaying pre-selected ayahs (from QuranReaderPage)
      const processedSelectedAyahsData = selectedAyahsData.map(ayah => ({
        ...ayah,
        surah: ayah.surah || surahInfoFromLink
      }));
      setSurahDetails({ ...surahInfoFromLink, ayahs: processedSelectedAyahsData });
      setIsLoading(false);
      setError(null);
    } else if (surahNumberFromLink && ayahNumberFromLink) {
      // Logic for displaying a single ayah from a direct link
      setIsLoading(true);
      setError(null);

      const fetchTafsirAndTranslations = async () => {
        try {
          const tafsirPromises = currentTafsirs.map(tafsirName =>
            axios.get(`${API_TAFSIR_BASE_URL}/${surahNumberFromLink}_${ayahNumberFromLink}.json`)
              .catch(err => {
                console.error(`Failed to fetch Tafsir for ${tafsirName}:`, err);
                return { data: { tafsirs: [] } };
              })
          );
          
          const translationPromises = currentLanguages.map(lang =>
            axios.get(`${API_TRANSLATION_BASE_URL}/ayah/${surahNumberFromLink}:${ayahNumberFromLink}/${lang}`)
          );

          // NEW: Fetch Arabic text from quran.com API
          const arabicTextPromise = axios.get(`${API_ARABIC_BASE_URL}/quran/verses/uthmani_hafs?chapter_number=${surahNumberFromLink}&verse_key=${surahNumberFromLink}:${ayahNumberFromLink}`);
          
          const surahInfoPromise = axios.get(`${API_TRANSLATION_BASE_URL}/surah/${surahNumberFromLink}/en.sahih`);

          const [arabicResponse, surahInfoResponse, ...otherResponses] = await Promise.all([
            arabicTextPromise,
            surahInfoPromise,
            ...translationPromises,
            ...tafsirPromises
          ]);

          const arabicText = arabicResponse.data.verses[0]?.text_uthmani_hafs;
          const surahInfo = surahInfoResponse.data.data;
          
          const translationResponses = otherResponses.slice(0, currentLanguages.length);
          const tafsirResponses = otherResponses.slice(currentLanguages.length);

          const translations = translationResponses.map(res => ({
            lang: res.config.url.split('/').pop(),
            text: res.data.data.text
          }));

          const allTafsirs = tafsirResponses.flatMap(res => res.data.tafsirs || []);
          const ayahsTafsirs = allTafsirs.filter(tafsir =>
            currentTafsirs.includes(tafsir.author)
          );

          const ayah = {
            number: surahInfo.ayahs[ayahNumberFromLink - 1].number,
            numberInSurah: ayahNumberFromLink,
            text: arabicText,
            translations,
            tafsirs: ayahsTafsirs,
            surah: {
              number: surahNumberFromLink,
              name: surahInfo.name,
              englishName: surahInfo.englishName,
            }
          };

          setSurahDetails({ ...surahInfo, ayahs: [ayah] });
          setIsLoading(false);

          setTimeout(() => {
            const ayahElement = document.getElementById(`ayah-${ayahNumberFromLink}`);
            if (ayahElement) {
              ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);

        } catch (err) {
          console.error('Error fetching data for TafsirsPage:', err);
          setError("Failed to load surah details or tafsirs. Please try again or go back.");
          setSurahDetails(null);
          setIsLoading(false);
        }
      };
      fetchTafsirAndTranslations();
    } else {
      setError("No surah or selected ayahs provided. Please go back to the Surah list.");
      setIsLoading(false);
      setSurahDetails(null);
    }
  }, [surahNumberFromLink, ayahNumberFromLink, selectedAyahsData, surahInfoFromLink, currentLanguages, currentTafsirs, toast]);

  useEffect(() => {
    stopAudio();
  }, [currentReciter, stopAudio]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const ayahsToDisplay = selectedAyahsData && selectedAyahsData.length > 0
    ? selectedAyahsData
    : surahDetails?.ayahs || [];

  return (
    <Box p={4} maxW="container.xl" mx="auto" minH="100vh" bg={useColorModeValue('light.background', 'dark.background')}>
      <Card align="center" width="full" mb={6} bg={cardBg} boxShadow="md" borderRadius="xl">
        <Stack direction='row' spacing={6} my={4} wrap="wrap" justify="center">
          <Button colorScheme='green' variant='solid' onClick={() => { stopAudio(); navigate('/'); }}>
            Back to Surah List
          </Button>
          {surahDetails && !selectedAyahsData && (
            <Button colorScheme='blue' variant='outline'>
              Surah: {surahDetails.englishName} ({surahDetails.number})
            </Button>
          )}
          {selectedAyahsData && (
            <Heading size='md' align="center" color={purpleText}>
              Selected Ayahs from {surahInfoFromLink?.englishName || "Current Surah"}
            </Heading>
          )}
          {isPlaying && (
            <Button leftIcon={<FaStop />} colorScheme="red" onClick={stopAudio}>
              Stop All Audio
            </Button>
          )}
        </Stack>

        <CardHeader bg={cardHeaderBg} width="full" py={4} borderBottomRadius="xl">
          <Heading size='md' align="center" color={headingColor}>
            {surahDetails && !selectedAyahsData ? `${surahDetails.englishName} (${surahDetails.name})` : 'Ayah Details'}
          </Heading>
          {surahDetails && !selectedAyahsData && (
            <Text fontSize="sm" color={textColor} mt={1} textAlign="center">
              Revelation Type: {surahDetails.revelationType}, Ayahs: {surahDetails.numberOfAyahs}
            </Text>
          )}
        </CardHeader>
      </Card>

      {isLoading ? (
        <Center py={10}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text ml={4} fontSize="lg" color={textColor}>Loading Ayahs...</Text>
        </Center>
      ) : error ? (
        <Text color="red.500" textAlign="center" fontSize="lg">{error}</Text>
      ) : (
        <Stack spacing={4} divider={<StackDivider borderColor={dividerColor} />}>
          {ayahsToDisplay.length > 0 ? (
            ayahsToDisplay.map((ayah, index) => (
              <TafsirAyahCard
                key={ayah.number}
                ayah={ayah}
                arabicFontSize={arabicFontSize}
                translationFontSize={translationFontSize}
                cardBg={cardBg}
                headingColor={headingColor}
                arabicTextColor={arabicTextColor}
                blueText={blueText}
                purpleText={purpleText}
                grayTextColor={grayTextColor}
                currentlyPlayingAyahIndex={currentlyPlayingAyahIndex}
                handleAyahClick={handleAyahClick}
                highlightColor={highlightColor}
                ayahRefs={ayahRefs}
              />
            ))
          ) : (
            <Center py={10}>
              <Text color={textColor}>No ayahs to display.</Text>
            </Center>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default TafsirsPage;