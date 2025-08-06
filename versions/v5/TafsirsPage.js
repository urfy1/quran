import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";
import {
  Box, Card, CardHeader, CardBody, Heading, Text, Stack, StackDivider, Button, Spinner, Center,
  useColorModeValue, IconButton, useToast, Flex
} from '@chakra-ui/react';
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import { Howl } from 'howler';
import { FaPlay, FaPause, FaStop } from 'react-icons/fa';

// Define translation names for display
const translationNames = {
  'en.asad': "Muhammad Asad",
  'en.pickthall': "Pickthall",
  'en.yusufali': "Yusuf Ali",
  'en.sahih': "Sahih International",
  'en.transliteration': "Transliteration",
  'ur.maududi': "Maududi (Urdu)",
  'fr.hamidullah': "Hamidullah (French)",
  'es.bornez': "Bornez (Spanish)",
};

// Define Tafsir author display names
const tafsirNames = {
  'Ibn Kathir': 'Ibn Kathir',
  'Maarif Ul Quran': 'Maarif Ul Quran',
  'Tazkirul Quran': 'Tazkirul Quran',
};

// Component for rendering individual Ayah details on the TafsirsPage
const TafsirAyahCard = ({ ayah, arabicFontSize, translationFontSize, cardBg, headingColor, arabicTextColor, blueText, purpleBg, purpleBorder, purpleText, grayTextColor,
  currentlyPlayingAyahIndex, handleAyahClick, highlightColor, ayahRefs
}) => {
  const [showTafsir, setShowTafsir] = useState(false);
  const isCurrentPlaying = currentlyPlayingAyahIndex === ayah.number;

  // Use useColorModeValue for card background and text colors
  const cardHoverBg = useColorModeValue('gray.50', 'gray.700');

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
            <Text fontWeight="semibold" fontSize="md" color={blueText}>
              {translationNames[trans.lang] || trans.lang}:
            </Text>
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
                  <Box key={tafsirIdx} mt={2} p={3} bg={purpleBg} borderRadius="md" borderWidth="1px" borderColor={purpleBorder}>
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

  const [currentLanguages, setCurrentLanguages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('Qlangs')) || ['en.asad'];
    } catch (e) {
      console.error("Failed to parse Qlangs from localStorage", e);
      return ['en.asad'];
    }
  });
  const [currentTafsirs, setCurrentTafsirs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('Qtafsirs')) || ['Ibn Kathir'];
    } catch (e) {
      console.error("Failed to parse Qtafsirs from localStorage", e);
      return ['Ibn Kathir'];
    }
  });
  const [currentReciter, setCurrentReciter] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('RecitorSet')) || 'ar.alafasy';
    } catch (e) {
      console.error("Failed to parse RecitorSet from localStorage", e);
      return 'ar.alafasy';
    }
  });

  const [arabicFontSize, setArabicFontSize] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('arabicFontSize')) || 32;
    }
    catch (e) {
      console.error("Failed to parse arabicFontSize from localStorage", e);
      return 32;
    }
  });
  const [translationFontSize, setTranslationFontSize] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('translationFontSize')) || 16;
    }
    catch (e) {
      console.error("Failed to parse translationFontSize from localStorage", e);
      return 16;
    }
  });

  // Audio playback states and refs
  const currentSoundRef = useRef(null);
  const nextSoundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlayingAyahIndex, setCurrentlyPlayingAyahIndex] = useState(null);
  const ayahRefs = useRef({});

  // Define highlightColor using useColorModeValue for consistency
  const highlightColor = useColorModeValue('yellow.100', 'yellow.600'); // Light mode: light yellow, Dark mode: darker yellow

  // Mapping for the Ayah Audio API reciter IDs
  const reciterAyahApiMap = {
    'ar.alafasy': 1,
    'ar.abubakraldhabi': 2,
    'ar.nasseralqatami': 3,
    'ar.yasseraldossari': 4,
    'ar.haniarrifai': 5,
  };

  // Theme-aware colors using Chakra UI's useColorModeValue hook
  const cardBg = useColorModeValue('light.cardBg', 'dark.cardBg');
  const cardHeaderBg = useColorModeValue('gray.50', 'gray.800');
  const headingColor = useColorModeValue('brand.600', 'brand.200');
  const textColor = useColorModeValue('light.text', 'dark.text');
  const arabicTextColor = useColorModeValue('quran.darkGreen', 'quran.gold');
  const dividerColor = useColorModeValue('gray.200', 'gray.600');
  const purpleBg = useColorModeValue('purple.50', 'purple.900');
  const purpleBorder = useColorModeValue('purple.100', 'purple.700');
  const purpleText = useColorModeValue('purple.800', 'purple.200');
  const blueText = useColorModeValue('blue.700', 'blue.300');
  const grayTextColor = useColorModeValue('gray.600', 'gray.400');

  // Audio functions (copied and adapted from QuranReaderPage.js)
  const getAyahAudioUrl = (surahNum, ayahNumInSurah, reciterId) => {
    const reciterNo = reciterAyahApiMap[reciterId];
    if (reciterNo && surahNum && ayahNumInSurah) {
      return `https://the-quran-project.github.io/Quran-Audio/Data/${reciterNo}/${surahNum}_${ayahNumInSurah}.mp3`;
    }
    return '';
  };

  const stopAudio = () => {
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
  };

  const preloadNextAyah = (nextAyahNumber) => {
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
  };

  const handleAyahClick = (ayahNumber) => {
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
  };

  const handleAudioEnd = (currentAyahNumber) => {
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
  };

  useEffect(() => {
    if (selectedAyahsData && selectedAyahsData.length > 0) {
      const processedSelectedAyahsData = selectedAyahsData.map(ayah => ({
        ...ayah,
        surah: ayah.surah || surahInfoFromLink
      }));
      setSurahDetails({ ...surahInfoFromLink, ayahs: processedSelectedAyahsData });
      setIsLoading(false);
      setError(null);
    } else if (surahNumberFromLink) {
      setIsLoading(true);
      setError(null);

      const fetchPromises = currentLanguages.map(lang =>
        axios.get(`https://api.alquran.cloud/v1/surah/${surahNumberFromLink}/${lang}`)
      );

      const arabicFetchPromise = axios.get(`https://api.alquran.cloud/v1/surah/${surahNumberFromLink}/quran-simple`);

      const tafsirPromises = [];
      if (ayahNumberFromLink && currentTafsirs.length > 0) {
        tafsirPromises.push(
          axios.get(`https://quranapi.pages.dev/api/tafsir/${surahNumberFromLink}_${ayahNumberFromLink}.json`)
        );
      }

      Promise.all([arabicFetchPromise, ...fetchPromises, ...tafsirPromises])
        .then((responses) => {
          const arabicSurahData = responses[0].data.data;
          const translationResponses = responses.slice(1, responses.length - tafsirPromises.length);
          const tafsirResponseData = tafsirPromises.length > 0 ? responses[responses.length - 1].data : null;

          const ayahsWithTranslations = arabicSurahData.ayahs.map((ayah, idx) => {
            const translations = translationResponses.map(res => ({
              lang: res.config.url.split('/').pop(),
              text: res.data.data.ayahs[idx].text
            }));

            let ayahsTafsirs = [];
            if (tafsirResponseData && ayah.numberInSurah === ayahNumberFromLink) {
              ayahsTafsirs = tafsirResponseData.tafsirs.filter(tafsir =>
                currentTafsirs.includes(tafsir.author)
              );
            }

            return {
              ...ayah,
              translations,
              tafsirs: ayahsTafsirs,
              surah: {
                number: surahNumberFromLink,
                name: arabicSurahData.name,
                englishName: arabicSurahData.englishName,
              }
            };
          });

          const filteredAyahs = ayahNumberFromLink
            ? ayahsWithTranslations.filter(ayah => ayah.numberInSurah === ayahNumberFromLink)
            : ayahsWithTranslations;

          setSurahDetails({ ...arabicSurahData, ayahs: filteredAyahs });
          console.log('Surah details for TafsirsPage (single ayah mode):', { ...arabicSurahData, ayahs: filteredAyahs });

          if (ayahNumberFromLink) {
            setTimeout(() => {
              const ayahElement = document.getElementById(`ayah-${ayahNumberFromLink}`);
              if (ayahElement) {
                ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }
        })
        .catch((err) => {
          console.error('Error fetching data for TafsirsPage:', err);
          setError("Failed to load surah details or tafsirs. Please try again or go back.");
          setSurahDetails(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setError("No surah or selected ayahs provided. Please go back to the Surah list.");
      setIsLoading(false);
      setSurahDetails(null);
    }
  }, [surahNumberFromLink, currentLanguages, ayahNumberFromLink, selectedAyahsData, surahInfoFromLink, currentTafsirs]);

  useEffect(() => {
    stopAudio();
  }, [currentReciter]);

  useEffect(() => {
    return () => {
      if (currentSoundRef.current) {
        currentSoundRef.current.unload();
        currentSoundRef.current = null;
      }
      if (nextSoundRef.current) {
        nextSoundRef.current.unload();
        nextSoundRef.current = null;
      }
    };
  }, []);

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
                textColor={textColor}
                purpleBg={purpleBg}
                purpleBorder={purpleBorder}
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