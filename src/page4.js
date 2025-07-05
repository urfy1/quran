import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from "axios";
import {
  ChakraProvider, extendTheme, Box, Select, Card, CardHeader, CardBody, CardFooter,
  Heading, Text, Stack, Center, Badge, Button, useDisclosure,
  Flex, Spinner, Divider, Slider, SliderTrack, SliderFilledTrack, SliderThumb,
  FormControl, FormLabel, Drawer, DrawerBody, DrawerHeader, DrawerOverlay,
  DrawerContent, DrawerCloseButton, DrawerFooter, Checkbox, IconButton,
  Tooltip, useToast, Grid, GridItem, Tag, TagLabel, TagLeftIcon, TagRightIcon,
  Tabs, TabList, TabPanels, Tab, TabPanel, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Avatar, Wrap, WrapItem,
  RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, Input
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Howl } from 'howler';
import { FaPlay, FaPause, FaStop, FaLanguage, FaVolumeUp, FaTextHeight, FaHeart, FaRegHeart, FaRegClock } from 'react-icons/fa';
import { MdSettings, MdBookmark, MdBookmarkBorder, MdDelete } from 'react-icons/md';
import ReactMarkdown from 'react-markdown';

// Custom theme for modern look
const theme = extendTheme({
  colors: {
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      500: '#3b82f6',
      600: '#2563eb',
    },
    quran: {
      green: '#2ca02c',
      darkGreen: '#1e7e34',
      gold: '#ffd700',
    },
  },
  components: {
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'xl',
          boxShadow: 'md',
          transition: 'all 0.2s',
          _hover: {
            boxShadow: 'lg',
          },
        },
      },
    },
    Button: {
      baseStyle: {
        borderRadius: 'md',
      },
    },
  },
});

const API_BASE_URL = 'https://api.alquran.cloud/v1';
const API_TAFSIR_BASE_URL = 'https://quranapi.pages.dev/api/tafsir';

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

const tafsirNames = {
  'Ibn Kathir': 'Ibn Kathir',
  'Maarif Ul Quran': 'Maarif Ul Quran',
  'Tazkirul Quran': 'Tazkirul Quran',
};

