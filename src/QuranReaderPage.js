import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from "axios";
import {
  Box, Select, Card, CardHeader, CardBody, CardFooter,
  Heading, Text, Stack, Center, Badge, Button, useDisclosure,
  Flex, Spinner, Divider, Slider, SliderTrack, SliderFilledTrack, SliderThumb,
  FormControl, FormLabel, Drawer, DrawerBody, DrawerHeader, DrawerOverlay,
  DrawerContent, DrawerCloseButton, DrawerFooter, Checkbox, IconButton,
  Tooltip, useToast, Grid, GridItem, Tag, TagLabel, TagLeftIcon, TagRightIcon,
  Tabs, TabList, TabPanels, Tab, TabPanel, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Avatar, Wrap, WrapItem,
  RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, Input,
  useColorModeValue,
  useColorMode
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Howl } from 'howler';
import { FaPlay, FaPause, FaStop, FaLanguage, FaVolumeUp, FaTextHeight, FaHeart, FaRegHeart, FaSun, FaMoon, FaShare, FaRegClock, FaArrowUp } from 'react-icons/fa';
import { MdSettings, MdBookmark, MdBookmarkBorder, MdDelete, MdMenu } from 'react-icons/md';
import ReactMarkdown from 'react-markdown';
import localforage from 'localforage'; // Import localforage for IndexedDB abstraction


// ... (other constants and components remain unchanged)

const API_BASE_URL = 'https://api.alquran.cloud/v1';
const API_TAFSIR_BASE_URL = 'https://quranapi.pages.dev/api/tafsir';

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
  'so.abduh': "Mahmud Muhammad Abduh (Somalian)",
  'ru.kuliev': "Elmir Kuliev (Russian)",
  'es.cortes': "Julio Cortes (Spanish)",
  'tr.diyanet': "Diyanet Isleri Baskanligi (Turkish)",
  'id.indonesian': "Bahasa (Indonesia)"
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