// Debounce function
const debounce = (func, delay) => {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

// Memoized Ayah Card Component
const AyahCard = React.memo(({ ayah, index, currentlyPlayingAyahIndex, isSelected, toggleAyahSelection, handleAyahClick, currentLanguages, translationNames, ayahRefs, highlightColor }) => {
  const isCurrentPlaying = currentlyPlayingAyahIndex === index;
  const [showTafsir, setShowTafsir] = useState(false);

  // Filter out any undefined Tafsirs, assuming ayah.tafsirs holds the array from quranapi.pages.dev
  const validTafsirs = ayah.tafsirs ? ayah.tafsirs.filter(tafsir => tafsir.author && tafsir.content) : [];

  return (
    <Card
      key={ayah.number}
      p={4}
      bg={isCurrentPlaying ? highlightColor : isSelected ? 'blue.50' : 'white'}
      cursor="pointer"
      onClick={() => toggleAyahSelection(index)}
      ref={(el) => (ayahRefs.current[ayah.numberInSurah] = el)}
      _hover={{ bg: isCurrentPlaying ? highlightColor : isSelected ? 'blue.100' : 'gray.50' }}
    >
      <CardBody>
        <Flex align="center" justify="space-between" mb={2}>
          <Badge colorScheme="purple" fontSize="md" px={2} py={1} borderRadius="md">
            Ayah {ayah.numberInSurah}
          </Badge>
          <IconButton
            size="sm"
            icon={isCurrentPlaying ? <FaPause /> : <FaPlay />}
            onClick={(e) => {
              e.stopPropagation();
              handleAyahClick(index);
            }}
            aria-label={isCurrentPlaying ? "Pause Ayah" : "Play Ayah"}
            colorScheme={isCurrentPlaying ? "red" : "green"}
          />
        </Flex>
        <Text fontSize="2xl" textAlign="right" fontFamily="Amiri, serif" mb={3}>
          {ayah.text}
        </Text>
        <Divider />
        {currentLanguages.map(lang => {
          const translation = ayah.translations.find(t => t.lang === lang);
          return translation ? (
            <Box key={lang} mt={3}>
              <Text fontSize="sm" color="gray.600" mb={1}>
                <strong>{translationNames[lang] || lang}:</strong>
              </Text>
              <Text fontSize="md">
                {translation.text}
              </Text>
            </Box>
          ) : null;
        })}

        {/* Tafsir Section - Only show if there are valid Tafsirs */}
        {validTafsirs.length > 0 && (
          <Box mt={4}>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setShowTafsir(!showTafsir);
              }}
              mb={2}
            >
              {showTafsir ? 'Hide Tafsir' : 'Show Tafsir'}
            </Button>
            {showTafsir && (
              <Box>
                {validTafsirs.map((tafsir, idx) => (
                  <Box key={idx} mt={3} p={3} bg="purple.50" borderRadius="md" borderWidth="1px" borderColor="purple.100">
                    <Text fontWeight="semibold" fontSize="md" color="purple.800" mb={1}>
                      <strong>{tafsir.author}:</strong>
                    </Text>
                    {tafsir.groupVerse && <Text fontSize="sm" color="gray.600" mb={2}>{tafsir.groupVerse}</Text>}
                    <ReactMarkdown>{tafsir.content}</ReactMarkdown>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </CardBody>
    </Card>
  );
});

const Page4 = () => {
  // State management
  const [selectedSurahData, setSelectedSurahData] = useState(null);
  const [surahs, setSurahs] = useState([]);
  const [surahNumber, setSurahNumber] = useState(null);
  const [surahInfo, setSurahInfo] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isFavoritesOpen, onOpen: onFavoritesOpen, onClose: onFavoritesClose } = useDisclosure();
  const { isOpen: isMemorizationSetsOpen, onOpen: onMemorizationSetsOpen, onClose: onMemorizationSetsClose } = useDisclosure();
  const [selectedTafsirs, setSelectedTafsirs] = useState(
    JSON.parse(localStorage.getItem('Qtafsirs')) || ['Ibn Kathir']
  );

  const btnRef = useRef();
  const toast = useToast();
  const navigate = useNavigate();

  // Settings state
  const [currentLanguages, setCurrentLanguages] = useState(
    JSON.parse(localStorage.getItem('Qlangs')) || ['en.asad']
  );
  const [currentReciter, setCurrentReciter] = useState(
    JSON.parse(localStorage.getItem('RecitorSet')) || 'ar.alafasy'
  );
  const [sliderValue, setSliderValue] = useState(20);
  const [selectedAyahs, setSelectedAyahs] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem('quranFavorites')) || []
  );

  // Ayah Range selection
  const [ayahRange, setAyahRange] = useState([1, 1]);

  // Saved memorization sets
  const [memorizationSets, setMemorizationSets] = useState(
    JSON.parse(localStorage.getItem('quranMemorizationSets')) || []
  );

  // Loading states
  const [isLoadingSurahs, setIsLoadingSurahs] = useState(true);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const location = useLocation();

  // Audio player refs and state
  const currentSoundRef = useRef(null);
  const nextSoundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlayingAyahIndex, setCurrentlyPlayingAyahIndex] = useState(null);
  const ayahRefs = useRef({});
  const [highlightColor, setHighlightColor] = useState(
    localStorage.getItem('ayahHighlightColor') || '#ffd700'
  );

  // Mapping for the Ayah Audio API reciter IDs
  const reciterAyahApiMap = {
    'ar.alafasy': 1,
    'ar.abubakraldhabi': 2,
    'ar.nasseralqatami': 3,
    'ar.yasseraldossari': 4,
    'ar.haniarrifai': 5,
  };

  // Save states to localStorage
  useEffect(() => {
    localStorage.setItem('quranFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('quranMemorizationSets', JSON.stringify(memorizationSets));
  }, [memorizationSets]);

  useEffect(() => {
    localStorage.setItem('ayahHighlightColor', highlightColor);
  }, [highlightColor]);

  useEffect(() => {
    localStorage.setItem('Qtafsirs', JSON.stringify(selectedTafsirs));
  }, [selectedTafsirs]);

  // Refetch data when selectedTafsirs changes
  useEffect(() => {
    if (surahNumber) {
      const syntheticEvent = { target: { value: String(surahNumber) } };
      handleSurahChange(syntheticEvent);
    }
  }, [selectedTafsirs]);

  // Toggle favorite for current surah
  const toggleFavorite = useCallback(() => {
    if (!surahNumber) return;

    const surahIndex = favorites.findIndex(fav => fav.surahNumber === surahNumber);

    if (surahIndex >= 0) {
      setFavorites(favorites.filter(fav => fav.surahNumber !== surahNumber));
      toast({
        title: "Removed from favorites",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    } else {
      const surah = surahs.find(s => s.number === surahNumber);
      if (surah) {
        setFavorites([...favorites, {
          surahNumber: surah.number,
          name: surah.name,
          englishName: surah.englishName,
          numberOfAyahs: surah.numberOfAyahs,
          timestamp: Date.now()
        }]);
        toast({
          title: "Added to favorites",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    }
  }, [surahNumber, favorites, surahs, toast]);

  const isFavorited = useCallback(() => {
    return surahNumber && favorites.some(fav => fav.surahNumber === surahNumber);
  }, [surahNumber, favorites]);

  // Clean up audio on unmount
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

  // Get Ayah audio URL
  const getAyahAudioUrl = useCallback((surahNum, ayahNumInSurah, reciterId) => {
    const reciterNo = reciterAyahApiMap[reciterId];
    if (reciterNo && surahNum && ayahNumInSurah) {
      return `https://the-quran-project.github.io/Quran-Audio/Data/${reciterNo}/${surahNum}_${ayahNumInSurah}.mp3`;
    }
    return '';
  }, [reciterAyahApiMap]);

  // Stop audio playback
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

  // Preload next ayah
  const preloadNextAyah = useCallback((nextIndexInSelectedSurahData) => {
    if (!selectedSurahData || nextIndexInSelectedSurahData >= selectedSurahData.length) return;

    const nextAyah = selectedSurahData[nextIndexInSelectedSurahData];

    if (!nextAyah || typeof nextAyah.numberInSurah === 'undefined' || nextAyah.numberInSurah === null) {
      console.warn('Skipping preload: Next ayah data is invalid or missing numberInSurah.', nextAyah);
      nextSoundRef.current = null;
      return;
    }

    const nextSrc = getAyahAudioUrl(surahNumber, nextAyah.numberInSurah, currentReciter);

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
  }, [selectedSurahData, surahNumber, currentReciter, getAyahAudioUrl]);

  // Handle ayah click to play/pause
  const handleAyahClick = useCallback((index, customPlaylistIndices = null) => {
    if (!selectedSurahData) return;

    const ayah = selectedSurahData[index];

    if (!ayah || typeof ayah.numberInSurah === 'undefined' || ayah.numberInSurah === null) {
      console.error(`Invalid Ayah object or numberInSurah at index ${index}. Skipping playback.`);
      if (customPlaylistIndices) {
        const currentPos = customPlaylistIndices.indexOf(index);
        if (currentPos < customPlaylistIndices.length - 1) {
          handleAyahClick(customPlaylistIndices[currentPos + 1], customPlaylistIndices);
        } else {
          stopAudio();
        }
      } else {
        stopAudio();
      }
      return;
    }

    const newSrc = getAyahAudioUrl(surahNumber, ayah.numberInSurah, currentReciter);

    if (!newSrc) {
      console.warn('No audio URL available for this ayah. Skipping playback.');
      if (customPlaylistIndices) {
        const currentPos = customPlaylistIndices.indexOf(index);
        if (currentPos < customPlaylistIndices.length - 1) {
          handleAyahClick(customPlaylistIndices[currentPos + 1], customPlaylistIndices);
        } else {
          stopAudio();
        }
      } else {
        stopAudio();
      }
      return;
    }

    if (currentlyPlayingAyahIndex === index && isPlaying) {
      stopAudio();
    } else {
      stopAudio();

      currentSoundRef.current = new Howl({
        src: [newSrc],
        html5: true,
        onend: () => handleAudioEnd(index, customPlaylistIndices),
        onplay: () => {
          const nextIndexForPreload = customPlaylistIndices
            ? customPlaylistIndices[customPlaylistIndices.indexOf(index) + 1]
            : index + 1;
          preloadNextAyah(nextIndexForPreload);
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
      setCurrentlyPlayingAyahIndex(index);
      setIsPlaying(true);

      const ayahElement = ayahRefs.current[ayah.numberInSurah];
      if (ayahElement) {
        ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedSurahData, surahNumber, currentReciter, currentlyPlayingAyahIndex, isPlaying, stopAudio, getAyahAudioUrl, preloadNextAyah]);

  // Handle audio end and transition to next ayah
  const handleAudioEnd = useCallback((currentIndex, customPlaylistIndices = null) => {
    if (!selectedSurahData || currentIndex === null) return;

    let nextIndex;
    if (customPlaylistIndices) {
      const currentPos = customPlaylistIndices.indexOf(currentIndex);
      if (currentPos < customPlaylistIndices.length - 1) {
        nextIndex = customPlaylistIndices[currentPos + 1];
      }
    } else {
      nextIndex = currentIndex + 1;
    }

    if (nextIndex !== undefined && nextIndex < selectedSurahData.length) {
      const nextAyah = selectedSurahData[nextIndex];

      if (!nextAyah || typeof nextAyah.numberInSurah === 'undefined' || nextAyah.numberInSurah === null) {
        console.error(`Skipping invalid next ayah at index ${nextIndex} (numberInSurah undefined). Ending playback.`);
        stopAudio();
        return;
      }

      if (nextSoundRef.current) {
        if (currentSoundRef.current) {
          currentSoundRef.current.unload();
        }
        currentSoundRef.current = nextSoundRef.current;
        nextSoundRef.current = null;

        currentSoundRef.current.on('end', () => handleAudioEnd(nextIndex, customPlaylistIndices));
        currentSoundRef.current.on('play', () => {
          const nextNextIndex = customPlaylistIndices
            ? customPlaylistIndices[customPlaylistIndices.indexOf(nextIndex) + 1]
            : nextIndex + 1;
          preloadNextAyah(nextNextIndex);
        });
        currentSoundRef.current.on('playerror', (id, error) => {
          console.error(`Error playing preloaded audio for Ayah ${nextAyah.numberInSurah}:`, error);
          stopAudio();
        });
        currentSoundRef.current.on('loaderror', (id, error) => {
          console.error(`Error loading preloaded audio for Ayah ${nextAyah.numberInSurah}:`, error);
          stopAudio();
        });

        currentSoundRef.current.play();
        setCurrentlyPlayingAyahIndex(nextIndex);
        setIsPlaying(true);

        const nextAyahElement = ayahRefs.current[nextAyah.numberInSurah];
        if (nextAyahElement) {
          nextAyahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setTimeout(() => {
          handleAyahClick(nextIndex, customPlaylistIndices);
        }, 50);
      }
    } else {
      stopAudio();
    }
  }, [selectedSurahData, handleAyahClick, stopAudio, preloadNextAyah]);

  // Handle surah selection
  const handleSurahChange = useCallback(async (event) => {
    setErrorMessage(null);
    const selectedValue = event.target.value;
    const selectedSurah = surahs.find((surah) => surah.number === parseInt(selectedValue));

    if (selectedSurah) {
      setIsLoadingAyahs(true);
      const surahNum = selectedSurah.number;

      try {
        // Fetch translations
        const fetchPromises = currentLanguages.map(lang =>
          axios.get(`${API_BASE_URL}/surah/${surahNum}/${lang}`)
        );

        const arabicResponse = await axios.get(`${API_BASE_URL}/surah/${surahNum}/quran-simple`);
        const arabicAyahs = arabicResponse.data.data.ayahs;
        setSurahInfo(arabicResponse.data.data);
        setAyahRange([1, arabicResponse.data.data.numberOfAyahs]);

        const translationResponses = await Promise.all(fetchPromises);

        // Fetch only selected Tafsirs for each ayah
        const ayahTafsirPromises = arabicAyahs.map(async (ayah) => {
          if (selectedTafsirs.length > 0) {
            try {
              const tafsirResponse = await axios.get(`${API_TAFSIR_BASE_URL}/${surahNum}_${ayah.numberInSurah}.json`);
              // Filter tafsirs based on user's selection
              return tafsirResponse.data.tafsirs.filter(tafsir =>
                selectedTafsirs.includes(tafsir.author)
              );
            } catch (tafsirError) {
              console.warn(`Could not fetch tafsir for ${surahNum}:${ayah.numberInSurah}:`, tafsirError);
              return []; // Return empty array if tafsir fetch fails for this ayah
            }
          }
          return []; // Return empty array if no tafsirs selected
        });

        const allAyahTafsirs = await Promise.all(ayahTafsirPromises);

        const ayahsWithTranslations = arabicAyahs.map((ayah, idx) => {
          const translations = translationResponses.map(res => {
            const lang = res.config.url.split('/').pop();
            return {
              lang: lang,
              text: res.data.data.ayahs[idx].text
            };
          });

          return {
            ...ayah,
            translations: translations,
            tafsirs: allAyahTafsirs[idx] // Assign the fetched Tafsirs for this ayah
          };
        });

        setSurahNumber(surahNum);
        setSelectedSurahData(ayahsWithTranslations);
        setSelectedAyahs([]);
        stopAudio();
      } catch (error) {
        console.error('Error fetching Surah details or Tafsirs:', error);
        setErrorMessage('Failed to load Surah details or Tafsirs. Please try again.');
        setSelectedSurahData(null);
      } finally {
        setIsLoadingAyahs(false);
      }
    } else {
      setSelectedSurahData(null);
      setSurahInfo(null);
      setAyahRange([1, 1]);
    }
  }, [currentLanguages, surahs, stopAudio, selectedTafsirs]);

  // Toggle ayah selection
  const toggleAyahSelection = useCallback((index) => {
    const ayahToSelect = selectedSurahData[index];
    const isSelected = selectedAyahs.some(ayah => ayah.number === ayahToSelect.number);

    if (isSelected) {
      setSelectedAyahs(selectedAyahs.filter(ayah => ayah.number !== ayahToSelect.number));
    } else {
      setSelectedAyahs([...selectedAyahs, ayahToSelect]);
    }
  }, [selectedAyahs, selectedSurahData]);

  // Play selected ayahs
  const playSelectedAyahs = useCallback(() => {
    if (selectedAyahs.length === 0) {
      toast({
        title: "No ayahs selected",
        description: "Please select ayahs to play",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const sortedSelectedAyahs = [...selectedAyahs].sort((a, b) => a.numberInSurah - b.numberInSurah);

    const customPlaylistIndices = sortedSelectedAyahs.map(ayah =>
      selectedSurahData.findIndex(dataAyah => dataAyah.number === ayah.number)
    ).filter(index => index !== -1);

    if (customPlaylistIndices.length === 0) {
      toast({
        title: "Error playing selected ayahs",
        description: "No valid ayahs found to play.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    handleAyahClick(customPlaylistIndices[0], customPlaylistIndices);
  }, [selectedAyahs, selectedSurahData, handleAyahClick, toast]);

  // Load surah list on mount
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/surah`);
        setSurahs(response.data.data);
      } catch (error) {
        console.error('Error fetching surahs:', error);
        setErrorMessage('Failed to load surah list. Please check your connection.');
      } finally {
        setIsLoadingSurahs(false);
      }
    };

    fetchSurahs();
  }, []);

  // Handle deep linking
  useEffect(() => {
    if (location.state && location.state.surahNumber) {
      const { surahNumber } = location.state;
      if (surahs.length > 0) {
        const selectedSurah = surahs.find(s => s.number === surahNumber);
        if (selectedSurah) {
          const syntheticEvent = { target: { value: String(surahNumber) } };
          handleSurahChange(syntheticEvent);
        }
      }
    }
  }, [location.state, surahs, handleSurahChange]);

  // Clean up audio when reciter changes or when component unmounts
  useEffect(() => {
    stopAudio();
  }, [currentReciter, stopAudio]);

  // Load current languages from localStorage on mount
  useEffect(() => {
    const savedLangs = JSON.parse(localStorage.getItem('Qlangs'));
    if (savedLangs && savedLangs.length > 0) {
      setCurrentLanguages(savedLangs);
    }
  }, []);

  // Save current languages to localStorage when they change
  useEffect(() => {
    localStorage.setItem('Qlangs', JSON.stringify(currentLanguages));
  }, [currentLanguages]);

  // Function to save the currently selected ayah range
  const handleSaveSelection = useCallback(() => {
    if (!surahInfo || selectedAyahs.length === 0) {
      toast({
        title: "No selection to save",
        description: "Please select ayahs using the slider first.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const startAyahNumber = Math.min(...selectedAyahs.map(a => a.numberInSurah));
    const endAyahNumber = Math.max(...selectedAyahs.map(a => a.numberInSurah));

    const newSet = {
      id: Date.now(),
      surahNumber: surahInfo.number,
      surahName: surahInfo.englishName,
      rangeStart: startAyahNumber,
      rangeEnd: endAyahNumber,
      numberOfAyahs: selectedAyahs.length,
      timestamp: Date.now(),
    };

    setMemorizationSets([...memorizationSets, newSet]);
    toast({
      title: "Ayah range saved!",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  }, [selectedAyahs, surahInfo, memorizationSets, toast]);

  // Function to load a saved memorization set
  const loadSavedSet = useCallback(async (set) => {
    onMemorizationSetsClose();

    const syntheticEvent = { target: { value: String(set.surahNumber) } };
    await handleSurahChange(syntheticEvent);

    setTimeout(() => {
      if (selectedSurahData) {
        setAyahRange([set.rangeStart, set.rangeEnd]);
        const newSelectedAyahs = selectedSurahData.filter(ayah =>
          ayah.numberInSurah >= set.rangeStart && ayah.numberInSurah <= set.rangeEnd
        );
        setSelectedAyahs(newSelectedAyahs);
        toast({
          title: `Loaded ${set.surahName} Ayahs ${set.rangeStart}-${set.rangeEnd}`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        setIsBulkMode(true);
      } else {
        console.error("Selected surah data not available after loading saved set.");
        toast({
          title: "Failed to load saved set",
          description: "Surah data could not be retrieved.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }, 500);
  }, [onMemorizationSetsClose, handleSurahChange, selectedSurahData, toast]);

  // Function to navigate to Page6 with selected ayahs
  const displaySelectedTexts = useCallback(() => {
    if (selectedAyahs.length === 0) {
      toast({
        title: "No ayahs selected",
        description: "Please select ayahs to display.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    const sortedSelectedAyahs = [...selectedAyahs].sort((a, b) => a.numberInSurah - b.numberInSurah);

    navigate('/page6', {
      state: {
        selectedAyahsData: sortedSelectedAyahs,
        surahInfo: surahInfo
      }
    });
  }, [selectedAyahs, surahInfo, navigate, toast]);

  // Debounced functions
  const debouncedSetSelectedAyahs = useMemo(
    () =>
      debounce((val) => {
        const [start, end] = val;
        if (selectedSurahData) {
          const newSelected = selectedSurahData.filter(
            (ayah) => ayah.numberInSurah >= start && ayah.numberInSurah <= end
          );
          setSelectedAyahs(newSelected);
        }
      }, 100),
    [selectedSurahData]
  );

  const debouncedSetHighlightColor = useMemo(
    () =>
      debounce((color) => {
        setHighlightColor(color);
        toast({
          title: "Highlight color updated",
          status: "success",
          duration: 1500,
          isClosable: true,
        });
      }, 300),
    [setHighlightColor, toast]
  );

  return (
    <ChakraProvider theme={theme}>
      <Box w="full" minH="100vh" py={6} px={4}>
        {/* Header Section */}
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="xl" color="brand.600" display="flex" alignItems="center">
            Quran Reader
          </Heading>
          <Flex>
            <Tooltip label="Bulk Selection Mode">
              <IconButton
                icon={isBulkMode ? <MdBookmark /> : <MdBookmarkBorder />}
                onClick={() => {
                  setIsBulkMode(!isBulkMode);
                  setSelectedAyahs([]);
                  stopAudio();
                  if (surahInfo) {
                    setAyahRange([1, surahInfo.numberOfAyahs]);
                  }
                }}
                colorScheme={isBulkMode ? "blue" : "gray"}
                aria-label="Bulk mode"
                mr={2}
              />
            </Tooltip>
            <Tooltip label="View Favorites">
              <IconButton
                icon={<FaHeart color={favorites.length > 0 ? "red" : "gray"} />}
                onClick={onFavoritesOpen}
                aria-label="Favorites"
                mr={2}
              />
            </Tooltip>
            <Tooltip label="View Saved Memorization Sets">
              <IconButton
                icon={<FaRegClock color={memorizationSets.length > 0 ? "green" : "gray"} />}
                onClick={onMemorizationSetsOpen}
                aria-label="Saved Memorization Sets"
                mr={2}
              />
            </Tooltip>
            <Button
              leftIcon={<MdSettings />}
              onClick={onOpen}
              colorScheme="brand"
            >
              Settings
            </Button>
          </Flex>
        </Flex>

        {/* Surah Selection Card */}
        <Card mb={6}>
          <CardBody>
            <Grid templateColumns={{ base: "1fr", md: "repeat(5, 1fr)" }} gap={6}>
              <GridItem colSpan={{ base: 1, md: 3 }}>
                <FormControl>
                  <FormLabel>Select Surah</FormLabel>
                  <Select
                    onChange={handleSurahChange}
                    placeholder="Choose a Surah"
                    size="lg"
                    variant="filled"
                    value={surahNumber || ""}
                    focusBorderColor="brand.500"
                  >
                    {surahs.map((surah) => (
                      <option value={surah.number} key={surah.number}>
                        {surah.number}. {surah.englishName} ({surah.name})
                      </option>
                    ))}
                  </Select>
                  {surahInfo && (
                    <Box mt={4} p={3} bg="blue.50" borderRadius="md">
                      <Text fontSize="md" fontWeight="bold">
                        {surahInfo.englishNameTranslation}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Revelation Type: {surahInfo.revelationType}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Number of Ayahs: {surahInfo.numberOfAyahs}
                      </Text>
                    </Box>
                  )}
                </FormControl>
              </GridItem>
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <Flex align={{ base: "flex-start", md: "flex-end" }} h="100%" direction={{ base: "column", md: "row" }} wrap="wrap">
                  <Wrap spacing={2} mb={{ base: 2, md: 0 }}>
                    {currentLanguages.map(lang => (
                      <WrapItem key={lang}>
                        <Tag size="md" colorScheme="blue" borderRadius="full">
                          <TagLeftIcon as={FaLanguage} />
                          <TagLabel>{translationNames[lang] || lang}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                  <Flex ml={{ base: 0, md: "auto" }} mt={{ base: 2, md: 0 }} flexWrap="wrap" gap={2}>
                    {isBulkMode && selectedSurahData && selectedAyahs.length > 0 && (
                      <>
                        <Button
                          leftIcon={<FaPlay />}
                          colorScheme="green"
                          onClick={playSelectedAyahs}
                          size="sm"
                        >
                          Play ({selectedAyahs.length})
                        </Button>
                        <Button
                          colorScheme="purple"
                          onClick={displaySelectedTexts}
                          size="sm"
                        >
                          View ({selectedAyahs.length})
                        </Button>
                        <Button
                          leftIcon={<MdBookmark />}
                          colorScheme="orange"
                          onClick={handleSaveSelection}
                          size="sm"
                        >
                          Save
                        </Button>
                      </>
                    )}
                    <IconButton
                      icon={isFavorited() ? <FaHeart color="red" /> : <FaRegHeart />}
                      onClick={toggleFavorite}
                      aria-label={isFavorited() ? "Remove from favorites" : "Add to favorites"}
                      colorScheme={isFavorited() ? "red" : "gray"}
                      variant="ghost"
                    />
                  </Flex>
                </Flex>
              </GridItem>
            </Grid>
          </CardBody>
        </Card>

        {/* Ayahs Display */}
        {isLoadingAyahs ? (
          <Center py={10}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text ml={4} fontSize="lg">Loading Ayahs...</Text>
          </Center>
        ) : errorMessage && !selectedSurahData ? (
          <Text color="red.500" textAlign="center" fontSize="lg">{errorMessage}</Text>
        ) : selectedSurahData && (
          <Stack spacing={4}>
            {isBulkMode && surahInfo && (
              <Box p={4} borderWidth="1px" borderRadius="lg" mb={4} bg="gray.50">
                <FormLabel>Select Ayah Range ({ayahRange[0]} to {ayahRange[1]})</FormLabel>
                <RangeSlider
                  aria-label={['min-ayah', 'max-ayah']}
                  min={1}
                  max={surahInfo.numberOfAyahs}
                  step={1}
                  value={ayahRange}
                  onChange={(val) => setAyahRange(val)}
                  onChangeEnd={(val) => debouncedSetSelectedAyahs(val)}
                  colorScheme="green"
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack />
                  </RangeSliderTrack>
                  <Tooltip
                    hasArrow
                    bg='green.500'
                    color='white'
                    placement='top'
                    isOpen={ayahRange[0] !== 1 || ayahRange[1] !== surahInfo.numberOfAyahs}
                    label={`${ayahRange[0]} - ${ayahRange[1]}`}
                  >
                    <RangeSliderThumb index={0} />
                  </Tooltip>
                  <Tooltip
                    hasArrow
                    bg='green.500'
                    color='white'
                    placement='top'
                    isOpen={ayahRange[0] !== 1 || ayahRange[1] !== surahInfo.numberOfAyahs}
                    label={`${ayahRange[0]} - ${ayahRange[1]}`}
                  >
                    <RangeSliderThumb index={1} />
                  </Tooltip>
                </RangeSlider>
              </Box>
            )}
            {selectedSurahData.map((ayah, index) => {
              const isSelected = selectedAyahs.some(sAyah => sAyah.number === ayah.number);
              const isAyahInSelectedRange = isBulkMode
                ? (ayah.numberInSurah >= ayahRange[0] && ayah.numberInSurah <= ayahRange[1])
                : true;

              return isAyahInSelectedRange ? (
                <AyahCard
                  key={ayah.number}
                  ayah={ayah}
                  index={index}
                  currentlyPlayingAyahIndex={currentlyPlayingAyahIndex}
                  isSelected={isSelected}
                  toggleAyahSelection={isBulkMode ? toggleAyahSelection : () => {}}
                  handleAyahClick={handleAyahClick}
                  currentLanguages={currentLanguages}
                  translationNames={translationNames}
                  ayahRefs={ayahRefs}
                  highlightColor={highlightColor}
                />
              ) : null;
            })}
          </Stack>
        )}
      </Box>

      {/* Settings Drawer */}
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        finalFocusRef={btnRef}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">App Settings</DrawerHeader>

          <DrawerBody>
            <Stack spacing={4}>
              {/* Reciter Selection */}
              <FormControl>
                <FormLabel htmlFor="reciter-select">Select Reciter</FormLabel>
                <Select
                  id="reciter-select"
                  value={currentReciter}
                  onChange={(e) => {
                    setCurrentReciter(e.target.value);
                    localStorage.setItem('RecitorSet', JSON.stringify(e.target.value));
                    toast({
                      title: "Reciter updated",
                      status: "success",
                      duration: 1500,
                      isClosable: true,
                    });
                  }}
                >
                  <option value="ar.alafasy">Mishary Rashid Alafasy</option>
                  <option value="ar.abubakraldhabi">Abu Bakr al-Dhaby</option>
                  <option value="ar.nasseralqatami">Nasser Al Qatami</option>
                  <option value="ar.yasseraldossari">Yasser Al-Dossari</option>
                  <option value="ar.haniarrifai">Hani Ar-Rifai</option>
                </Select>
              </FormControl>

              {/* Translation Language Selection */}
              <FormControl>
                <FormLabel>Select Translations</FormLabel>
                <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                  {Object.keys(translationNames).map(lang => (
                    <GridItem key={lang}>
                      <Checkbox
                        isChecked={currentLanguages.includes(lang)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setCurrentLanguages(prev =>
                            isChecked ? [...prev, lang] : prev.filter(l => l !== lang)
                          );
                        }}
                      >
                        {translationNames[lang]}
                      </Checkbox>
                    </GridItem>
                  ))}
                </Grid>
              </FormControl>

              {/* Tafsir Selection */}
              <FormControl mt={4}>
                <FormLabel>Select Tafsirs</FormLabel>
                <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                  {Object.keys(tafsirNames).map(key => (
                    <GridItem key={key}>
                      <Checkbox
                        isChecked={selectedTafsirs.includes(key)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setSelectedTafsirs(prev =>
                            isChecked ? [...prev, key] : prev.filter(tafsir => tafsir !== key)
                          );
                        }}
                      >
                        {tafsirNames[key]}
                      </Checkbox>
                    </GridItem>
                  ))}
                </Grid>
                <Button
                  mt={4}
                  size="sm"
                  onClick={() => {
                    localStorage.setItem('Qtafsirs', JSON.stringify(selectedTafsirs));
                    toast({
                      title: "Tafsir settings saved",
                      status: "success",
                      duration: 1500,
                      isClosable: true,
                    });
                  }}
                >
                  Apply Tafsir Settings
                </Button>
              </FormControl>

              {/* Highlight Color Picker */}
              <FormControl>
                <FormLabel htmlFor="highlight-color-picker">Playing Ayah Highlight Color</FormLabel>
                <Flex alignItems="center">
                  <Input
                    id="highlight-color-picker"
                    type="color"
                    value={highlightColor}
                    onChange={(e) => debouncedSetHighlightColor(e.target.value)}
                    width="70px"
                    p={1}
                    borderRadius="md"
                    border="1px solid lightgray"
                  />
                  <Text ml={3}>{highlightColor}</Text>
                </Flex>
              </FormControl>

              {/* Font Size Slider */}
              <FormControl>
                <FormLabel>Ayah Font Size: {sliderValue}px</FormLabel>
                <Slider
                  aria-label="slider-ayah-font-size"
                  defaultValue={20}
                  min={14}
                  max={40}
                  step={1}
                  onChange={(val) => setSliderValue(val)}
                >
                  <SliderTrack>
                    <SliderFilledTrack bg="brand.500" />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </FormControl>
            </Stack>
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px">
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={onClose}>
              Close Settings
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Favorites Modal */}
      <Modal isOpen={isFavoritesOpen} onClose={onFavoritesClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Your Favorite Surahs</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {favorites.length === 0 ? (
              <Text>No favorites added yet.</Text>
            ) : (
              <Stack spacing={3}>
                {favorites.map(fav => (
                  <Flex
                    key={fav.surahNumber}
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box>
                      <Text fontWeight="bold">
                        {fav.surahNumber}. {fav.englishName} ({fav.name})
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Ayahs: {fav.numberOfAyahs}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        Added: {new Date(fav.timestamp).toLocaleDateString()}
                      </Text>
                    </Box>
                    <IconButton
                      icon={<MdDelete />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => setFavorites(favorites.filter(f => f.surahNumber !== fav.surahNumber))}
                      aria-label="Delete favorite"
                    />
                  </Flex>
                ))}
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onFavoritesClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Memorization Sets Modal */}
      <Modal isOpen={isMemorizationSetsOpen} onClose={onMemorizationSetsClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Saved Memorization Sets</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {memorizationSets.length === 0 ? (
              <Text>No memorization sets saved yet.</Text>
            ) : (
              <Stack spacing={3}>
                {memorizationSets.map(set => (
                  <Flex
                    key={set.id}
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box>
                      <Text fontWeight="bold">
                        {set.surahName}: Ayahs {set.rangeStart}-{set.rangeEnd} ({set.numberOfAyahs} Ayahs)
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Saved: {new Date(set.timestamp).toLocaleDateString()}
                      </Text>
                    </Box>
                    <Flex>
                      <Button size="sm" colorScheme="blue" mr={2} onClick={() => loadSavedSet(set)}>
                        Load
                      </Button>
                      <IconButton
                        icon={<MdDelete />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => setMemorizationSets(memorizationSets.filter(s => s.id !== set.id))}
                        aria-label="Delete memorization set"
                      />
                    </Flex>
                  </Flex>
                ))}
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onMemorizationSetsClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ChakraProvider>
  );
};

export default Page4;