// Memoized Ayah Card Component (updated with the audio cache indicator)
const AyahCard = React.memo(({ ayah, index, currentlyPlayingAyahIndex, isSelected, toggleAyahSelection, handleAyahClick, currentLanguages, translationNames, ayahRefs, highlightColor, arabicFontSize, translationFontSize, grayTextColor, arabicTextColor, cachedAyahAudio, fontFamily }) => {
  const [showTafsir, setShowTafsir] = useState(false);
  const isCurrentPlaying = currentlyPlayingAyahIndex === index;
  // Safely check if ayah exists before accessing its properties
  const isAudioCached = ayah && cachedAyahAudio && cachedAyahAudio.has(ayah.number); 

  // Use useColorModeValue for card background and text colors
  const cardBg = useColorModeValue('light.cardBg', 'dark.cardBg');
  const cardHoverBg = useColorModeValue('gray.50', 'gray.700');
  const selectedCardBg = useColorModeValue('blue.50', 'blue.800');
  const selectedCardHoverBg = useColorModeValue('blue.100', 'blue.700');
  const dividerColor = useColorModeValue('gray.200', 'gray.600');
  const purpleBg = useColorModeValue('grey.400', 'grey.800');
  const purpleBorder = useColorModeValue('purple.100', 'purple.700');
  const purpleText = useColorModeValue('purple.800', 'purple.300');
  const blueText = useColorModeValue('blue.700', 'blue.300');
  const dotColor = useColorModeValue('green.500', 'green.300'); // Theme-aware color for the dot


  // Filter out any undefined Tafsirs, assuming ayah.tafsirs holds the array from quranapi.pages.dev
  const validTafsirs = ayah.tafsirs ? ayah.tafsirs.filter(tafsir => tafsir.author && tafsir.content) : [];

  if (!ayah) {
    return null; // Return nothing if ayah data is not available
  }

  return (
    <Card
      key={ayah.number}
      p={4}
      bg={isCurrentPlaying ? highlightColor : isSelected ? selectedCardBg : cardBg}
      cursor="pointer"
      onClick={() => toggleAyahSelection(index)}
      ref={(el) => (ayahRefs.current[ayah.numberInSurah] = el)}
      _hover={{ bg: isCurrentPlaying ? highlightColor : isSelected ? selectedCardHoverBg : cardHoverBg }}
    >
      <CardBody>
        <Flex align="center" justify="space-between" mb={2}>
          <Badge colorScheme="purple" fontSize="md" px={2} py={1} borderRadius="md">
            Ayah {ayah.numberInSurah}
          </Badge>
          <Flex align="center" gap={2}>
            {isAudioCached && (
              <Tooltip label="Audio is Cached">
                <Box
                  w="10px"
                  h="10px"
                  borderRadius="full"
                  bg={dotColor}
                />
              </Tooltip>
            )}
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
        </Flex>
        {/* Updated Arabic text styling for bigger, centered text */}
<Text
  fontSize={`${arabicFontSize}px`}
  textAlign="center"
  fontFamily={fontFamily} // This line should use the prop
  my={4}
  lineHeight="tall"
  color={arabicTextColor}
>
  {ayah.text}
</Text>
        <Divider borderColor={dividerColor} /> {/* Use theme-aware divider color */}
        {currentLanguages.map(lang => {
          const translation = ayah.translations.find(t => t.lang === lang);
          return translation ? (
            <Box key={lang} mt={3}>
              <Heading size="sm" color={blueText} mb={1}> {/* Added Heading for translation */}
                {translationNames[lang] || lang}:
              </Heading>
              <Text fontSize={`${translationFontSize}px`} color={grayTextColor}>
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
                <Heading size='xs' textTransform='uppercase' mb={2} color={purpleText}>
                  Tafsirs
                </Heading>
                {validTafsirs.map((tafsir, idx) => (
                  <Box key={idx} mt={3} p={3} borderRadius="md" borderWidth="1px" borderColor={purpleBorder}>
                    <Text fontWeight="semibold" fontSize="md" color={purpleText} mb={1}>
                      <strong>{tafsir.author}:</strong>
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
});

const QuranReaderPage = ({ colorMode, toggleColorMode }) => {
  // State management
  const [selectedSurahData, setSelectedSurahData] = useState(null);
  const [surahs, setSurahs] = useState([]);
  const [surahNumber, setSurahNumber] = useState(null);
  const [surahInfo, setSurahInfo] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isFavoritesOpen, onOpen: onFavoritesOpen, onClose: onFavoritesClose } = useDisclosure();
  const { isOpen: isMemorizationSetsOpen, onOpen: onMemorizationSetsOpen, onClose: onMemorizationSetsClose } = useDisclosure();
  const { isOpen: isMenuOpen, onOpen: onMenuOpen, onClose: onMenuClose } = useDisclosure();
  
  // Initialize state with default values, which will be overwritten by localforage in useEffect
  const [selectedTafsirs, setSelectedTafsirs] = useState(['Ibn Kathir']);
  const [currentLanguages, setCurrentLanguages] = useState(['en.sahih']);
  const [currentReciter, setCurrentReciter] = useState('ar.alafasy');
  const [arabicScript, setArabicScript] = useState('quran-uthmani');
    const [selectedFont, setSelectedFont] = useState('KFGQPC HAFS Uthmanic Script Regular');
  const [arabicFontSize, setArabicFontSize] = useState(45);
  const [translationFontSize, setTranslationFontSize] = useState(16);
  const [favorites, setFavorites] = useState([]);
  const [memorizationSets, setMemorizationSets] = useState([]);
  
  // UPDATED: State to store which surahs are cached
  // **FIXED**: Correctly initializing with `useState(new Set())` instead of just `new Set()`
  const [cachedSurahs, setCachedSurahs] = useState(new Set()); 
  // NEW: State to store which ayah audios are cached
  const [cachedAyahAudio, setCachedAyahAudio] = useState(new Set());
  // NEW: state to hold link parameters
  const [linkParams, setLinkParams] = useState(null);

  // NEW: State for end-of-surah prompt
  const { isOpen: isEndOfSurahPromptOpen, onOpen: onEndOfSurahPromptOpen, onClose: onEndOfSurahPromptClose } = useDisclosure();
  const [timerId, setTimerId] = useState(null);

  // NEW: State for replay loop counter and a new state to track if we are in a replay
  const [replayCount, setReplayCount] = useState(1);
 const [currentReplayLoop, setCurrentReplayLoop] = useState(0);
  // NEW: Ref to store the current replay loop count, to avoid stale closures
  const replayLoopRef = useRef(currentReplayLoop);

  // NEW: Keep the ref in sync with the state
  useEffect(() => {
    replayLoopRef.current = currentReplayLoop;
  }, [currentReplayLoop]);
  
  // NEW: State for the scroll-to-top button
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const btnRef = useRef();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedAyahs, setSelectedAyahs] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [ayahRange, setAyahRange] = useState([1, 1]);

  // Loading states
  const [isLoadingSurahs, setIsLoadingSurahs] = useState(true);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);


  // Audio player refs and state
  const currentSoundRef = useRef(null);
  const nextSoundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlayingAyahIndex, setCurrentlyPlayingAyahIndex] = useState(null);
  const ayahRefs = useRef({});

  const highlightColor = useColorModeValue('yellow.100', 'blue.700');

  // MODIFIED: Reciter ID maps
  // UPDATED: Comprehensive EveryAyah.com reciter list, removing the Quran-Audio-Project one
  const everyAyahReciterMap = {
    'ar.alafasy': 'Alafasy_128kbps',
    'ar.abdulbasit': 'Abdul_Basit_Murattal_192kbps',
    'ar.husary': 'Husary_128kbps',
    'ar.ayyoub': 'Muhammad_Ayyoub_128kbps',
    'ar.qatami': 'Nasser_Alqatami_128kbps',
    'ar.dussary': 'Yasser_Ad-Dussary_128kbps',
    'ar.hani': 'Hani_Rifai_192kbps',
    'ar.tunaiji': 'khalefa_al_tunaiji_64kbps',
    'ar.juhany': 'Abdullaah_3awwaad_Al-Juhaynee_128kbps',
    'ar.shuraym': 'Saood_ash-Shuraym_64kbps',
    'ar.sudais': 'Abdurrahmaan_As-Sudais_64kbps',
    'ar.jaber': 'Ali_Jaber_64kbps',
    'ar.ajmi': 'ahmed_ibn_ali_al_ajamy_128kbps',
    'ibrahim_aldosary': 'warsh/warsh_ibrahim_aldosary_128kbps',
    'ar.ghamadi': 'Ghamadi_40kbps',
    'ar.maher': 'MaherAlMuaiqly128kbps',
    'ar.minshawy': 'Minshawy_Murattal_128kbps',
    'en.walk': 'English/Sahih_Intnl_Ibrahim_Walk_192kbps',
    'ur.khan': 'translations/urdu_shamshad_ali_khan_46kbps',
    'bosnian': 'translations/besim_korkut_ajet_po_ajet',
    'persian': 'translations/Makarem_Kabiri_16Kbps',   
  };
  
  // Theme-aware colors for various elements
  const headingColor = useColorModeValue('blue.600', 'blue.300');
  const surahInfoBg = useColorModeValue('blue.50', 'blue.900');
  const surahInfoTextColor = useColorModeValue('gray.600', 'gray.300');
  const bulkModeBoxBg = useColorModeValue('gray.50', 'gray.700');
  const modalBg = useColorModeValue('white', 'gray.700');
  const modalHeaderBorderColor = useColorModeValue('gray.200', 'gray.600');
  const modalBodyTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('white', 'dark.inputBg');
  const inputBorder = useColorModeValue('gray.200', 'dark.inputBorder');
  const optionBg = useColorModeValue('white', 'dark.optionBg');
  const optionColor = useColorModeValue('gray.800', 'dark.optionColor');
  const grayTextColor = useColorModeValue('gray.600', 'gray.400');
  const arabicTextColor = useColorModeValue('darkGreen', 'gold');
  const settingsButtonBg = useColorModeValue('blue.600', 'blue.600');
  const settingsButtonColor = useColorModeValue('white', 'gray.100');
  const settingsButtonHoverBg = useColorModeValue('gray.600', 'gray.700');
  const mobileMenuButtonBg = useColorModeValue('blue.600', 'blue.500');
  const mobileMenuButtonColor = useColorModeValue('white', 'gray.100');
  const mobileMenuButtonHoverBg = useColorModeValue('gray.600', 'gray.700');

  
    const scrollButtonBg = useColorModeValue('gold', 'gold');
    const scrollButtonColor = useColorModeValue('white', 'white'); // Changed to white for dark mode
    const scrollButtonHoverBg = useColorModeValue('brand.secondary', '#ffffffff');
    const scrollButtonShadow = useColorModeValue('lg', 'lg');
  // NEW: Subtle cached color for the surah list indicator
  const cachedSurahColor = useColorModeValue('gray.400', 'gray.500');

  // New useEffect to handle async data loading with localforage
  useEffect(() => {
    const loadStateFromDb = async () => {
      try {
        const savedLangs = await localforage.getItem('Qlangs');
        if (savedLangs) setCurrentLanguages(savedLangs);

        const savedTafsirs = await localforage.getItem('Qtafsirs');
        if (savedTafsirs) setSelectedTafsirs(savedTafsirs);

        const savedReciter = await localforage.getItem('RecitorSet');
        if (savedReciter) setCurrentReciter(savedReciter);

        const savedScript = await localforage.getItem('arabicScript');
        if (savedScript) setArabicScript(savedScript);

        const savedArabicFontSize = await localforage.getItem('arabicFontSize');
        if (savedArabicFontSize) setArabicFontSize(savedArabicFontSize);

        const savedTranslationFontSize = await localforage.getItem('translationFontSize');
        if (savedTranslationFontSize) setTranslationFontSize(savedTranslationFontSize);

        const savedFavorites = await localforage.getItem('quranFavorites');
        if (savedFavorites) setFavorites(savedFavorites);

        const savedMemorizationSets = await localforage.getItem('quranMemorizationSets');
        if (savedMemorizationSets) setMemorizationSets(savedMemorizationSets);

        // NEW: Load cached audio state
        const savedAudioCache = await localforage.getItem('cachedAyahAudio');
        if (savedAudioCache) {
          setCachedAyahAudio(new Set(savedAudioCache));
        }

      } catch (err) {
        console.error('Error loading state from localforage:', err);
      }
    };
    loadStateFromDb();
  }, []);

  // Updated useEffects to save to localforage
  useEffect(() => {
    localforage.setItem('quranFavorites', favorites);
  }, [favorites]);

  useEffect(() => {
    localforage.setItem('quranMemorizationSets', memorizationSets);
  }, [memorizationSets]);

  useEffect(() => {
    localforage.setItem('Qtafsirs', selectedTafsirs);
  }, [selectedTafsirs]);

  useEffect(() => {
    localforage.setItem('arabicFontSize', arabicFontSize);
  }, [arabicFontSize]);

  useEffect(() => {
    localforage.setItem('translationFontSize', translationFontSize);
  }, [translationFontSize]);

  useEffect(() => {
    localforage.setItem('arabicScript', arabicScript);
  }, [arabicScript]);

  useEffect(() => {
    localforage.setItem('Qlangs', currentLanguages);
  }, [currentLanguages]);

  useEffect(() => {
    localforage.setItem('RecitorSet', currentReciter);
  }, [currentReciter]);

  // NEW: Save the cached ayah audio state whenever it changes
  useEffect(() => {
    localforage.setItem('cachedAyahAudio', Array.from(cachedAyahAudio));
  }, [cachedAyahAudio]);
  
  // NEW: useEffect to handle the scroll event for the "scroll to top" button
  useEffect(() => {
    const handleScroll = () => {
        if (window.scrollY > 200) { // Show the button after scrolling 200px
            setShowScrollToTop(true);
        } else {
            setShowScrollToTop(false);
        }
    };

    window.addEventListener('scroll', handleScroll);

    // Cleanup the event listener on component unmount
    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
}, []);

useEffect(() => {
  if (surahNumber) {
    handleSurahChange(String(surahNumber));
  }
}, [currentLanguages]);

  
  const toggleFavorite = useCallback(async () => {
    if (!surahNumber) return;

    const surahIndex = favorites.findIndex(fav => fav.surahNumber === surahNumber);
    let newFavorites;

    if (surahIndex >= 0) {
      newFavorites = favorites.filter(fav => fav.surahNumber !== surahNumber);
      toast({
        title: "Removed from favorites",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    } else {
      const surah = surahs.find(s => s.number === surahNumber);
      if (surah) {
        newFavorites = [...favorites, {
          surahNumber: surah.number,
          name: surah.name,
          englishName: surah.englishName,
          numberOfAyahs: surah.numberOfAyahs,
          timestamp: Date.now()
        }];
        toast({
          title: "Added to favorites",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    }
    setFavorites(newFavorites);
  }, [surahNumber, favorites, surahs, toast]);

  const isFavorited = useCallback(() => {
    return surahNumber && favorites.some(fav => fav.surahNumber === surahNumber);
  }, [surahNumber, favorites]);

  useEffect(() => {
    return () => {
      if (currentSoundRef.current) {
        currentSoundRef.current.stop();
        currentSoundRef.current.unload();
        currentSoundRef.current = null;
      }
      if (nextSoundRef.current) {
        nextSoundRef.current.unload();
        nextSoundRef.current = null;
      }
    };
  }, []);
  
  // MODIFIED: getAyahAudioUrl function to ONLY use EveryAyah.com
  const getAyahAudioUrl = useCallback((surahNum, ayahNumInSurah, reciterId) => {
    // Check if the reciter is from EveryAyah.com
    const everyAyahFolder = everyAyahReciterMap[reciterId];
    if (everyAyahFolder) {
      const formattedSurahNum = surahNum.toString().padStart(3, '0');
      const formattedAyahNum = ayahNumInSurah.toString().padStart(3, '0');

      return `https://everyayah.com/data/${everyAyahFolder}/${formattedSurahNum}${formattedAyahNum}.mp3`;
    }

    return '';
  }, [everyAyahReciterMap]);

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

  const handleAyahClick = useCallback(async (index, customPlaylistIndices = null) => {
    console.log(`[LOG] handleAyahClick called for index: ${index}`);
    if (!selectedSurahData) {
      console.warn('[WARN] No surah data available in handleAyahClick.');
      return;
    }

    const ayah = selectedSurahData[index];

    if (!ayah || typeof ayah.numberInSurah === 'undefined' || ayah.numberInSurah === null) {
      console.error(`[ERROR] Invalid Ayah object or numberInSurah at index ${index}. Skipping playback.`);
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
    console.log(`[LOG] Playing audio for Surah ${surahNumber}, Ayah ${ayah.numberInSurah}.`);
    const newSrc = getAyahAudioUrl(surahNumber, ayah.numberInSurah, currentReciter);

    if (!newSrc) {
      console.warn('[WARN] No audio URL available for this ayah. Skipping playback.');
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
      console.log('[LOG] Toggling pause/stop for current ayah.');
      stopAudio();
    } else {
      stopAudio();

      currentSoundRef.current = new Howl({
        src: [newSrc],
        html5: true,
        // NEW: Add the onload callback to update the cached audio state
        onload: () => {
            console.log(`[LOG] Audio for Ayah ${ayah.numberInSurah} loaded.`);
            // Correctly update the state to reflect that this ayah's audio is now cached
            setCachedAyahAudio(prev => new Set(prev).add(ayah.number));
        },
        onend: () => handleAudioEnd(index, customPlaylistIndices),
        onplay: () => {
          const nextIndexForPreload = customPlaylistIndices
            ? customPlaylistIndices[customPlaylistIndices.indexOf(index) + 1]
            : index + 1;
          preloadNextAyah(nextIndexForPreload);
        },
        onplayerror: (id, error) => {
          console.error(`[ERROR] Error playing audio for Ayah ${ayah.numberInSurah}:`, error);
          stopAudio();
        },
        onloaderror: async (id, error) => {
          console.error(`[ERROR] Error loading audio for Ayah ${ayah.numberInSurah} (URL: ${newSrc}):`, error);

          // Force a stop and a retry.
          // This handles potential cache corruption by forcing a new network request
          // after the current attempt fails.
          stopAudio();
          setTimeout(() => {
            console.log(`[LOG] Retrying download for Ayah ${ayah.numberInSurah}...`);
            handleAyahClick(index, customPlaylistIndices);
          }, 1000);
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
  }, [selectedSurahData, surahNumber, currentReciter, currentlyPlayingAyahIndex, isPlaying, stopAudio, getAyahAudioUrl, preloadNextAyah, setCachedAyahAudio]);


  // NEW: Function to play the next surah
  const playNextSurah = useCallback(() => {
    console.log('[LOG] playNextSurah called.');
    onEndOfSurahPromptClose();
    // Clear any existing timer
    if (timerId) {
      clearTimeout(timerId);
      setTimerId(null);
    }
  
    // Find the next surah
    const nextSurah = surahs.find(s => s.number === (surahNumber + 1));
    if (nextSurah) {
      console.log(`[LOG] Found next surah: ${nextSurah.englishName}. Setting surah number.`);
      setSurahNumber(nextSurah.number);
      toast({
        title: `Playing next surah: ${nextSurah.englishName}`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } else {
      console.log('[LOG] End of Quran reached.');
      toast({
        title: "End of Quran",
        description: "You have reached the last surah.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [surahNumber, surahs, toast, onEndOfSurahPromptClose, timerId]);
  
  // MODIFIED: Function to replay the current surah with a loop count
  const replayCurrentSurah = useCallback((loopCount) => {
    console.log(`[LOG] replayCurrentSurah called with loopCount: ${loopCount}`);
    onEndOfSurahPromptClose();
    // Clear any existing timer
    if (timerId) {
      clearTimeout(timerId);
      setTimerId(null);
    }
    // Set the loop counter directly to the requested count.
    setCurrentReplayLoop(loopCount);
    // Restart audio from the beginning of the surah
    handleAyahClick(0);
  }, [handleAyahClick, onEndOfSurahPromptOpen, timerId]);
  

const handleAudioEnd = useCallback((currentIndex, customPlaylistIndices = null) => {
    console.log(`[LOG] handleAudioEnd called for index: ${currentIndex}. currentReplayLoop (from ref): ${replayLoopRef.current}`);
    if (!selectedSurahData || currentIndex === null) {
      console.warn("[WARN] handleAudioEnd called with invalid data. Stopping audio.");
      stopAudio();
      return;
    }

    const isEndOfPlaylistOrSurah = customPlaylistIndices
      ? (customPlaylistIndices.indexOf(currentIndex) === customPlaylistIndices.length - 1)
      : (currentIndex === selectedSurahData.length - 1);
    
    console.log(`[LOG] isEndOfPlaylistOrSurah: ${isEndOfPlaylistOrSurah}`);

    // If we're not at the end of the current playlist or surah, play the next ayah
    if (!isEndOfPlaylistOrSurah) {
      console.log('[LOG] Playing next ayah in sequence.');
      let nextIndex;
      if (customPlaylistIndices) {
        const currentPos = customPlaylistIndices.indexOf(currentIndex);
        nextIndex = customPlaylistIndices[currentPos + 1];
      } else {
        nextIndex = currentIndex + 1;
      }

      const nextAyah = selectedSurahData[nextIndex];
      if (!nextAyah) {
        console.error(`[ERROR] Next ayah at index ${nextIndex} is undefined. Ending playback.`);
        stopAudio();
        return;
      }

      // Check if we have a preloaded sound
      if (nextSoundRef.current) {
        console.log(`[LOG] Using preloaded audio for Ayah ${nextAyah.numberInSurah}.`);
        if (currentSoundRef.current) {
          currentSoundRef.current.unload();
        }
        currentSoundRef.current = nextSoundRef.current;
        nextSoundRef.current = null;

        currentSoundRef.current.on('end', () => handleAudioEnd(nextIndex, customPlaylistIndices));
        currentSoundRef.current.on('play', () => {
          const nextAyahToPreloadIndex = customPlaylistIndices
            ? customPlaylistIndices[customPlaylistIndices.indexOf(nextIndex) + 1]
            : nextIndex + 1;
          preloadNextAyah(nextAyahToPreloadIndex);
        });
        currentSoundRef.current.play();
        setCurrentlyPlayingAyahIndex(nextIndex);
        setIsPlaying(true);
        const nextAyahElement = ayahRefs.current[nextAyah.numberInSurah];
        if (nextAyahElement) {
          nextAyahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        // If preload failed, try to play the next ayah directly
        console.log('[LOG] Preload failed or not ready. Trying direct play.');
        setTimeout(() => {
          handleAyahClick(nextIndex, customPlaylistIndices);
        }, 50);
      }
    } else {
      console.log('[LOG] Reached the end of the surah or playlist.');
      stopAudio();
      
      // Check if we are still in a replay loop using the ref
      if (replayLoopRef.current > 1) {
        console.log(`[LOG] Replay loop continues. Replaying. New counter: ${replayLoopRef.current - 1}`);
        setCurrentReplayLoop(prev => prev - 1);
        handleAyahClick(customPlaylistIndices ? customPlaylistIndices[0] : 0, customPlaylistIndices);
      } else if (replayLoopRef.current === -1) {
        console.log(`[LOG] Replaying indefinitely.`);
        handleAyahClick(customPlaylistIndices ? customPlaylistIndices[0] : 0, customPlaylistIndices);
      } else {
        // Replay is finished or not active, so we can stop and show the prompt
        console.log('[LOG] Replay finished. Showing end-of-surah prompt.');
        setCurrentReplayLoop(0); // Reset the counter
        onEndOfSurahPromptOpen();
      }
    }
  }, [selectedSurahData, handleAyahClick, stopAudio, preloadNextAyah, onEndOfSurahPromptOpen]); // NOTE: currentReplayLoop is no longer a dependency


  // Main function for fetching Surah data, updated to use a cache-first approach
  const handleSurahChange = useCallback(async (surahNum, script = arabicScript) => {
    setErrorMessage(null);
    const selectedSurah = surahs.find((surah) => surah.number === parseInt(surahNum));

    if (!selectedSurah) {
        setSelectedSurahData(null);
        setSurahInfo(null);
        // Only reset ayah range and selected ayahs if we are not loading from a link
        setAyahRange([1, 1]);
        setSelectedAyahs([]);
        setIsBulkMode(false);
        setIsLoadingAyahs(false);
        return;
    }

    setIsLoadingAyahs(true);
    stopAudio();

    try {
        const cacheKey = `surah-${surahNum}-script-${script}-langs-${currentLanguages.join(',')}-tafsirs-${selectedTafsirs.join(',')}`;
        let cachedData = await localforage.getItem(cacheKey);

        let ayahsToSet;
        let infoToSet;

        if (linkParams) {
          console.log(`[LOG] Detected shared link. Attempting to load memorization set for Surah ${surahNum}.`);
        }

        if (cachedData) {
            console.log(`[CACHE LOG] Found cached data for surah ${surahNum}. Using it.`);
            ayahsToSet = cachedData.ayahs;
            infoToSet = cachedData.info;
        } else {
            console.log(`[API FETCH LOG] No cached data for surah ${surahNum}. Fetching from API.`);
            // Fetch data from API if not in cache
            const fetchPromises = currentLanguages.map(lang =>
                axios.get(`${API_BASE_URL}/surah/${surahNum}/${lang}`)
            );
            const arabicResponse = await axios.get(`${API_BASE_URL}/surah/${surahNum}/${script}`);
            const arabicAyahs = arabicResponse.data.data.ayahs;
            const surahInfoFromApi = arabicResponse.data.data;

            const translationResponses = await Promise.all(fetchPromises);
            
            console.log(`[API FETCH LOG] Fetching tafsir data for ${arabicAyahs.length} ayahs.`);
            const ayahTafsirPromises = arabicAyahs.map(async (ayah) => {
                if (selectedTafsirs.length > 0) {
                    const tafsirCacheKey = `tafsir-${surahNum}-${ayah.numberInSurah}`;
                    let cachedTafsir = await localforage.getItem(tafsirCacheKey);

                    if (cachedTafsir) {
                        return cachedTafsir.filter(tafsir => selectedTafsirs.includes(tafsir.author));
                    } else {
                        try {
                            const tafsirResponse = await axios.get(`${API_TAFSIR_BASE_URL}/${surahNum}_${ayah.numberInSurah}.json`);
                            const fetchedTafsirs = tafsirResponse.data.tafsirs;
                            await localforage.setItem(tafsirCacheKey, fetchedTafsirs);
                            return fetchedTafsirs.filter(tafsir => selectedTafsirs.includes(tafsir.author));
                        } catch (tafsirError) {
                            console.warn(`Could not fetch tafsir for ${surahNum}:${ayah.numberInSurah}:`, tafsirError);
                            return [];
                        }
                    }
                }
                return [];
            });
            
            console.log('[API FETCH LOG] Waiting for all tafsir promises to resolve...');
            const allAyahTafsirs = await Promise.all(ayahTafsirPromises);
            console.log('[API FETCH LOG] All tafsir promises resolved. Merging data.');

            ayahsToSet = arabicAyahs.map((ayah, idx) => {
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
                    tafsirs: allAyahTafsirs[idx]
                };
            });
            infoToSet = surahInfoFromApi;
            
            // Store the full surah data in cache
            await localforage.setItem(cacheKey, {
                ayahs: ayahsToSet,
                info: infoToSet
            });
            // Update the cached surahs set after a successful download
            setCachedSurahs(prev => new Set(prev).add(parseInt(surahNum)));
            console.log(`[CACHE LOG] Successfully fetched and cached surah ${surahNum}.`);
        }

        // Set all state at once after data is ready
        setSelectedSurahData(ayahsToSet);
        setSurahInfo(infoToSet);

        // This is a key change: only reset if not a link.
        // The separate effect will handle the linkParams logic after this.
        if (!linkParams) {
          setAyahRange([1, infoToSet.numberOfAyahs]);
          setSelectedAyahs([]);
          setIsBulkMode(false);
        }
        
    } catch (error) {
        console.error('Error fetching or loading Surah details:', error);
        setErrorMessage('Failed to load Surah details. Please try again.');
        setSelectedSurahData(null);
    } finally {
        setIsLoadingAyahs(false);
        console.log('[LOADING LOG] Finished loading process for Surah.');
    }
  }, [currentLanguages, surahs, stopAudio, selectedTafsirs, arabicScript, linkParams]); // Added linkParams to dependencies

  const toggleAyahSelection = useCallback((index) => {
    const ayahToSelect = selectedSurahData[index];
    const isSelected = selectedAyahs.some(ayah => ayah.number === ayahToSelect.number);

    if (isSelected) {
      setSelectedAyahs(selectedAyahs.filter(ayah => ayah.number !== ayahToSelect.number));
    } else {
      setSelectedAyahs([...selectedAyahs, ayahToSelect]);
    }
  }, [selectedAyahs, selectedSurahData]);

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

  // Updated fetchSurahs to use a cache-first approach
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const cachedSurahs = await localforage.getItem('surahs');
        if (cachedSurahs) {
          setSurahs(cachedSurahs);
        } else {
          const response = await axios.get(`${API_BASE_URL}/surah`);
          const surahList = response.data.data;
          await localforage.setItem('surahs', surahList);
          setSurahs(surahList);
        }
      } catch (error) {
        console.error('Error fetching surahs:', error);
        setErrorMessage('Failed to load surah list. Please check your connection.');
      } finally {
        setIsLoadingSurahs(false);
      }
    };
    fetchSurahs();
  }, []);

  // MODIFIED: This useEffect now checks for the specific cache key to be more accurate
  useEffect(() => {
    const updateCachedSurahs = async () => {
      if (surahs.length > 0) {
        const cachedSurahNumbers = new Set();
        for (const surah of surahs) {
          const cacheKey = `surah-${surah.number}-script-${arabicScript}-langs-${currentLanguages.join(',')}-tafsirs-${selectedTafsirs.join(',')}`;
          const cachedData = await localforage.getItem(cacheKey);
          if (cachedData) {
            cachedSurahNumbers.add(surah.number);
          }
        }
        setCachedSurahs(cachedSurahNumbers);
      }
    };
    // Re-run this effect whenever surahs, selected languages, tafsirs, or script changes
    updateCachedSurahs();
  }, [surahs, currentLanguages, selectedTafsirs, arabicScript]);

  useEffect(() => {
    stopAudio();
  }, [currentReciter, stopAudio]);

  // NEW: This is the primary effect that triggers data fetching
  useEffect(() => {
    console.log(`[LOG] Main useEffect triggered. surahNumber: ${surahNumber}, currentReplayLoop: ${currentReplayLoop}`);
    // MODIFIED: Added a check to prevent re-fetching during a replay
    if (currentReplayLoop > 0) {
        console.log('[REPLAY BLOCK] Replay in progress, skipping data fetch.');
        return;
    }

    if (surahNumber) {
      // Prevent redundant calls if the surahNumber is already the same
      if (selectedSurahData && surahInfo && surahInfo.number === surahNumber) {
        console.log(`[LOG] Surah ${surahNumber} is already loaded. Skipping re-fetch.`);
        return;
      }
      console.log(`[LOG] Calling handleSurahChange for surahNumber: ${surahNumber}.`);
      handleSurahChange(String(surahNumber));
    }
  }, [surahNumber, currentLanguages, selectedTafsirs, arabicScript, handleSurahChange, currentReplayLoop]);


  // NEW: This useEffect handles URL parameters and sets the state, which triggers the primary effect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const surah = params.get('surah');
    const start = params.get('start');
    const end = params.get('end');
    
    if (surah && start && end && surahs.length > 0) {
      const surahNum = parseInt(surah);
      const startAyah = parseInt(start);
      const endAyah = parseInt(end);

      if (!isNaN(surahNum) && !isNaN(startAyah) && !isNaN(endAyah)) {
        const selectedSurah = surahs.find(s => s.number === surahNum);
        if (selectedSurah) {
          console.log(`[LOG] Found URL parameters: surah=${surahNum}, start=${startAyah}, end=${endAyah}.`);
          // Set the state which will trigger the primary useEffect
          setSurahNumber(surahNum);
          setLinkParams({ surahNum, startAyah, endAyah });
          // Clear URL search params to clean up the URL bar
          navigate(location.pathname, { replace: true });
        } else {
          console.error("[ERROR] Shared link surah number not found in surah list.");
        }
      }
    }
  }, [location.search, surahs, navigate, location.pathname]);

  // FIX: A separate useEffect to apply link params after data is loaded
  useEffect(() => {
    if (linkParams && selectedSurahData && surahInfo && surahInfo.number === linkParams.surahNum) {
      console.log(`[LOG] Applying link parameters to loaded Surah data.`);
      // Set the ayah range and bulk mode
      setAyahRange([linkParams.startAyah, linkParams.endAyah]);
      setIsBulkMode(true);
      // Filter and set the selected ayahs based on the range
      const newSelectedAyahs = selectedSurahData.filter(ayah =>
          ayah.numberInSurah >= linkParams.startAyah && ayah.numberInSurah <= linkParams.endAyah
      );
      setSelectedAyahs(newSelectedAyahs);
      
      toast({
        title: `Loaded shared memorization set for ${surahInfo.englishName} (${linkParams.startAyah}-${linkParams.endAyah})`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      // Reset link params after they have been processed
      setLinkParams(null);
    }
  }, [linkParams, selectedSurahData, surahInfo, toast]);

  // NEW: useEffect to handle the end-of-surah timer
  useEffect(() => {
    if (isEndOfSurahPromptOpen) {
      const id = setTimeout(() => {
        playNextSurah();
      }, 5000);
      setTimerId(id);
    } else {
      if (timerId) {
        clearTimeout(timerId);
        setTimerId(null);
      }
    }
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [isEndOfSurahPromptOpen, playNextSurah, timerId]);

  const handleSaveSelection = useCallback(async () => {
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

    setMemorizationSets(prevSets => {
      const updatedSets = [...prevSets, newSet];
      localforage.setItem('quranMemorizationSets', updatedSets);
      return updatedSets;
    });

    toast({
      title: "Ayah range saved!",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  }, [selectedAyahs, surahInfo, toast]);

  // NEW: Function to generate a shareable link
  const generateShareableLink = useCallback((surahNumber, start, end) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?surah=${surahNumber}&start=${start}&end=${end}`;
  }, []);

  const handleShareSet = useCallback((set) => {
    const link = generateShareableLink(set.surahNumber, set.rangeStart, set.rangeEnd);
    navigator.clipboard.writeText(link).then(() => {
      toast({
        title: "Link copied to clipboard!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }).catch(err => {
      console.error('Failed to copy link:', err);
      toast({
        title: "Failed to copy link",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    });
  }, [generateShareableLink, toast]);
  
  // NEW: Function to handle direct sharing of the selected range
  const handleDirectShare = useCallback(() => {
    if (!surahInfo || !ayahRange || ayahRange[0] === null || ayahRange[1] === null) {
        toast({
            title: "Invalid ayah range",
            description: "Please select a valid range of ayahs to share.",
            status: "warning",
            duration: 3000,
            isClosable: true,
        });
        return;
    }
    const link = generateShareableLink(surahInfo.number, ayahRange[0], ayahRange[1]);
    navigator.clipboard.writeText(link).then(() => {
        toast({
            title: "Link copied!",
            description: `Shareable link for ${surahInfo.englishName} (${ayahRange[0]}-${ayahRange[1]}) copied to clipboard.`,
            status: "success",
            duration: 5000,
            isClosable: true,
        });
    }).catch(err => {
        console.error('Failed to copy link:', err);
        toast({
            title: "Failed to copy link",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
    });
  }, [surahInfo, ayahRange, generateShareableLink, toast]);

  const loadSavedSet = useCallback(async (set) => {
    onMemorizationSetsClose();
    setSurahNumber(set.surahNumber);
    setLinkParams({ surahNum: set.surahNumber, startAyah: set.rangeStart, endAyah: set.rangeEnd });


    toast({
      title: `Loaded ${set.surahName} Ayahs ${set.rangeStart}-${set.rangeEnd}`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  }, [onMemorizationSetsClose, setSurahNumber, setLinkParams, toast]);

  const loadFavoriteSurah = useCallback(async (surah) => {
    onFavoritesClose();
    setIsBulkMode(false);
    setSurahNumber(surah.surahNumber);
    // NEW: Clear any pending link parameters when a favorite is loaded
    setLinkParams(null);

    toast({
      title: `Loaded favorite Surah: ${surah.englishName}`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  }, [onFavoritesClose, setSurahNumber, setLinkParams, toast]);

  const displaySelectedTexts = useCallback(() => {
    if (selectedAyahs.length === 0) {
      toast({
        title: "No ayahs selected",
        description: "Please select ayahs to display.",
        status: "warning",
      isClosable: true,
      });
      return;
    }
    const sortedSelectedAyahs = [...selectedAyahs].sort((a, b) => a.numberInSurah - b.numberInSurah);

    navigate('/tafsirs', {
      state: {
        selectedAyahsData: sortedSelectedAyahs,
        surahInfo: surahInfo
      }
    });
  }, [selectedAyahs, surahInfo, navigate, toast]);

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

  return (
    <>
      <Box w="full" minH="100vh" py={6} px={{ base: 2, md: 4 }}>
        {/* Header Section - Updated for better mobile layout */}
        <Flex
          justify="space-between"
          align="center"
          mb={6}
          flexDirection="row"
          gap={4}
        >
          <Heading size="xl" color={headingColor}>
            Quran Reader
          </Heading>
          
          {/* Mobile Theme Toggle and Menu */}
          <Flex display={{ base: 'flex', md: 'none' }} alignItems="center" gap={2}>
            {/* Theme Toggle Button */}
            <IconButton
              icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
              onClick={toggleColorMode}
              aria-label="Toggle theme"
              // Start of change: Use a dynamic color based on the current mode
              color={colorMode === 'dark' ? 'yellow.400' : 'gray.500'}
              variant="ghost"
            />
            {/* Mobile Menu Button */}
            <IconButton
              icon={<MdMenu />}
              aria-label="Open Menu"
              onClick={onMenuOpen}
              bg={mobileMenuButtonBg}
              color={mobileMenuButtonColor}
              _hover={{ bg: mobileMenuButtonHoverBg }}
            />
          </Flex>

          {/* Desktop/Tablet Menu - visible on screens >= md */}
          <Flex display={{ base: 'none', md: 'flex' }} wrap="wrap" justify="flex-end" gap={2} alignItems="center">
            {/* Theme Toggle Button */}
            <IconButton
              icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
              onClick={toggleColorMode}
              aria-label="Toggle theme"
              // Start of change: Use a dynamic color based on the current mode
              color={colorMode === 'dark' ? 'yellow.400' : 'gray.500'}
              variant="ghost"
            />
            <Tooltip label="Bulk Selection Mode">
              <IconButton
                icon={isBulkMode ? <MdBookmark /> : <MdBookmarkBorder />}
                onClick={() => {
                  setIsBulkMode(!isBulkMode);
                  setSelectedAyahs([]);
                  stopAudio();
                  if (surahInfo) {
                    setAyahRange([1, surahInfo.numberOfAyahs]);
                  } else {
                    setAyahRange([1, 1]);
                  }
                }}
                colorScheme={isBulkMode ? "blue" : "gray"}
                aria-label="Bulk mode"
              />
            </Tooltip>
            <Tooltip label="View Favorites">
              <IconButton
                icon={<FaHeart color={favorites.length > 0 ? "red" : "gray"} />}
                onClick={onFavoritesOpen}
                aria-label="Favorites"
              />
            </Tooltip>
            <Tooltip label="View Saved Memorization Sets">
              <IconButton
                icon={<FaRegClock color={memorizationSets.length > 0 ? "green" : "gray"} />}
                onClick={onMemorizationSetsOpen}
                aria-label="Saved Memorization Sets"
              />
            </Tooltip>
            <Button
              leftIcon={<MdSettings />}
              onClick={onOpen}
              bg={settingsButtonBg}
              color={settingsButtonColor}
              _hover={{ bg: settingsButtonHoverBg }}
            >
              Settings
            </Button>
          </Flex>
        </Flex>

        {/* Mobile Menu Drawer */}
        <Drawer isOpen={isMenuOpen} placement="right" onClose={onMenuClose}>
          <DrawerOverlay />
          <DrawerContent bg={modalBg}>
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px" borderColor={modalHeaderBorderColor}>Menu</DrawerHeader>
            <DrawerBody>
              <Stack spacing={4}>
                <Button
                  leftIcon={isBulkMode ? <MdBookmark /> : <MdBookmarkBorder />}
                  onClick={() => {
                    setIsBulkMode(!isBulkMode);
                    setSelectedAyahs([]);
                    stopAudio();
                    if (surahInfo) {
                      setAyahRange([1, surahInfo.numberOfAyahs]);
                    } else {
                      setAyahRange([1, 1]);
                    }
                    onMenuClose();
                  }}
                  colorScheme={isBulkMode ? "blue" : "gray"}
                  aria-label="Bulk Selection Mode"
                  justifyContent="flex-start"
                >
                  Bulk Selection Mode
                </Button>
                <Button
                  leftIcon={<FaHeart color={favorites.length > 0 ? "red" : "gray"} />}
                  onClick={() => { onFavoritesOpen(); onMenuClose(); }}
                  justifyContent="flex-start"
                >
                  Favorites
                </Button>
                <Button
                  leftIcon={<FaRegClock color={memorizationSets.length > 0 ? "green" : "gray"} />}
                  onClick={() => { onMemorizationSetsOpen(); onMenuClose(); }}
                  justifyContent="flex-start"
                >
                  Saved Sets
                </Button>
                <Button
                  leftIcon={<MdSettings />}
                  onClick={() => { onOpen(); onMenuClose(); }}
                  bg={settingsButtonBg}
                  color={settingsButtonColor}
                  _hover={{ bg: settingsButtonHoverBg }}
                  justifyContent="flex-start"
                >
                  Settings
                </Button>
              </Stack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>


        {/* Surah Selection Card - Updated for better mobile layout */}
        <Card mb={6} bg={modalBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Grid
              templateColumns={{ base: "1fr", md: "2fr 3fr" }}
              gap={{ base: 4, md: 6 }}
              alignItems="center"
            >
              <GridItem>
                <FormControl>
                  <FormLabel color={modalBodyTextColor}>Select Surah</FormLabel>
                  <Select
                    onChange={(e) => setSurahNumber(parseInt(e.target.value))}
                    placeholder="Choose a Surah"
                    size="lg"
                    variant="filled"
                    value={surahNumber || ""}
                    focusBorderColor="brand.500"
                    bg={inputBg}
                    borderColor={inputBorder}
                    color={optionColor}
                  >
                    {surahs.map((surah) => (
                      <option
                        value={surah.number}
                        key={surah.number}
                      >
                         {/* UPDATED: Use a dot (•) instead of a tick (✓) for the cached indicator */}
                         {cachedSurahs.has(surah.number) ? '• ' : ''}{surah.number}. {surah.englishName} ({surah.name})
                      </option>
                    ))}
                  </Select>
                  {surahInfo && (
                    <Box mt={4} p={3} bg={surahInfoBg} borderRadius="md">
                      <Text fontWeight="bold" color={optionColor}>
                        {surahInfo.englishNameTranslation}
                      </Text>
                      <Text fontSize="sm" color={surahInfoTextColor}>
                        Revelation Type: {surahInfo.revelationType}
                      </Text>
                      <Text fontSize="sm" color={surahInfoTextColor}>
                        Number of Ayahs: {surahInfo.numberOfAyahs}
                      </Text>
                    </Box>
                  )}
                </FormControl>
              </GridItem>
              <GridItem>
                <Flex direction="column" gap={4}>
                  <Wrap spacing={2} justify={{ base: 'center', md: 'flex-start' }}>
                    {currentLanguages.map(lang => (
                      <WrapItem key={lang}>
                        <Tag size="md" colorScheme="blue" borderRadius="full">
                          <TagLeftIcon as={FaLanguage} />
                          <TagLabel>{translationNames[lang] || lang}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                  <Flex wrap="wrap" gap={2} justify={{ base: 'center', md: 'flex-start' }}>
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
                        {/* NEW: Direct Share Button */}
                        <Tooltip label="Copy shareable link for this range">
                          <IconButton
                            icon={<FaShare />}
                            size="sm"
                            colorScheme="teal"
                            onClick={handleDirectShare}
                            aria-label="Share memorization set"
                          />
                        </Tooltip>
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
            <Text ml={4} fontSize="lg" color={modalBodyTextColor}>Loading Ayahs...</Text>
          </Center>
        ) : errorMessage && !selectedSurahData ? (
          <Text color="red.500" textAlign="center" fontSize="lg">{errorMessage}</Text>
        ) : selectedSurahData && (
          <Stack spacing={4}>

{isBulkMode && surahInfo && surahInfo.numberOfAyahs > 0 && (
  <Box p={4} borderWidth="1px" borderRadius="lg" mb={4} bg={bulkModeBoxBg} borderColor={borderColor}>
    <FormLabel color={modalBodyTextColor}>
      Select Ayah Range ({ayahRange[0]} to {ayahRange[1]})
    </FormLabel>
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

      {/* Tooltip for start thumb */}
      <Tooltip
        hasArrow
        bg='green.500'
        color='white'
        placement='top'
        label={`${ayahRange[0]}`}
        isOpen
      >
        <RangeSliderThumb index={0} />
      </Tooltip>

      {/* Tooltip for end thumb */}
      <Tooltip
        hasArrow
        bg='green.500'
        color='white'
        placement='top'
        label={`${ayahRange[1]}`}
        isOpen
      >
        <RangeSliderThumb index={1} />
      </Tooltip>
    </RangeSlider>
  </Box>
)}
            {/* The corrected code for the ayah rendering loop starts here */}
            {selectedSurahData
              .filter(ayah => {
                // Only filter if bulk mode is active, otherwise show all
                return isBulkMode ?
                  (ayah.numberInSurah >= ayahRange[0] && ayah.numberInSurah <= ayahRange[1]) :
                  true;
              })
              .map((ayah, index) => {
              const isSelected = selectedAyahs.some(sAyah => sAyah.number === ayah.number);
              return (
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
                  arabicFontSize={arabicFontSize}
                  translationFontSize={translationFontSize}
                  grayTextColor={grayTextColor}
                  arabicTextColor={arabicTextColor}
                  // NEW: Pass the cachedAyahAudio set to the AyahCard
                  cachedAyahAudio={cachedAyahAudio}
                          arabicScript={arabicScript}
        fontFamily={selectedFont} // Pass the selected font here
                />
              );
            })}
            {/* The corrected code for the ayah rendering loop ends here */}
          </Stack>
        )}
      </Box>
      
      {/* NEW: Scroll to Top Button */}


  {showScrollToTop && (
                <IconButton
                    aria-label="Scroll to top"
                    icon={<FaArrowUp />}
                    onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    position="fixed"
                    bottom="20px"
                    right="20px"
                    size="lg"
                    bg={scrollButtonBg}
                    color={scrollButtonColor}
                    _hover={{ bg: scrollButtonHoverBg }}
                    zIndex="99999"
                    boxShadow={scrollButtonShadow}
                />
        )}

      {/* Settings Drawer */}
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        finalFocusRef={btnRef}
        size={{ base: 'full', md: 'md' }}
      >
        <DrawerOverlay />
        <DrawerContent bg={modalBg}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={modalHeaderBorderColor}>App Settings</DrawerHeader>

          <DrawerBody>
            <Stack spacing={4}>
              {/* Theme Toggle in Settings */}
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel htmlFor="color-mode-toggle" mb="0" color={modalBodyTextColor}>
                  Toggle Dark Mode
                </FormLabel>
                <IconButton
                  id="color-mode-toggle"
                  aria-label="Toggle theme"
                  icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
                  onClick={toggleColorMode}
                  variant="ghost"
                  // Start of change: Use a dynamic color based on the current mode
                  color={colorMode === 'dark' ? 'yellow.400' : 'gray.500'}
                  size="md"
                />
              </FormControl>

              {/* Reciter Selection - Now only with EveryAyah.com reciters */}
              <FormControl>
                <FormLabel htmlFor="reciter-select" color={modalBodyTextColor}>Select Reciter</FormLabel>
                <Select
                  id="reciter-select"
                  value={currentReciter}
                  onChange={(e) => {
                    setCurrentReciter(e.target.value);
                    toast({
                      title: "Reciter updated",
                      status: "success",
                      duration: 1500,
                      isClosable: true,
                    });
                  }}
                  bg={inputBg}
                  borderColor={inputBorder}
                  color={optionColor}
                >
                  <option value="ar.alafasy" style={{ backgroundColor: optionBg, color: optionColor }}>Mishary Rashid Alafasy</option>
                  <option value="ar.abdulbasit" style={{ backgroundColor: optionBg, color: optionColor }}>Abdul Baset Abdul Samad</option>
                  <option value="ar.husary" style={{ backgroundColor: optionBg, color: optionColor }}>Mahmoud Khalil Al-Husary</option>
                  <option value="ar.ayyoub" style={{ backgroundColor: optionBg, color: optionColor }}>Muhammad Ayyoub</option>
                  <option value="ar.qatami" style={{ backgroundColor: optionBg, color: optionColor }}>Nasser Al Qatami</option>
                  <option value="ar.dussary" style={{ backgroundColor: optionBg, color: optionColor }}>Yasser Al-Dussari</option>
                  <option value="ar.hani" style={{ backgroundColor: optionBg, color: optionColor }}>Hani Ar-Rifai</option>
                  <option value="ar.tunaiji" style={{ backgroundColor: optionBg, color: optionColor }}>Khalifa Al Tunaiji</option>
                  <option value="ar.juhany" style={{ backgroundColor: optionBg, color: optionColor }}>Abdullah Awad Al-Juhany</option>
                  <option value="ar.shuraym" style={{ backgroundColor: optionBg, color: optionColor }}>Saud Al-Shuraim</option>
                  <option value="ar.sudais" style={{ backgroundColor: optionBg, color: optionColor }}>Abdul Rahman Al-Sudais</option>
                  <option value="ar.jaber" style={{ backgroundColor: optionBg, color: optionColor }}>Ali Jaber</option>
                  <option value="ar.ajmi" style={{ backgroundColor: optionBg, color: optionColor }}>Ahmed Al-Ajmi</option>
                  <option value="ibrahim_aldosary" style={{ backgroundColor: optionBg, color: optionColor }}>(Warsh) Ibrahim Al-Dosary </option>
                  <option value="ar.ghamadi" style={{ backgroundColor: optionBg, color: optionColor }}>Al Ghamadi</option>
                  <option value="ar.maher" style={{ backgroundColor: optionBg, color: optionColor }}>Maher Al Muaiqly</option>
                  <option value="ar.minshawy" style={{ backgroundColor: optionBg, color: optionColor }}>Minshawy Murattal</option>
                  <option value="en.walk" style={{ backgroundColor: optionBg, color: optionColor }}>English - Ibrahim Walk</option>
                  <option value="ur.khan" style={{ backgroundColor: optionBg, color: optionColor }}>Urdu - Shamshad ali khan</option>
                  <option value="bosnian" style={{ backgroundColor: optionBg, color: optionColor }}>Bosnian - Besim Korkut</option>
                  <option value="persian" style={{ backgroundColor: optionBg, color: optionColor }}>Persian - Translated by Makarem Recited by Kabiri</option>
                </Select>
              </FormControl>

              {/* Arabic Script Selection */}
              <FormControl>
                <FormLabel color={modalBodyTextColor}>Arabic Script</FormLabel>
<Select
    value={selectedFont}
    onChange={(e) => {
        const newFont = e.target.value;
        setSelectedFont(newFont);
        
        // This is a key part: use the font selection to also change the script
        if (newFont === "KFGQPC Nastaleeq") {
            setArabicScript("quran-indopak");
        } else if (newFont === "Me Quran Volt") { // ADDED THIS CONDITION
            setArabicScript("me-quran"); // Sets the correct script for this font
        } else {
            setArabicScript("quran-uthmani"); // Default to Uthmani for other fonts
        }
        
        toast({
            title: "Font updated",
            status: "success",
            duration: 1500,
            isClosable: true,
        });
    }}
    bg={inputBg}
    borderColor={inputBorder}
    color={optionColor}
>
    <option value="KFGQPC HAFS Uthmanic Script Regular">Hafs Uthmanic Script</option>
    <option value="KFGQPC Uthman Taha Naskh">Uthman Taha Naskh</option>
    <option value="KFGQPC Nastaleeq">IndoPak Nastaleeq</option>
    <option value="Me Quran Volt">Simple Madani</option>
</Select>
              </FormControl>

{/* Translation Language Selection */}
<FormControl>
  <FormLabel color={modalBodyTextColor}>Select Translations</FormLabel>
  <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={3}>
    {Object.keys(translationNames).map(lang => (
      <GridItem key={lang}>
        <Checkbox
          isChecked={currentLanguages.includes(lang)}
          onChange={(e) => {
            const isChecked = e.target.checked;
            setCurrentLanguages(prev => {
              if (isChecked && prev.length >= 5) {
                toast({
                  title: "Maximum of 5 translations allowed",
                  status: "warning",
                  duration: 3000,
                  isClosable: true,
                });
                return prev; // Do not add new translation if limit reached
              }
              return isChecked ? [...prev, lang] : prev.filter(l => l !== lang);
            });
          }}
        >
          <Text color={modalBodyTextColor}>{translationNames[lang]}</Text>
        </Checkbox>
      </GridItem>
    ))}
  </Grid>
</FormControl>


              {/* Tafsir Selection */}
              <FormControl mt={4}>
                <FormLabel color={modalBodyTextColor}>Select Tafsirs</FormLabel>
                <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={3}>
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
                        <Text color={modalBodyTextColor}>{tafsirNames[key]}</Text>
                      </Checkbox>
                    </GridItem>
                  ))}
                </Grid>
                <Button
                  mt={4}
                  size="sm"
                  onClick={() => {
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

              {/* Arabic Font Size Slider */}
              <FormControl>
                <FormLabel color={modalBodyTextColor}>Arabic Font Size: {arabicFontSize}px</FormLabel>
                <Slider
                  aria-label="slider-arabic-font-size"
                  defaultValue={arabicFontSize}
                  min={20}
                  max={60}
                  step={1}
                  onChange={(val) => setArabicFontSize(val)}
                >
                  <SliderTrack bg={inputBorder}>
                    <SliderFilledTrack bg="brand.500" />
                  </SliderTrack>
                  <SliderThumb borderColor="brand.500" />
                </Slider>
              </FormControl>

              {/* Translation Font Size Slider */}
              <FormControl>
                <FormLabel color={modalBodyTextColor}>Translation Font Size: {translationFontSize}px</FormLabel>
                <Slider
                  aria-label="slider-translation-font-size"
                  defaultValue={translationFontSize}
                  min={12}
                  max={30}
                  step={1}
                  onChange={(val) => setTranslationFontSize(val)}
                >
                  <SliderTrack bg={inputBorder}>
                    <SliderFilledTrack bg="brand.500" />
                  </SliderTrack>
                  <SliderThumb borderColor="brand.500" />
                </Slider>
              </FormControl>

              {/* Removed Highlight Color Picker */}
            </Stack>
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px" borderColor={modalHeaderBorderColor}>
            <Button variant="outline" mr={3} onClick={onClose} borderColor={borderColor} color={modalBodyTextColor}>
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
        <ModalContent bg={modalBg}>
          <ModalHeader borderBottomWidth="1px" borderColor={modalHeaderBorderColor} color={optionColor}>Your Favorite Surahs</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {favorites.length === 0 ? (
              <Text color={modalBodyTextColor}>No favorites added yet.</Text>
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
                    borderColor={borderColor}
                  >
                    <Box>
                      <Text fontWeight="bold" color={optionColor}>
                        {fav.surahNumber}. {fav.englishName} ({fav.name})
                      </Text>
                      <Text fontSize="sm" color={modalBodyTextColor}>
                        Ayahs: {fav.numberOfAyahs}
                      </Text>
                      <Text fontSize="xs" color={modalBodyTextColor}>
                        Added: {new Date(fav.timestamp).toLocaleDateString()}
                      </Text>
                    </Box>
                    <Flex>
                      <Button size="sm" colorScheme="blue" mr={2} onClick={() => loadFavoriteSurah(fav)}>
                        Load
                      </Button>
                      <IconButton
                        icon={<MdDelete />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => setFavorites(favorites.filter(f => f.surahNumber !== fav.surahNumber))}
                        aria-label="Delete favorite"
                      />
                    </Flex>
                  </Flex>
                ))}
              </Stack>
            )}
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={modalHeaderBorderColor}>
            <Button onClick={onFavoritesClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Memorization Sets Modal */}
      <Modal isOpen={isMemorizationSetsOpen} onClose={onMemorizationSetsClose} size="lg">
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader borderBottomWidth="1px" borderColor={modalHeaderBorderColor} color={optionColor}>Saved Memorization Sets</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {memorizationSets.length === 0 ? (
              <Text color={modalBodyTextColor}>No memorization sets saved yet.</Text>
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
                    borderColor={borderColor}
                  >
                    <Box>
                      <Text fontWeight="bold" color={optionColor}>
                        {set.surahName}: Ayahs {set.rangeStart}-{set.rangeEnd} ({set.numberOfAyahs} Ayahs)
                      </Text>
                      <Text fontSize="sm" color={modalBodyTextColor}>
                        Saved: {new Date(set.timestamp).toLocaleDateString()}
                      </Text>
                    </Box>
                    <Flex>
                      <Button size="sm" colorScheme="blue" mr={2} onClick={() => loadSavedSet(set)}>
                        Load
                      </Button>
                      {/* NEW: Share button for each memorization set */}
                      <Tooltip label="Copy shareable link">
                        <IconButton
                          icon={<FaShare />}
                          size="sm"
                          colorScheme="green"
                          mr={2}
                          onClick={() => handleShareSet(set)}
                          aria-label="Share memorization set"
                        />
                      </Tooltip>
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
          <ModalFooter borderTopWidth="1px" borderColor={modalHeaderBorderColor}>
            <Button onClick={onMemorizationSetsClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* NEW: End-of-Surah Modal */}
      <Modal isOpen={isEndOfSurahPromptOpen} onClose={onEndOfSurahPromptClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={modalBg}>
          <ModalHeader>End of Surah</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              You have reached the end of Surah {surahInfo?.englishName}.
            </Text>
            {/* NEW: Dropdown for replay count */}
            <FormControl mt={4}>
              <FormLabel>Replay count</FormLabel>
              <Select value={replayCount} onChange={(e) => setReplayCount(Number(e.target.value))}>
                <option value={1}>1 time</option>
                <option value={3}>3 times</option>
                <option value={5}>5 times</option>
                <option value={-1}>Indefinitely</option>
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            {/* MODIFIED: Replay button now uses the selected replayCount */}
            <Button colorScheme="green" mr={3} onClick={() => replayCurrentSurah(replayCount)}>
              Replay Surah
            </Button>
            <Button colorScheme="blue" onClick={playNextSurah}>
              Next Surah
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default QuranReaderPage;